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

function normalizeComponents(value) {
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

  return [];
}

function getEquipmentProfile(name = "", code = "", category = "LAPTOP") {
  const title = String(name);
  const qrCode = String(code);

  if (category === "ARDUINO") {
    return {
      location: "컴퓨터공학과 사무실 실습 키트 보관장 A",
      components: ["Arduino Uno 보드", "USB 케이블", "브레드보드", "점퍼 케이블", "기본 센서 세트"],
      description: `${title}입니다. 회로 기초 실습, 센서 제어, 팀 프로젝트 시연에 사용하는 공용 아두이노 키트입니다.`,
    };
  }

  if (category === "RASPBERRY_PI") {
    return {
      location: "컴퓨터공학과 사무실 IoT 장비 보관장 B",
      components: ["라즈베리파이 보드", "전원 어댑터", "HDMI 케이블", "microSD 카드", "방열 케이스"],
      description: `${title}입니다. 리눅스와 IoT 서버, 네트워크 실습에 사용하는 공용 라즈베리파이 키트입니다.`,
    };
  }

  if (title.includes("맥북") || qrCode.includes("MAC")) {
    return {
      location: "컴퓨터공학과 사무실 노트북 캐비닛 M",
      components: ["MacBook 본체", "USB-C 충전기", "보호 파우치"],
      description: `${title}입니다. 발표, iOS 및 프로젝트 시연, 고성능 개발 실습에 사용하는 공용 MacBook 장비입니다.`,
    };
  }

  if (title.includes("갤럭시북") || qrCode.includes("GAL")) {
    return {
      location: "컴퓨터공학과 사무실 노트북 캐비닛 G",
      components: ["Galaxy Book 본체", "전용 충전기", "무선 마우스"],
      description: `${title}입니다. 윈도우 기반 개발, 발표, 문서 작업에 사용하는 공용 Galaxy Book 장비입니다.`,
    };
  }

  return {
    location: CATEGORY_META[category]?.location || "컴퓨터공학과 사무실",
    components: CATEGORY_META[category]?.components || [],
    description: CATEGORY_META[category]?.description || "기자재 설명이 없습니다.",
  };
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
  const name = equipment.name || equipment.item_name || "기자재";
  const profile = getEquipmentProfile(name, code, category);
  const components = normalizeComponents(equipment.components);

  return {
    id,
    name,
    category,
    code,
    qrValue: equipment.qrValue || equipment.qr_value || equipment.qr_code_value || code,
    status,
    location: equipment.location || profile.location || "보관 위치 미등록",
    components: components.length ? components : profile.components,
    description: equipment.description || profile.description,
    imageSource: getEquipmentImage(category),
    statusLabel: getStatusLabel(status),
  };
}

function normalizeRental(rental = {}) {
  const rentalStatus = rental.status || "RENTED";
  const dueDate = rental.dueDate || rental.due_date || rental.dueAt || rental.due_at;
  const rentedAt = rental.rentDate || rental.rent_date || rental.rented_at || rental.request_date;

  return {
    id: rental.id || rental.rental_id,
    equipmentId: rental.equipmentId || rental.equipment_id || rental.item_id,
    userId: rental.userId || rental.user_id,
    title: rental.equipmentName || rental.equipment_name || rental.item_name || "대여 기자재",
    category: normalizeCategory(rental.category, rental.qr_code_value),
    code: rental.equipmentCode || rental.equipment_code || rental.qr_code_value || rental.item_code || "-",
    period: dueDate ? `${rentedAt ? `대여 ${rentedAt} / ` : ""}반납 예정 ${dueDate}` : "반납일 미정",
    dueDate,
    rentedAt,
    returnedAt: rental.returned_at || rental.returnedAt || null,
    status: rentalStatus,
    statusLabel: getStatusLabel(rentalStatus),
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

function normalizeUser(rawUser, fallbackStudentId) {
  return {
    id: rawUser?.id || rawUser?.user_id || null,
    name: rawUser?.name || "사용자",
    studentId: rawUser?.studentId || rawUser?.student_id || fallbackStudentId,
    department: rawUser?.department || "컴퓨터공학과",
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
  getStatusColors,
  getStatusLabel,
  normalizeEquipment,
  normalizeNotification,
  normalizeRental,
  normalizeUser,
};
