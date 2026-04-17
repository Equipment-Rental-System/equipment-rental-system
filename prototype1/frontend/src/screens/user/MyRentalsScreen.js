import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { api } from "../../api/client";
import Card from "../../components/Card";
import LoadingView from "../../components/LoadingView";
import Screen from "../../components/Screen";
import StatusBadge from "../../components/StatusBadge";
import { useAuth } from "../../hooks/useAuth";
import { formatDate } from "../../utils/helpers";
import { theme } from "../../styles/theme";

export default function MyRentalsScreen({ navigation }) {
  const { token } = useAuth();
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadRentals = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get("/rentals", token);
      setRentals(data);
    } catch (error) {
      Alert.alert("오류", error.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      loadRentals();
    }, [loadRentals])
  );

  return (
    <Screen>
      {loading ? (
        <LoadingView text="내 대여 현황을 불러오는 중입니다." />
      ) : rentals.length ? (
        rentals.map((item) => (
          <Card key={item.id}>
            <View style={styles.row}>
              <Text style={styles.name}>{item.equipmentName}</Text>
              <StatusBadge status={item.status} />
            </View>
            <Text style={styles.meta}>{item.equipmentCode}</Text>
            <Text style={styles.meta}>반납 예정일: {formatDate(item.dueDate)}</Text>
            <Text style={styles.link} onPress={() => navigation.navigate("EquipmentDetail", { equipmentId: item.equipmentId })}>
              기자재 상세 보기
            </Text>
          </Card>
        ))
      ) : (
        <Card>
          <Text style={styles.meta}>현재 대여 기록이 없습니다.</Text>
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  name: {
    fontWeight: "700",
    fontSize: 18,
    color: theme.colors.text,
    flex: 1,
    marginRight: 10,
  },
  meta: {
    color: theme.colors.muted,
  },
  link: {
    color: theme.colors.primary,
    fontWeight: "700",
  },
});
