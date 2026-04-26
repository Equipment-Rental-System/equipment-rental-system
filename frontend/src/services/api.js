import {
  ADMIN_ISSUE_ROUTE_CANDIDATES,
  ADMIN_RENTAL_ROUTE_CANDIDATES,
  API_BASES,
  CATEGORY_ROUTE_GROUPS,
  EQUIPMENT_ROUTE_CANDIDATES,
  LOGIN_ROUTE_CANDIDATES,
  NOTIFICATION_LIST_ROUTE_CANDIDATES,
  NOTIFICATION_READ_ROUTE_CANDIDATES,
  QR_LOOKUP_ROUTE_CANDIDATES,
  QR_SCAN_ROUTE_CANDIDATES,
  RENTAL_LIST_ROUTE_CANDIDATES,
  RENTAL_REQUEST_CANDIDATES,
} from "../constants/appConstants";
import {
  normalizeEquipment,
  normalizeIssue,
  normalizeNotification,
  normalizeRental,
} from "../utils/normalizers";

function authHeaders(token, extra = {}) {
  return token ? { ...extra, Authorization: `Bearer ${token}` } : extra;
}

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

function extractRows(payload, keys = []) {
  if (Array.isArray(payload)) {
    return payload;
  }

  for (const key of keys) {
    if (Array.isArray(payload?.[key])) {
      return payload[key];
    }
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (Array.isArray(payload?.items)) {
    return payload.items;
  }

  return [];
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
  const headers = authHeaders(token);
  let lastError = new Error("기자재 목록을 불러오지 못했습니다.");

  for (const path of EQUIPMENT_ROUTE_CANDIDATES) {
    try {
      const payload = await requestJson(baseUrl, path, { headers });
      const rows = extractRows(payload, ["equipments", "items"]);

      if (rows.length) {
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

      return extractRows(result.value, ["equipments", "items"]);
    });

    if (rows.length) {
      return rows.map(normalizeEquipment);
    }
  }

  throw lastError;
}

async function fetchRentals(baseUrl, token) {
  const headers = authHeaders(token);
  let lastError = new Error("대여 현황을 불러오지 못했습니다.");

  for (const path of RENTAL_LIST_ROUTE_CANDIDATES) {
    try {
      const payload = await requestJson(baseUrl, path, { headers });
      const rows = extractRows(payload, ["rentals"]);
      return rows.map(normalizeRental);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}

async function fetchAdminRentals(baseUrl, token) {
  const headers = authHeaders(token);
  let lastError = new Error("관리자 대여 조회를 불러오지 못했습니다.");

  for (const path of ADMIN_RENTAL_ROUTE_CANDIDATES) {
    try {
      const payload = await requestJson(baseUrl, path, { headers });
      return extractRows(payload, ["rentals"]).map(normalizeRental);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}

async function fetchAdminIssues(baseUrl, token) {
  const headers = authHeaders(token);
  let lastError = new Error("이슈 로그를 불러오지 못했습니다.");

  for (const path of ADMIN_ISSUE_ROUTE_CANDIDATES) {
    try {
      const payload = await requestJson(baseUrl, path, { headers });
      return extractRows(payload, ["issues"]).map(normalizeIssue);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}

async function fetchNotifications(baseUrl, token) {
  const headers = authHeaders(token);
  let lastError = new Error("알림 목록을 불러오지 못했습니다.");

  for (const path of NOTIFICATION_LIST_ROUTE_CANDIDATES) {
    try {
      const payload = await requestJson(baseUrl, path, { headers });
      return extractRows(payload, ["notifications"]).map(normalizeNotification);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}

async function markNotificationRead(baseUrl, token, notificationId) {
  const headers = authHeaders(token, { "Content-Type": "application/json" });
  let lastError = new Error("알림 읽음 처리를 완료하지 못했습니다.");

  for (const template of NOTIFICATION_READ_ROUTE_CANDIDATES) {
    const path = template.replace("{id}", encodeURIComponent(notificationId));

    try {
      return await requestJson(baseUrl, path, {
        method: "PUT",
        headers,
      });
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}

async function createRentalRequest(baseUrl, token, equipmentId, dueDate, note) {
  const headers = authHeaders(token, { "Content-Type": "application/json" });
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

async function verifyQrScan(baseUrl, token, qrCodeValue) {
  const headers = authHeaders(token, { "Content-Type": "application/json" });
  let lastError = new Error("QR 인증 요청을 처리하지 못했습니다.");

  for (const path of QR_SCAN_ROUTE_CANDIDATES) {
    try {
      const payload = await requestJson(baseUrl, path, {
        method: "POST",
        headers,
        body: JSON.stringify({ qrCodeValue }),
      });

      return {
        action: payload?.action || null,
        item: payload?.item ? normalizeEquipment(payload.item) : null,
        payload,
      };
    } catch (error) {
      lastError = error;
    }
  }

  for (const template of QR_LOOKUP_ROUTE_CANDIDATES) {
    const path = template.replace("{value}", encodeURIComponent(qrCodeValue));

    try {
      const payload = await requestJson(baseUrl, path, {
        method: "GET",
        headers: authHeaders(token),
      });

      const item = payload ? normalizeEquipment(payload.item || payload.equipment || payload) : null;
      return {
        action: item?.status === "AVAILABLE" ? "RENT" : null,
        item,
        payload,
      };
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}

export {
  loginAgainstBackend,
  fetchEquipments,
  fetchRentals,
  fetchAdminRentals,
  fetchAdminIssues,
  fetchNotifications,
  markNotificationRead,
  createRentalRequest,
  verifyQrScan,
};
