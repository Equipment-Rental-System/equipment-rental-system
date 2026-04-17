import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { api } from "../../api/client";
import AppButton from "../../components/AppButton";
import Card from "../../components/Card";
import LoadingView from "../../components/LoadingView";
import Screen from "../../components/Screen";
import { useAuth } from "../../hooks/useAuth";
import { useNotifications } from "../../hooks/useNotifications";
import { theme } from "../../styles/theme";

export default function AdminDashboardScreen({ navigation }) {
  const { token, user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const [counts, setCounts] = useState(null);

  const loadDashboard = useCallback(async () => {
    try {
      const [pendingUsers, pendingRentals, returnPending, overdue, extensionPending] = await Promise.all([
        api.get("/admin/users/pending", token),
        api.get("/rentals/pending", token),
        api.get("/rentals/return-pending", token),
        api.get("/rentals/overdue", token),
        api.get("/rentals?status=EXTENSION_REQUESTED", token),
      ]);

      setCounts({
        pendingUsers: pendingUsers.length,
        pendingRentals: pendingRentals.length,
        returnPending: returnPending.length,
        overdue: overdue.length,
        extensionPending: extensionPending.length,
      });
    } catch (error) {
      Alert.alert("오류", error.data?.message || error.message);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [loadDashboard])
  );

  if (!counts) {
    return (
      <Screen>
        <LoadingView text="관리자 대시보드를 불러오는 중입니다." />
      </Screen>
    );
  }

  return (
    <Screen>
      <Card>
        <Text style={styles.title}>{user?.name} 관리자님</Text>
        <Text style={styles.description}>승인 대기 요청과 상태 변경이 필요한 기자재를 한 번에 관리하세요.</Text>
      </Card>

      <View style={styles.grid}>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{counts.pendingUsers}</Text>
          <Text style={styles.statLabel}>회원 승인 대기</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{counts.pendingRentals}</Text>
          <Text style={styles.statLabel}>대여 승인 대기</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{counts.extensionPending}</Text>
          <Text style={styles.statLabel}>연장 승인 대기</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{counts.returnPending}</Text>
          <Text style={styles.statLabel}>반납 확인 대기</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{counts.overdue}</Text>
          <Text style={styles.statLabel}>연체 건수</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{unreadCount}</Text>
          <Text style={styles.statLabel}>읽지 않은 알림</Text>
        </Card>
      </View>

      <Card>
        <Text style={styles.sectionTitle}>바로가기</Text>
        <View style={styles.actionList}>
          <AppButton title="회원 승인 관리" onPress={() => navigation.navigate("PendingUsers")} />
          <AppButton title="대여 승인 관리" variant="secondary" onPress={() => navigation.navigate("RentalApprovals")} />
          <AppButton title="연장 승인 관리" variant="secondary" onPress={() => navigation.navigate("ExtensionApprovals")} />
          <AppButton title="반납 승인 관리" variant="ghost" onPress={() => navigation.navigate("ReturnApprovals")} />
          <AppButton title="로그아웃" variant="ghost" onPress={logout} />
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
  description: {
    color: theme.colors.muted,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statCard: {
    width: "47%",
  },
  statValue: {
    fontSize: 28,
    fontWeight: "800",
    color: theme.colors.primary,
  },
  statLabel: {
    color: theme.colors.muted,
  },
  sectionTitle: {
    fontWeight: "700",
    color: theme.colors.text,
  },
  actionList: {
    gap: 10,
  },
});
