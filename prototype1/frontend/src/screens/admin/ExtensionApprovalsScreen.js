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

export default function ExtensionApprovalsScreen() {
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get("/rentals?status=EXTENSION_REQUESTED", token);
      setItems(data);
    } catch (error) {
      Alert.alert("오류", error.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(useCallback(() => { loadItems(); }, [loadItems]));

  const handleAction = async (id, action) => {
    try {
      const endpoint = action === "approve" ? "approve-extension" : "reject-extension";
      await api.post(`/rentals/${id}/${endpoint}`, { adminNote: action === "approve" ? "연장 승인" : "연장 거절" }, token);
      await loadItems();
    } catch (error) {
      Alert.alert("오류", error.data?.message || error.message);
    }
  };

  return (
    <Screen>
      {loading ? <LoadingView text="연장 승인 목록을 불러오는 중입니다." /> : items.map((item) => (
        <Card key={item.id}>
          <View style={styles.row}>
            <Text style={styles.name}>{item.equipmentName}</Text>
            <StatusBadge status={item.status} />
          </View>
          <Text style={styles.meta}>{item.userName} ({item.studentId})</Text>
          <Text style={styles.meta}>현재 반납일: {item.dueDate || "-"}</Text>
          <Text style={styles.meta}>희망 반납일: {item.requestedDueDate || "-"}</Text>
          <View style={styles.actions}>
            <AppButton title="승인" onPress={() => handleAction(item.id, "approve")} />
            <AppButton title="거절" variant="danger" onPress={() => handleAction(item.id, "reject")} />
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
  actions: { flexDirection: "row", gap: 10 },
});

