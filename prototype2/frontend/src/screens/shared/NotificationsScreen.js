import { Alert, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import AppButton from "../../components/AppButton";
import Card from "../../components/Card";
import LoadingView from "../../components/LoadingView";
import Screen from "../../components/Screen";
import StatusBadge from "../../components/StatusBadge";
import { api } from "../../api/client";
import { useAuth } from "../../hooks/useAuth";
import { useNotifications } from "../../hooks/useNotifications";
import { theme } from "../../styles/theme";
import { formatDate, getErrorMessage } from "../../utils/helpers";

export default function NotificationsScreen() {
  const { token } = useAuth();
  const { refreshUnreadCount } = useNotifications();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadNotifications = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      }
      const rows = await api.get("/notifications", token);
      setNotifications(rows);
      await refreshUnreadCount();
    } catch (error) {
      Alert.alert("알림 조회 실패", getErrorMessage(error));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [token])
  );

  const handleRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`, {}, token);
      await loadNotifications(true);
    } catch (error) {
      Alert.alert("읽음 처리 실패", getErrorMessage(error));
    }
  };

  const handleReadAll = async () => {
    try {
      await api.patch("/notifications/read-all", {}, token);
      await loadNotifications(true);
    } catch (error) {
      Alert.alert("전체 읽음 처리 실패", getErrorMessage(error));
    }
  };

  if (loading) {
    return <LoadingView text="알림 목록을 불러오는 중입니다." />;
  }

  return (
    <Screen
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            loadNotifications(true);
          }}
        />
      }
    >
      <Card>
        <Text style={styles.title}>알림</Text>
        <Text style={styles.subtitle}>반납 예정, 연체, 승인 결과를 여기에서 확인할 수 있습니다.</Text>
        <AppButton title="모두 읽음 처리" variant="secondary" onPress={handleReadAll} />
      </Card>

      {notifications.length === 0 ? (
        <Card>
          <Text style={styles.empty}>새로운 알림이 없습니다.</Text>
        </Card>
      ) : (
        notifications.map((item) => (
          <Card key={item.id} style={!item.isRead && styles.unreadCard}>
            <View style={styles.headerRow}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <StatusBadge status={item.isRead ? "APPROVED" : "REQUESTED"} />
            </View>
            <Text style={styles.message}>{item.message}</Text>
            <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
            {!item.isRead ? <AppButton title="읽음 처리" variant="ghost" onPress={() => handleRead(item.id)} /> : null}
          </Card>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: theme.colors.text,
  },
  subtitle: {
    color: theme.colors.muted,
    lineHeight: 20,
  },
  empty: {
    color: theme.colors.muted,
    textAlign: "center",
  },
  unreadCard: {
    borderColor: "#bfd1ff",
    backgroundColor: "#f9fbff",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "flex-start",
  },
  itemTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.text,
  },
  message: {
    color: theme.colors.text,
    lineHeight: 20,
  },
  date: {
    color: theme.colors.muted,
    fontSize: 12,
  },
});
