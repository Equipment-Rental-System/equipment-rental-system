import {
  API_BASES,
  CATEGORY_ROUTE_GROUPS,
  EQUIPMENT_ROUTE_CANDIDATES,
  LOGIN_ROUTE_CANDIDATES,
  RENTAL_LIST_ROUTE_CANDIDATES,
  RENTAL_REQUEST_CANDIDATES,
} from "../constants/appConstants";
import { normalizeEquipment, normalizeRental } from "../utils/normalizers";

async function requestJson(baseUrl, path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, options);
  let payload = null;

  try {
    payload = await response.json();
  } catch (error) {
    payload = null;
  }

  if (!response.ok) {
    const message = payload?.message || "요청 처리 중 오류가 발생했습니다.";
    throw new Error(message);
  }

  return payload;
}

async function loginAgainstBackend(studentId, password) {
  let lastError = new Error("백엔드 서버에 연결할 수 없습니다.");

  for (const baseUrl of API_BASES) {
    for (const path of LOGIN_ROUTE_CANDIDATES) {
      try {
        const payload = await requestJson(baseUrl, path, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ studentId, password }),
        });

        return { baseUrl, payload };
      } catch (error) {
        lastError = error;
      }
    }
  }

  throw lastError;
}

async function fetchEquipments(baseUrl, token) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  let lastError = new Error("기자재 목록을 불러오지 못했습니다.");

  for (const path of EQUIPMENT_ROUTE_CANDIDATES) {
    try {
      const payload = await requestJson(baseUrl, path, { headers });
      const rows = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data)
          ? payload.data
          : [];

      if (rows.length || path === EQUIPMENT_ROUTE_CANDIDATES[EQUIPMENT_ROUTE_CANDIDATES.length - 1]) {
        return rows.map(normalizeEquipment);
      }
    } catch (error) {
      lastError = error;
    }
  }

  for (const group of CATEGORY_ROUTE_GROUPS) {
    const results = await Promise.allSettled(
      group.map((path) => requestJson(baseUrl, path, { headers }))
    );

    const rows = results.flatMap((result) => {
      if (result.status !== "fulfilled") {
        lastError = result.reason;
        return [];
      }

      const payload = result.value;
      if (Array.isArray(payload)) {
        return payload;
      }
      if (Array.isArray(payload?.data)) {
        return payload.data;
      }
      if (Array.isArray(payload?.items)) {
        return payload.items;
      }
      return [];
    });

    if (rows.length) {
      return rows.map(normalizeEquipment);
    }
  }

  throw lastError;
}

async function fetchRentals(baseUrl, token) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  let lastError = new Error("대여 현황을 불러오지 못했습니다.");

  for (const path of RENTAL_LIST_ROUTE_CANDIDATES) {
    try {
      const payload = await requestJson(baseUrl, path, { headers });
      const rows = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data)
          ? payload.data
          : [];

      return rows.map(normalizeRental);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}

async function createRentalRequest(baseUrl, token, equipmentId, dueDate, note) {
  const headers = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let lastError = new Error("대여 요청을 전송하지 못했습니다.");

  for (const candidate of RENTAL_REQUEST_CANDIDATES) {
    const body =
      candidate.bodyType === "item"
        ? { itemId: equipmentId, item_id: equipmentId, dueAt: dueDate, due_at: dueDate, note }
        : { equipmentId, dueDate, note };

    try {
      return await requestJson(baseUrl, candidate.path, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}

export { loginAgainstBackend, fetchEquipments, fetchRentals, createRentalRequest };
