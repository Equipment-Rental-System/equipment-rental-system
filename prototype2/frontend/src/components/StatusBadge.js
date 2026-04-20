import { StyleSheet, Text, View } from "react-native";

export const STATUS_META = {
  AVAILABLE: { label: "대여 가능", bg: "#e7f6ef", color: "#1d8a60" },
  RENTAL_PENDING: { label: "대여 승인 대기", bg: "#eef2ff", color: "#3456c0" },
  RENTED: { label: "대여 중", bg: "#e7f0ff", color: "#1d5eff" },
  RETURN_PENDING: { label: "반납 대기", bg: "#fff3df", color: "#c57a00" },
  INSPECTION_REQUIRED: { label: "점검 필요", bg: "#fff5d8", color: "#8f6a00" },
  REPAIR: { label: "수리 중", bg: "#fdecee", color: "#c23f4f" },
  OVERDUE: { label: "연체", bg: "#ffe2e6", color: "#b83242" },
  REQUESTED: { label: "요청됨", bg: "#eef2ff", color: "#3456c0" },
  APPROVED: { label: "승인됨", bg: "#e7f6ef", color: "#1d8a60" },
  REJECTED: { label: "거절됨", bg: "#fdecee", color: "#c23f4f" },
  EXTENSION_REQUESTED: { label: "연장 요청", bg: "#eef2ff", color: "#3456c0" },
  EXTENSION_APPROVED: { label: "연장 승인", bg: "#e7f6ef", color: "#1d8a60" },
  EXTENSION_REJECTED: { label: "연장 거절", bg: "#fdecee", color: "#c23f4f" },
  RETURNED: { label: "반납 완료", bg: "#e7f6ef", color: "#1d8a60" },
  PENDING: { label: "승인 대기", bg: "#fff3df", color: "#c57a00" },
  APPROVAL: { label: "승인 알림", bg: "#eef2ff", color: "#3456c0" },
  REJECTED_ACCOUNT: { label: "승인 거절", bg: "#fdecee", color: "#c23f4f" },
};

export function getStatusMeta(status) {
  return STATUS_META[status] || { label: status || "-", bg: "#eef2f6", color: "#44566c" };
}

export default function StatusBadge({ status }) {
  const mapped = getStatusMeta(status);

  return (
    <View style={[styles.badge, { backgroundColor: mapped.bg }]}>
      <Text style={[styles.text, { color: mapped.color }]}>{mapped.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: "flex-start",
  },
  text: {
    fontSize: 12,
    fontWeight: "700",
  },
});
