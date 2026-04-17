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

export function showPlatformAlert(message) {
  return Platform.OS === "ios" ? message : message;
}
