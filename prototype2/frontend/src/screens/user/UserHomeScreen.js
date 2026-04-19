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

export default function UserHomeScreen({ navigation }) {
  const { token, user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const [summary, setSummary] = useState(null);

  const loadSummary = useCallback(async () => {
    try {
      const [equipments, rentals] = await Promise.all([
        api.get("/equipments", token),
        api.get("/rentals?onlyActive=true", token),
      ]);

      setSummary({
        availableCount: equipments.filter((item) => item.status === "AVAILABLE").length,
        activeRentals: rentals.length,
        overdueCount: rentals.filter((item) => item.status === "OVERDUE").length,
      });
    } catch (error) {
      Alert.alert("오류", error.data?.message || error.message);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      loadSummary();
    }, [loadSummary])
  );

  if (!summary) {
    return (
      <Screen>
        <LoadingView text="사용자 홈 정보를 불러오는 중입니다." />
      </Screen>
    );
  }

  return (
    <Screen>
      <Card>
        <Text style={styles.title}>{user?.name}님, 안녕하세요</Text>
        <Text style={styles.description}>QR 인증을 통해 실제 기자재 대여를 진행할 수 있습니다.</Text>
      </Card>

      <View style={styles.grid}>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{summary.availableCount}</Text>
          <Text style={styles.statLabel}>대여 가능 기자재</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{summary.activeRentals}</Text>
          <Text style={styles.statLabel}>내 진행 중 대여</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{summary.overdueCount}</Text>
          <Text style={styles.statLabel}>연체 건수</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{unreadCount}</Text>
          <Text style={styles.statLabel}>읽지 않은 알림</Text>
        </Card>
      </View>

      <Card>
        <Text style={styles.sectionTitle}>빠른 이동</Text>
        <View style={styles.actions}>
          <AppButton title="기자재 목록 보기" onPress={() => navigation.navigate("기자재")} />
          <AppButton title="QR 스캔 시작" variant="secondary" onPress={() => navigation.navigate("QR스캔")} />
          <AppButton title="내 대여 현황" variant="ghost" onPress={() => navigation.navigate("내대여")} />
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
  actions: {
    gap: 10,
  },
});
