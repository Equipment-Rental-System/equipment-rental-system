import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import {
  approveAdminUser,
  completeAdminReturn,
  fetchAdminDashboard,
  fetchAdminIssues,
  fetchAdminItems,
  fetchAdminPendingUsers,
  fetchAdminRentals,
  rejectAdminUser,
  updateAdminItem,
} from "../services/api";
import { getStatusColors, getStatusLabel } from "../utils/normalizers";

const TABS = [
  { key: "dashboard", label: "대시보드", icon: "speedometer-outline" },
  { key: "users", label: "회원 승인", icon: "people-outline" },
  { key: "items", label: "기자재", icon: "cube-outline" },
  { key: "rentals", label: "대여 관리", icon: "clipboard-text-outline", material: true },
  { key: "issues", label: "이슈 로그", icon: "alert-circle-outline", material: true },
];

function formatDate(value) {
  if (!value) {
    return "-";
  }

  return String(value).replace("T", " ").slice(0, 16);
}

function StatusPill({ status }) {
  const colors = getStatusColors(status);

  return (
    <View style={[adminStyles.statusPill, { backgroundColor: colors.bg }]}>
      <Text style={[adminStyles.statusPillText, { color: colors.text }]}>{getStatusLabel(status)}</Text>
    </View>
  );
}

function EmptyState({ text }) {
  return (
    <View style={adminStyles.emptyBox}>
      <Text style={adminStyles.emptyText}>{text}</Text>
    </View>
  );
}

