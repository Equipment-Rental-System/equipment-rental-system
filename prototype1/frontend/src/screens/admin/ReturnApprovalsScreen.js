import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { api } from "../../api/client";
import AppButton from "../../components/AppButton";
import Card from "../../components/Card";
import LoadingView from "../../components/LoadingView";
import Screen from "../../components/Screen";
import StatusBadge from "../../components/StatusBadge";
import { useAuth } from "../../hooks/useAuth";
import { theme } from "../../styles/theme";

export default function ReturnApprovalsScreen() {
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get("/rentals/return-pending", token);
      setItems(data);
    } catch (error) {
      Alert.alert("오류", error.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(useCallback(() => { loadItems(); }, [loadItems]));

  const handleAction = async (id, endpoint, note) => {
    try {
      await api.post(`/rentals/${id}/${endpoint}`, { adminNote: note }, token);
      await loadItems();
    } catch (error) {
      Alert.alert("오류", error.data?.message || error.message);
    }
  };

  return (
    <Screen>
      {loading ? <LoadingView text="반납 승인 목록을 불러오는 중입니다." /> : items.map((item) => (
        <Card key={item.id}>
          <View style={styles.row}>
            <Text style={styles.name}>{item.equipmentName}</Text>
            <StatusBadge status={item.status} />
          </View>
          <Text style={styles.meta}>{item.userName} ({item.studentId})</Text>
          <View style={styles.actions}>
            <AppButton title="정상 반납" onPress={() => handleAction(item.id, "approve-return", "정상 반납")} />
            <AppButton title="점검 필요" variant="secondary" onPress={() => handleAction(item.id, "mark-inspection", "구성품 또는 외관 점검 필요")} />
            <AppButton title="수리 처리" variant="danger" onPress={() => handleAction(item.id, "mark-repair", "수리 필요")} />
          </View>
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  name: { fontSize: 18, fontWeight: "700", color: theme.colors.text, flex: 1, marginRight: 10 },
  meta: { color: theme.colors.muted },
  actions: { gap: 10 },
});

