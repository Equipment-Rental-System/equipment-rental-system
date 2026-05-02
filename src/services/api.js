import {
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
  SIGNUP_ROUTE_CANDIDATES,
} from "../constants/appConstants";
import { normalizeEquipment, normalizeNotification, normalizeRental } from "../utils/normalizers";

function authHeaders(token, extra = {}) {
  return token ? { ...extra, Authorization: `Bearer ${token}` } : extra;
}

async function requestJson(baseUrl, routePath, options = {}) {
  const response = await fetch(`${baseUrl}${routePath}`, options);
  let payload = null;

  try {
    payload = await response.json();
  } catch (error) {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(payload?.message || "요청 처리 중 오류가 발생했습니다.");
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

async function signupAgainstBackend(form) {
  let lastError = new Error("회원가입 서버에 연결할 수 없습니다.");

  for (const baseUrl of API_BASES) {
    for (const routePath of SIGNUP_ROUTE_CANDIDATES) {
      try {
        const body = new FormData();
        body.append("student_id", form.studentId);
        body.append("name", form.name);
        body.append("email", form.email);
        body.append("password", form.password);
        body.append("verification_image", {
          uri: form.image.uri,
          name: form.image.fileName || `student-card-${Date.now()}.jpg`,
          type: form.image.mimeType || "image/jpeg",
        });

        const payload = await requestJson(baseUrl, routePath, {
          method: "POST",
          body,
        });

        return { baseUrl, payload };
      } catch (error) {
        lastError = error;
      }
    }
  }

  throw lastError;
}

async function loginAgainstBackend(studentId, password) {
  let lastError = new Error("백엔드 서버에 연결할 수 없습니다.");

  for (const baseUrl of API_BASES) {
    for (const routePath of LOGIN_ROUTE_CANDIDATES) {
      try {
        const payload = await requestJson(baseUrl, routePath, {
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

  for (const routePath of EQUIPMENT_ROUTE_CANDIDATES) {
    try {
      const payload = await requestJson(baseUrl, routePath, { headers });
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
      group.map((routePath) => requestJson(baseUrl, routePath, { headers }))
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
  let lastError = new Error("대여 내역을 불러오지 못했습니다.");

  for (const routePath of RENTAL_LIST_ROUTE_CANDIDATES) {
    try {
      const payload = await requestJson(baseUrl, routePath, { headers });
      return extractRows(payload, ["rentals"]).map(normalizeRental);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}

async function fetchNotifications(baseUrl, token) {
  const headers = authHeaders(token);
  let lastError = new Error("알림 목록을 불러오지 못했습니다.");

  for (const routePath of NOTIFICATION_LIST_ROUTE_CANDIDATES) {
    try {
      const payload = await requestJson(baseUrl, routePath, { headers });
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
    const routePath = template.replace("{id}", encodeURIComponent(notificationId));

    try {
      return await requestJson(baseUrl, routePath, {
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
    const body = { itemId: equipmentId, item_id: equipmentId, dueAt: dueDate, due_at: dueDate, note };

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

  for (const routePath of QR_SCAN_ROUTE_CANDIDATES) {
    try {
      const payload = await requestJson(baseUrl, routePath, {
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
    const routePath = template.replace("{value}", encodeURIComponent(qrCodeValue));

    try {
      const payload = await requestJson(baseUrl, routePath, {
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

async function fetchAdminDashboard(baseUrl, token) {
  return requestJson(baseUrl, "/admin/dashboard", {
    headers: authHeaders(token),
  });
}

async function fetchAdminPendingUsers(baseUrl, token) {
  const payload = await requestJson(baseUrl, "/admin/pending-users", {
    headers: authHeaders(token),
  });

  return extractRows(payload, ["users", "data"]);
}

async function approveAdminUser(baseUrl, token, userId) {
  return requestJson(baseUrl, `/admin/approve/${encodeURIComponent(userId)}`, {
    method: "PUT",
    headers: authHeaders(token, { "Content-Type": "application/json" }),
  });
}

async function rejectAdminUser(baseUrl, token, userId) {
  return requestJson(baseUrl, `/admin/reject/${encodeURIComponent(userId)}`, {
    method: "PUT",
    headers: authHeaders(token, { "Content-Type": "application/json" }),
  });
}

async function fetchAdminItems(baseUrl, token) {
  const payload = await requestJson(baseUrl, "/admin/items", {
    headers: authHeaders(token),
  });

  return extractRows(payload, ["data", "items"]).map(normalizeEquipment);
}

async function updateAdminItem(baseUrl, token, itemId, body) {
  return requestJson(baseUrl, `/admin/update-item/${encodeURIComponent(itemId)}`, {
    method: "PUT",
    headers: authHeaders(token, { "Content-Type": "application/json" }),
    body: JSON.stringify(body),
  });
}

async function fetchAdminRentals(baseUrl, token) {
  const payload = await requestJson(baseUrl, "/admin/rentals", {
    headers: authHeaders(token),
  });

  return extractRows(payload, ["data", "rentals"]);
}

async function fetchAdminIssues(baseUrl, token) {
  const payload = await requestJson(baseUrl, "/admin/issues", {
    headers: authHeaders(token),
  });

  return extractRows(payload, ["data", "issues"]);
}

async function completeAdminReturn(baseUrl, token, rentalId, issueType = null, description = "") {
  return requestJson(baseUrl, `/admin/return/${encodeURIComponent(rentalId)}`, {
    method: "PUT",
    headers: authHeaders(token, { "Content-Type": "application/json" }),
    body: JSON.stringify({
      issue_type: issueType,
      description,
    }),
  });
}

export {
  approveAdminUser,
  completeAdminReturn,
  createRentalRequest,
  fetchAdminDashboard,
  fetchAdminIssues,
  fetchAdminItems,
  fetchAdminPendingUsers,
  fetchAdminRentals,
  fetchEquipments,
  fetchNotifications,
  fetchRentals,
  loginAgainstBackend,
  markNotificationRead,
  rejectAdminUser,
  signupAgainstBackend,
  updateAdminItem,
  verifyQrScan,
};