export default function AdminScreen({ apiBase, token, user, onLogout }) {
  const [tab, setTab] = useState("dashboard");
  const [loading, setLoading] = useState(false);
  const [dashboard, setDashboard] = useState(null);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [items, setItems] = useState([]);
  const [rentals, setRentals] = useState([]);
  const [issues, setIssues] = useState([]);

  const activeRentals = useMemo(
    () => rentals.filter((item) => item.status === "RENTED" || item.status === "OVERDUE"),
    [rentals]
  );

  async function loadAdminData(nextTab = tab) {
    setLoading(true);

    try {
      if (nextTab === "dashboard") {
        const [dashboardPayload, pendingRows, rentalRows] = await Promise.all([
          fetchAdminDashboard(apiBase, token),
          fetchAdminPendingUsers(apiBase, token),
          fetchAdminRentals(apiBase, token),
        ]);
        setDashboard(dashboardPayload);
        setPendingUsers(pendingRows);
        setRentals(rentalRows);
      }

      if (nextTab === "users") {
        setPendingUsers(await fetchAdminPendingUsers(apiBase, token));
      }

      if (nextTab === "items") {
        setItems(await fetchAdminItems(apiBase, token));
      }

      if (nextTab === "rentals") {
        setRentals(await fetchAdminRentals(apiBase, token));
      }

      if (nextTab === "issues") {
        setIssues(await fetchAdminIssues(apiBase, token));
      }
    } catch (error) {
      Alert.alert("관리자 데이터 조회 실패", error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAdminData(tab);
  }, [tab]);

  async function handleApprove(userId) {
    try {
      await approveAdminUser(apiBase, token, userId);
      Alert.alert("승인 완료", "회원가입 요청이 승인되었습니다.");
      await loadAdminData(tab);
    } catch (error) {
      Alert.alert("승인 실패", error.message);
    }
  }

  async function handleReject(userId) {
    try {
      await rejectAdminUser(apiBase, token, userId);
      Alert.alert("거절 완료", "회원가입 요청이 거절되었습니다.");
      await loadAdminData(tab);
    } catch (error) {
      Alert.alert("거절 실패", error.message);
    }
  }

  async function handleStatusChange(itemId, status) {
    try {
      await updateAdminItem(apiBase, token, itemId, { status });
      Alert.alert("상태 변경 완료", "기자재 상태를 업데이트했습니다.");
      await loadAdminData("items");
    } catch (error) {
      Alert.alert("상태 변경 실패", error.message);
    }
  }

  function openStatusMenu(item) {
    Alert.alert(`${item.name} 상태 변경`, "변경할 상태를 선택해주세요.", [
      { text: "대여 가능", onPress: () => handleStatusChange(item.id, "AVAILABLE") },
      { text: "대여 중", onPress: () => handleStatusChange(item.id, "RENTED") },
      { text: "분실", onPress: () => handleStatusChange(item.id, "LOST") },
      { text: "파손", onPress: () => handleStatusChange(item.id, "BROKEN") },
      { text: "일부 분실", onPress: () => handleStatusChange(item.id, "PARTIAL_LOST") },
      { text: "취소", style: "cancel" },
    ]);
  }

  async function handleReturn(rentalId, issueType = null) {
    try {
      await completeAdminReturn(apiBase, token, rentalId, issueType, issueType ? "관리자 확인 처리" : "");
      Alert.alert("반납 처리 완료", issueType ? "이슈 상태로 반납 처리되었습니다." : "정상 반납 처리되었습니다.");
      await loadAdminData("rentals");
    } catch (error) {
      Alert.alert("반납 처리 실패", error.message);
    }
  }

  function openReturnMenu(rental) {
    Alert.alert(`${rental.item_name} 반납 처리`, "실물 점검 결과를 선택해주세요.", [
      { text: "정상 반납", onPress: () => handleReturn(rental.rental_id, null) },
      { text: "파손", onPress: () => handleReturn(rental.rental_id, "BROKEN") },
      { text: "분실", onPress: () => handleReturn(rental.rental_id, "LOST") },
      { text: "일부 분실", onPress: () => handleReturn(rental.rental_id, "PARTIAL_LOST") },
      { text: "취소", style: "cancel" },
    ]);
  }

  function renderDashboard() {
    const summary = dashboard?.summary || {};
    const recentActivities = dashboard?.recentActivities || [];

    return (
      <>
        <View style={adminStyles.metricsColumn}>
          <Pressable style={[adminStyles.metricCard, adminStyles.metricBlue]} onPress={() => setTab("users")}>
            <Text style={adminStyles.metricLabel}>승인 대기 유저수</Text>
            <Text style={adminStyles.metricValue}>{summary.pendingUsers ?? pendingUsers.length}명</Text>
            <Text style={adminStyles.metricHint}>학생증 확인 및 가입 승인 처리</Text>
          </Pressable>
          <Pressable style={[adminStyles.metricCard, adminStyles.metricGreen]} onPress={() => setTab("rentals")}>
            <Text style={adminStyles.metricLabel}>대여 중인 기자재</Text>
            <Text style={adminStyles.metricValue}>{summary.rentingItems ?? activeRentals.length}건</Text>
            <Text style={adminStyles.metricHint}>반납 처리 및 실시간 상태 관리</Text>
          </Pressable>
        </View>

        <View style={adminStyles.panel}>
          <Text style={adminStyles.panelTitle}>최근 대여·반납 활동</Text>
          {recentActivities.length ? (
            recentActivities.map((activity, index) => (
              <View key={`${activity.itemName}-${index}`} style={adminStyles.row}>
                <View style={adminStyles.rowTextWrap}>
                  <Text style={adminStyles.rowTitle}>{activity.itemName}</Text>
                  <Text style={adminStyles.rowSub}>
                    {activity.userName} / {activity.studentId || "-"}
                  </Text>
                </View>
                <StatusPill status={activity.actionType} />
              </View>
            ))
          ) : (
            <EmptyState text="최근 활동 내역이 없습니다." />
          )}
        </View>
      </>
    );
  }

  function renderUsers() {
    return (
      <View style={adminStyles.panel}>
        <Text style={adminStyles.panelTitle}>회원가입 승인 대기</Text>
        {pendingUsers.length ? (
          pendingUsers.map((pending) => (
            <View key={pending.user_id} style={adminStyles.userCard}>
              <View style={adminStyles.rowTextWrap}>
                <Text style={adminStyles.rowTitle}>{pending.name}</Text>
                <Text style={adminStyles.rowSub}>{pending.student_id} / {pending.email || "이메일 없음"}</Text>
                <Text style={adminStyles.rowSub}>학생증 파일: {pending.verification_image || "미첨부"}</Text>
              </View>
              <View style={adminStyles.actionRow}>
                <Pressable style={[adminStyles.actionButton, adminStyles.rejectButton]} onPress={() => handleReject(pending.user_id)}>
                  <Text style={adminStyles.rejectText}>거절</Text>
                </Pressable>
                <Pressable style={[adminStyles.actionButton, adminStyles.approveButton]} onPress={() => handleApprove(pending.user_id)}>
                  <Text style={adminStyles.approveText}>승인</Text>
                </Pressable>
              </View>
            </View>
          ))
        ) : (
          <EmptyState text="승인 대기 중인 회원이 없습니다." />
        )}
      </View>
    );
  }

  function renderItems() {
    return (
      <View style={adminStyles.panel}>
        <Text style={adminStyles.panelTitle}>기자재 상태 관리</Text>
        {items.length ? (
          items.map((item) => (
            <View key={item.id} style={adminStyles.row}>
              <View style={adminStyles.rowTextWrap}>
                <Text style={adminStyles.rowTitle}>{item.name}</Text>
                <Text style={adminStyles.rowSub}>{item.code} / {item.category}</Text>
              </View>
              <View style={adminStyles.rowActions}>
                <StatusPill status={item.status} />
                <Pressable style={adminStyles.smallButton} onPress={() => openStatusMenu(item)}>
                  <Text style={adminStyles.smallButtonText}>변경</Text>
                </Pressable>
              </View>
            </View>
          ))
        ) : (
          <EmptyState text="등록된 기자재가 없습니다." />
        )}
      </View>
    );
  }

  function renderRentals() {
    return (
      <View style={adminStyles.panel}>
        <Text style={adminStyles.panelTitle}>대여 및 반납 관리</Text>
        {rentals.length ? (
          rentals.map((rental) => (
            <View key={rental.rental_id} style={adminStyles.row}>
              <View style={adminStyles.rowTextWrap}>
                <Text style={adminStyles.rowTitle}>{rental.item_name}</Text>
                <Text style={adminStyles.rowSub}>{rental.name} / {rental.student_id}</Text>
                <Text style={adminStyles.rowSub}>대여 {formatDate(rental.rented_at)} / 반납 예정 {formatDate(rental.due_at)}</Text>
              </View>
              <View style={adminStyles.rowActions}>
                <StatusPill status={rental.status} />
                {(rental.status === "RENTED" || rental.status === "OVERDUE") && (
                  <Pressable style={adminStyles.smallButton} onPress={() => openReturnMenu(rental)}>
                    <Text style={adminStyles.smallButtonText}>반납</Text>
                  </Pressable>
                )}
              </View>
            </View>
          ))
        ) : (
          <EmptyState text="대여 내역이 없습니다." />
        )}
      </View>
    );
  }

  function renderIssues() {
    return (
      <View style={adminStyles.panel}>
        <Text style={adminStyles.panelTitle}>이슈 로그</Text>
        {issues.length ? (
          issues.map((issue) => (
            <View key={issue.issue_id} style={adminStyles.row}>
              <View style={adminStyles.rowTextWrap}>
                <Text style={adminStyles.rowTitle}>{issue.item_name}</Text>
                <Text style={adminStyles.rowSub}>{issue.name} / {issue.student_id}</Text>
                <Text style={adminStyles.rowSub}>{issue.description || "상세 설명 없음"} / {formatDate(issue.created_at)}</Text>
              </View>
              <StatusPill status={issue.issue_type} />
            </View>
          ))
        ) : (
          <EmptyState text="등록된 이슈 로그가 없습니다." />
        )}
      </View>
    );
  }

  const content = {
    dashboard: renderDashboard,
    users: renderUsers,
    items: renderItems,
    rentals: renderRentals,
    issues: renderIssues,
  }[tab];

  return (
    <View style={adminStyles.container}>
      <View style={adminStyles.header}>
        <View>
          <Text style={adminStyles.brand}>동국대학교</Text>
          <Text style={adminStyles.title}>관리자 대시보드</Text>
          <Text style={adminStyles.subtitle}>{user?.name || "관리자"}님, 기자재와 회원 요청을 관리해주세요.</Text>
        </View>
        <Pressable style={adminStyles.logoutButton} onPress={onLogout}>
          <Ionicons name="log-out-outline" size={18} color="#334155" />
        </Pressable>
      </View>

      <View style={adminStyles.tabBar}>
        {TABS.map((item) => {
          const active = tab === item.key;
          const Icon = item.material ? MaterialCommunityIcons : Ionicons;

          return (
            <Pressable key={item.key} style={[adminStyles.tabItem, active && adminStyles.tabItemActive]} onPress={() => setTab(item.key)}>
              <Icon name={item.icon} size={19} color={active ? "#ffffff" : "#64748b"} />
              <Text style={[adminStyles.tabText, active && adminStyles.tabTextActive]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={adminStyles.body}>
        {loading ? (
          <View style={adminStyles.loadingBox}>
            <ActivityIndicator color="#2563eb" />
            <Text style={adminStyles.loadingText}>관리자 데이터를 불러오는 중입니다.</Text>
          </View>
        ) : (
          content()
        )}
      </ScrollView>
    </View>
  );
}

const adminStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    paddingTop: 42,
    paddingHorizontal: 20,
    paddingBottom: 18,
    backgroundColor: "#f8f9fa",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  brand: {
    color: "#f97316",
    fontSize: 13,
    fontWeight: "800",
  },
  title: {
    color: "#1a1a1a",
    fontSize: 24,
    fontWeight: "900",
    marginTop: 6,
  },
  subtitle: {
    color: "#6b7280",
    fontSize: 12,
    marginTop: 6,
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  tabBar: {
    flexDirection: "row",
    paddingHorizontal: 14,
    paddingBottom: 12,
    gap: 8,
    backgroundColor: "#f8f9fa",
  },
  tabItem: {
    flex: 1,
    minHeight: 56,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  tabItemActive: {
    backgroundColor: "#2563eb",
    borderColor: "#2563eb",
  },
  tabText: {
    fontSize: 10,
    color: "#64748b",
    fontWeight: "700",
  },
  tabTextActive: {
    color: "#ffffff",
  },
  body: {
    paddingHorizontal: 14,
    paddingBottom: 28,
    gap: 14,
  },
  metricsColumn: {
    gap: 12,
  },
  metricCard: {
    borderRadius: 16,
    padding: 20,
    minHeight: 118,
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 3,
  },
  metricBlue: {
    backgroundColor: "#35b3fc",
  },
  metricGreen: {
    backgroundColor: "#21d867",
  },
  metricLabel: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 14,
    fontWeight: "700",
  },
  metricValue: {
    color: "#ffffff",
    fontSize: 30,
    fontWeight: "900",
  },
  metricHint: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 12,
    lineHeight: 18,
  },
  panel: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#eceff3",
    gap: 10,
  },
  panelTitle: {
    color: "#111827",
    fontSize: 17,
    fontWeight: "900",
    marginBottom: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    paddingTop: 12,
    paddingBottom: 2,
  },
  userCard: {
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    paddingTop: 12,
    gap: 12,
  },
  rowTextWrap: {
    flex: 1,
    gap: 4,
  },
  rowTitle: {
    color: "#111827",
    fontSize: 15,
    fontWeight: "800",
  },
  rowSub: {
    color: "#64748b",
    fontSize: 12,
    lineHeight: 17,
  },
  rowActions: {
    alignItems: "flex-end",
    gap: 8,
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: "800",
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
  actionButton: {
    minWidth: 78,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  approveButton: {
    backgroundColor: "#2563eb",
  },
  rejectButton: {
    backgroundColor: "#eef2f7",
  },
  approveText: {
    color: "#ffffff",
    fontWeight: "800",
  },
  rejectText: {
    color: "#475569",
    fontWeight: "800",
  },
  smallButton: {
    minWidth: 58,
    minHeight: 34,
    borderRadius: 9,
    backgroundColor: "#e8f0ff",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  smallButtonText: {
    color: "#2563eb",
    fontSize: 12,
    fontWeight: "900",
  },
  emptyBox: {
    minHeight: 90,
    borderRadius: 12,
    backgroundColor: "#f8fafc",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  emptyText: {
    color: "#64748b",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
  },
  loadingBox: {
    minHeight: 260,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    color: "#64748b",
    fontSize: 13,
  },
});
