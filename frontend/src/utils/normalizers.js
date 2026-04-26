import { CATEGORY_META } from "../constants/appConstants";

function getEquipmentImage(category) {
  return CATEGORY_META[category]?.image || CATEGORY_META.LAPTOP.image;
}

function normalizeCategory(value, code = "") {
  const raw = String(value || "").trim().toUpperCase();

  if (raw === "RASPBERRY_PI" || raw === "RASPBERRYPI") {
    return "RASPBERRY_PI";
  }

  if (raw === "ARDUINO" || raw === "LAPTOP") {
    return raw;
  }

  if (String(code).startsWith("EQ-ARD")) {
    return "ARDUINO";
  }

  if (String(code).startsWith("EQ-RPI")) {
    return "RASPBERRY_PI";
  }

  return "LAPTOP";
}

function normalizeComponents(value, category) {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.filter(Boolean);
      }
    } catch (error) {
      return value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }

  return CATEGORY_META[category]?.components || [];
}

function getStatusLabel(status) {
  const map = {
    AVAILABLE: "대여 가능",
    RENTAL_PENDING: "승인 대기",
    RENTED: "대여 중",
    RETURN_PENDING: "반납 대기",
    INSPECTION_REQUIRED: "점검 필요",
    REPAIR: "수리 중",
    OVERDUE: "연체",
    LOST: "분실",
    BROKEN: "파손",
    PARTIAL_LOST: "일부 분실",
    REQUESTED: "승인 대기",
    RETURNED: "반납 완료",
  };

  return map[status] || status || "상태 없음";
}

function getStatusColors(status) {
  const palette = {
    AVAILABLE: { bg: "#35c98e", text: "#ffffff" },
    RENTAL_PENDING: { bg: "#3b82f6", text: "#ffffff" },
    RENTED: { bg: "#475569", text: "#ffffff" },
    RETURN_PENDING: { bg: "#f97316", text: "#ffffff" },
    INSPECTION_REQUIRED: { bg: "#a855f7", text: "#ffffff" },
    REPAIR: { bg: "#ef4444", text: "#ffffff" },
    OVERDUE: { bg: "#ef4444", text: "#ffffff" },
    LOST: { bg: "#ef4444", text: "#ffffff" },
    BROKEN: { bg: "#7c3aed", text: "#ffffff" },
    PARTIAL_LOST: { bg: "#f59e0b", text: "#ffffff" },
    REQUESTED: { bg: "#3b82f6", text: "#ffffff" },
    RETURNED: { bg: "#10b981", text: "#ffffff" },
  };

  return palette[status] || { bg: "#cbd5e1", text: "#0f172a" };
}

function normalizeEquipment(equipment = {}) {
  const id = equipment.id || equipment.item_id;
  const code =
    equipment.code ||
    equipment.qrValue ||
    equipment.qr_value ||
    equipment.qr_code_value ||
    (id ? `EQ-ITEM-${id}` : "EQ-UNKNOWN");
  const category = normalizeCategory(equipment.category, code);
  const status = equipment.status || "AVAILABLE";

  return {
    id,
    name: equipment.name || equipment.item_name || "기자재",
    category,
    code,
    qrValue: equipment.qrValue || equipment.qr_value || equipment.qr_code_value || code,
    status,
    location: equipment.location || CATEGORY_META[category]?.location || "보관 위치 미등록",
    components: normalizeComponents(equipment.components, category),
    description: equipment.description || CATEGORY_META[category]?.description || "기자재 설명이 없습니다.",
    imageSource: getEquipmentImage(category),
    statusLabel: getStatusLabel(status),
  };
}

function normalizeRental(rental = {}) {
  const rentalStatus = rental.status || "REQUESTED";
  const dueDate = rental.dueDate || rental.due_date || rental.dueAt || rental.due_at;
  const rentedAt = rental.rentDate || rental.rent_date || rental.rented_at || rental.request_date;

  return {
    id: rental.id || rental.rental_id,
    equipmentId: rental.equipmentId || rental.equipment_id || rental.item_id,
    userId: rental.userId || rental.user_id,
    userName: rental.userName || rental.user_name || rental.name || "",
    studentId: rental.studentId || rental.student_id || "",
    title: rental.equipmentName || rental.equipment_name || rental.item_name || "대여 기자재",
    category: normalizeCategory(rental.category, rental.qr_code_value),
    code: rental.equipmentCode || rental.equipment_code || rental.qr_code_value || rental.item_code || "-",
    period: dueDate
      ? `${rentedAt ? `대여 ${rentedAt} · ` : ""}반납 예정 ${dueDate}`
      : "반납일 미정",
    dueDate,
    rentedAt,
    returnedAt: rental.returned_at || rental.returnedAt || null,
    status: rentalStatus,
    statusLabel: getStatusLabel(
      rentalStatus === "REQUESTED"
        ? "RENTAL_PENDING"
        : rental.equipmentStatus || rental.equipment_status || rentalStatus
    ),
  };
}

function normalizeNotification(notification = {}) {
  return {
    id: notification.id || notification.notification_id,
    type: notification.type || "INFO",
    title: getNotificationTitle(notification.type),
    message: notification.message || "알림 내용이 없습니다.",
    isRead: Boolean(notification.is_read || notification.isRead),
    createdAt: notification.created_at || notification.createdAt || "",
  };
}

function normalizeIssue(issue = {}) {
  return {
    id: issue.issue_id || issue.id,
    rentalId: issue.rental_id || issue.rentalId,
    itemId: issue.item_id || issue.itemId,
    itemName: issue.item_name || issue.itemName || "기자재",
    category: normalizeCategory(issue.category),
    issueType: issue.issue_type || issue.issueType || "ISSUE",
    description: issue.description || "상세 내용 없음",
    createdAt: issue.created_at || issue.createdAt || "",
    userName: issue.name || issue.user_name || "",
    studentId: issue.student_id || issue.studentId || "",
  };
}

function normalizeUser(rawUser, fallbackStudentId) {
  return {
    id: rawUser?.id || rawUser?.user_id || null,
    name: rawUser?.name || "사용자",
    studentId: rawUser?.studentId || rawUser?.student_id || fallbackStudentId,
    department: rawUser?.department || rawUser?.email || "학과 정보 없음",
    role: rawUser?.role || "USER",
  };
}

function getNotificationTitle(type) {
  const map = {
    RETURNED: "반납 처리 완료",
    OVERDUE: "연체 알림",
    LOST: "분실 처리",
    PARTIAL_LOST: "일부 분실 처리",
    BROKEN: "파손 처리",
    ACCOUNT_APPROVED: "계정 승인",
    ACCOUNT_REJECTED: "계정 거절",
  };

  return map[type] || "알림";
}

export {
  getEquipmentImage,
  getStatusLabel,
  getStatusColors,
  normalizeEquipment,
  normalizeRental,
  normalizeNotification,
  normalizeIssue,
  normalizeUser,
};
