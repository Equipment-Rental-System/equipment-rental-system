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

export default function NotificationsScreen() {
  const { token } = useAuth();
  const { refreshUnreadCount } = useNotifications();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get("/notifications", token);
      setNotifications(data);
      await refreshUnreadCount();
    } catch (error) {
      Alert.alert("오류", error.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  }, [token, refreshUnreadCount]);

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [loadNotifications])
  );

  const markAllRead = async () => {
    try {
      await api.patch("/notifications/read-all", {}, token);
      await loadNotifications();
    } catch (error) {
      Alert.alert("오류", error.data?.message || error.message);
    }
  };

  if (loading) {
    return (
      <Screen>
        <LoadingView text="알림을 불러오는 중입니다." />
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>알림</Text>
        <AppButton title="모두 읽음" variant="secondary" onPress={markAllRead} />
      </View>

      {notifications.length ? (
        notifications.map((item) => (
          <Card key={item.id} style={!item.isRead && styles.unreadCard}>
            <Text style={styles.itemTitle}>{item.title}</Text>
            <Text style={styles.itemMessage}>{item.message}</Text>
            <Text style={styles.itemDate}>{String(item.createdAt).slice(0, 16).replace("T", " ")}</Text>
          </Card>
        ))
      ) : (
        <Card>
          <Text style={styles.emptyText}>표시할 알림이 없습니다.</Text>
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: theme.colors.text,
  },
  unreadCard: {
    borderColor: "#bfd0ff",
    backgroundColor: "#f6f9ff",
  },
  itemTitle: {
    fontWeight: "700",
    color: theme.colors.text,
  },
  itemMessage: {
    color: theme.colors.muted,
    lineHeight: 20,
  },
  itemDate: {
    color: theme.colors.muted,
    fontSize: 12,
  },
  emptyText: {
    color: theme.colors.muted,
    textAlign: "center",
  },
});
