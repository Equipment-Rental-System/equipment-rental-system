import { Alert, StyleSheet, Text, View } from "react-native";
import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import AppButton from "../../components/AppButton";
import Card from "../../components/Card";
import LoadingView from "../../components/LoadingView";
import Screen from "../../components/Screen";
import { api } from "../../api/client";
import { useAuth } from "../../hooks/useAuth";
import { theme } from "../../styles/theme";
import { getErrorMessage } from "../../utils/helpers";

export default function AdminDashboardScreen({ navigation }) {
  const { token, user, logout } = useAuth();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadSummary = async () => {
    try {
      setLoading(true);
      const [pendingUsers, equipments, pendingRentals, extensionRentals, returnPending, overdue] = await Promise.all([
        api.get("/admin/users/pending", token),
        api.get("/equipments", token),
        api.get("/rentals/pending", token),
        api.get("/rentals?status=EXTENSION_REQUESTED", token),
        api.get("/rentals/return-pending", token),
        api.get("/rentals/overdue", token),
      ]);
      setSummary({
        pendingUsers: pendingUsers.length,
        equipments: equipments.length,
        pendingRentals: pendingRentals.length,
        extensionRequests: extensionRentals.length,
        returnPending: returnPending.length,
        overdue: overdue.length,
      });
    } catch (error) {
      Alert.alert("대시보드 조회 실패", getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadSummary();
    }, [token])
  );

  if (loading && !summary) {
    return <LoadingView text="관리자 대시보드를 준비하는 중입니다." />;
  }

  const menuItems = [
    { label: "회원 승인 관리", value: summary?.pendingUsers ?? 0, route: "PendingUsers" },
    { label: "기자재 관리", value: summary?.equipments ?? 0, route: "EquipmentManagement" },
    { label: "대여 승인", value: summary?.pendingRentals ?? 0, route: "RentalApprovals" },
    { label: "연장 승인", value: summary?.extensionRequests ?? 0, route: "ExtensionApprovals" },
    { label: "반납 승인", value: summary?.returnPending ?? 0, route: "ReturnApprovals" },
    { label: "연체/상태 관리", value: summary?.overdue ?? 0, route: "StatusManagement" },
  ];

  return (
    <Screen>
      <Card>
        <Text style={styles.title}>{user?.name || "관리자"}님, 안녕하세요.</Text>
        <Text style={styles.subtitle}>오늘 처리해야 할 승인 요청과 기자재 상태를 한 번에 확인하세요.</Text>
      </Card>

      <View style={styles.grid}>
        {menuItems.map((item) => (
          <Card key={item.route} style={styles.metricCard}>
            <Text style={styles.metricValue}>{item.value}</Text>
            <Text style={styles.metricLabel}>{item.label}</Text>
            <AppButton title="열기" onPress={() => navigation.navigate(item.route)} />
          </Card>
        ))}
      </View>

      <Card>
        <Text style={styles.sectionTitle}>추가 메뉴</Text>
        <View style={styles.actions}>
          <AppButton title="알림 보기" variant="secondary" onPress={() => navigation.navigate("Notifications")} />
          <AppButton title="로그아웃" variant="danger" onPress={logout} />
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: theme.colors.text,
  },
  subtitle: {
    color: theme.colors.muted,
    lineHeight: 22,
  },
  grid: {
    gap: 12,
  },
  metricCard: {
    gap: 12,
  },
  metricValue: {
    fontSize: 28,
    fontWeight: "800",
    color: theme.colors.primary,
  },
  metricLabel: {
    color: theme.colors.text,
    fontWeight: "700",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.text,
  },
  actions: {
    gap: 10,
  },
});
