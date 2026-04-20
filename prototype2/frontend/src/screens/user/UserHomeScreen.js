import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { useCallback, useMemo, useState } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import Card from "../../components/Card";
import LoadingView from "../../components/LoadingView";
import Screen from "../../components/Screen";
import StatusBadge from "../../components/StatusBadge";
import { api } from "../../api/client";
import { useAuth } from "../../hooks/useAuth";
import { useNotifications } from "../../hooks/useNotifications";
import { theme } from "../../styles/theme";
import { formatDate, getErrorMessage } from "../../utils/helpers";

function ShortcutCard({ icon, label, onPress }) {
  return (
    <Pressable style={styles.shortcutCard} onPress={onPress}>
      <MaterialCommunityIcons name={icon} size={22} color={theme.colors.primary} />
      <Text style={styles.shortcutLabel}>{label}</Text>
    </Pressable>
  );
}

export default function UserHomeScreen({ navigation }) {
  const { token, user } = useAuth();
  const { unreadCount } = useNotifications();
  const [equipments, setEquipments] = useState([]);
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadSummary = async () => {
    try {
      setLoading(true);
      const [equipmentRows, rentalRows] = await Promise.all([
        api.get("/equipments", token),
        api.get("/rentals?onlyActive=true", token),
      ]);
      setEquipments(equipmentRows);
      setRentals(rentalRows);
    } catch (error) {
      Alert.alert("정보 조회 실패", getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadSummary();
    }, [token])
  );

  const availableEquipments = useMemo(
    () => equipments.filter((item) => item.status === "AVAILABLE").slice(0, 3),
    [equipments]
  );

  const recentRentals = useMemo(() => rentals.slice(0, 2), [rentals]);

  if (loading && equipments.length === 0) {
    return <LoadingView text="사용자 홈을 준비하는 중입니다." />;
  }

  return (
    <Screen>
      <Card style={styles.heroCard}>
        <View style={styles.heroTop}>
          <View>
            <Text style={styles.brand}>DGU EQUIP</Text>
            <Text style={styles.title}>{user?.name || "사용자"}님, 안녕하세요</Text>
          </View>
          <Pressable style={styles.notificationBubble} onPress={() => navigation.navigate("Notifications")}>
            <MaterialCommunityIcons name="bell-outline" size={18} color={theme.colors.primary} />
            <Text style={styles.notificationText}>{unreadCount}</Text>
          </Pressable>
        </View>
        <Text style={styles.subtitle}>
          컴퓨터공학과 사무실 기자재를 조회하고, 실제 기자재의 QR을 스캔해 대여를 진행하세요.
        </Text>
      </Card>

      <View style={styles.shortcutRow}>
        <ShortcutCard icon="format-list-bulleted" label="기자재 목록" onPress={() => navigation.navigate("EquipmentList")} />
        <ShortcutCard icon="clipboard-list-outline" label="내 대여" onPress={() => navigation.navigate("MyRentals")} />
        <ShortcutCard icon="bell-outline" label="알림" onPress={() => navigation.navigate("Notifications")} />
      </View>

      <Card>
        <Text style={styles.sectionTitle}>대여 가능한 기자재</Text>
        {availableEquipments.length === 0 ? (
          <Text style={styles.emptyText}>현재 바로 대여 가능한 기자재가 없습니다.</Text>
        ) : (
          availableEquipments.map((equipment) => (
            <Pressable
              key={equipment.id}
              style={styles.listItem}
              onPress={() => navigation.navigate("EquipmentDetail", { equipmentId: equipment.id })}
            >
              <View style={styles.listText}>
                <Text style={styles.itemName}>{equipment.name}</Text>
                <Text style={styles.itemMeta}>{equipment.code}</Text>
              </View>
              <StatusBadge status={equipment.status} />
            </Pressable>
          ))
        )}
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>내 최근 대여</Text>
        {recentRentals.length === 0 ? (
          <Text style={styles.emptyText}>진행 중인 대여가 없습니다.</Text>
        ) : (
          recentRentals.map((rental) => (
            <Pressable key={rental.id} style={styles.listItem} onPress={() => navigation.navigate("MyRentals")}>
              <View style={styles.listText}>
                <Text style={styles.itemName}>{rental.equipmentName}</Text>
                <Text style={styles.itemMeta}>반납 예정일 {formatDate(rental.dueDate)}</Text>
              </View>
              <StatusBadge status={rental.status} />
            </Pressable>
          ))
        )}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    gap: 12,
  },
  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  brand: {
    color: theme.colors.primary,
    fontWeight: "800",
    letterSpacing: 1.1,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: theme.colors.text,
    marginTop: 6,
  },
  subtitle: {
    color: theme.colors.muted,
    lineHeight: 21,
  },
  notificationBubble: {
    minWidth: 52,
    height: 36,
    borderRadius: 999,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: theme.colors.primarySoft,
  },
  notificationText: {
    color: theme.colors.primary,
    fontWeight: "800",
  },
  shortcutRow: {
    flexDirection: "row",
    gap: 10,
  },
  shortcutCard: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: "center",
    gap: 8,
    ...theme.shadow.card,
  },
  shortcutLabel: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: theme.colors.text,
  },
  listItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    paddingVertical: 6,
  },
  listText: {
    flex: 1,
    gap: 4,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.text,
  },
  itemMeta: {
    color: theme.colors.muted,
  },
  emptyText: {
    color: theme.colors.muted,
    textAlign: "center",
    paddingVertical: 12,
  },
});
