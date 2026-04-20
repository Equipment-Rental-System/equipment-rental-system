import { Platform } from "react-native";

export function getDefaultDueDate(days = 7) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export function formatDate(value) {
  if (!value) {
    return "-";
  }

  return String(value).slice(0, 10);
}

export function getErrorMessage(error, fallback = "요청 처리 중 오류가 발생했습니다.") {
  return error?.data?.message || error?.message || fallback;
}

export function joinComponents(components) {
  if (!Array.isArray(components) || components.length === 0) {
    return "구성품 정보 없음";
  }

  return components.join(", ");
}

export function formatRelativePlatformLabel() {
  return Platform.OS === "ios" ? "iPhone" : "Android";
}

export function translateStatus(status) {
  const map = {
    AVAILABLE: "대여 가능",
    RENTAL_PENDING: "대여 승인 대기",
    RENTED: "대여 중",
    RETURN_PENDING: "반납 대기",
    INSPECTION_REQUIRED: "점검 필요",
    REPAIR: "수리 중",
    OVERDUE: "연체",
    REQUESTED: "요청됨",
    APPROVED: "승인됨",
    REJECTED: "거절됨",
    EXTENSION_REQUESTED: "연장 요청",
    EXTENSION_APPROVED: "연장 승인",
    EXTENSION_REJECTED: "연장 거절",
    RETURNED: "반납 완료",
    PENDING: "승인 대기",
  };

  return map[status] || status || "-";
}
