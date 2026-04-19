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

export default function StatusManagementScreen() {
  const { token } = useAuth();
  const [overdueRentals, setOverdueRentals] = useState([]);
  const [equipments, setEquipments] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [overdue, equipmentList] = await Promise.all([
        api.get("/rentals/overdue", token),
        api.get("/equipments", token),
      ]);
      setOverdueRentals(overdue);
      setEquipments(equipmentList.filter((item) => ["INSPECTION_REQUIRED", "REPAIR", "OVERDUE"].includes(item.status)));
    } catch (error) {
      Alert.alert("오류", error.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const updateStatus = async (equipmentId, status) => {
    try {
      await api.put(`/equipments/${equipmentId}/status`, { status }, token);
      await loadData();
    } catch (error) {
      Alert.alert("상태 변경 실패", error.data?.message || error.message);
    }
  };

  return (
    <Screen>
      {loading ? <LoadingView text="상태 관리 정보를 불러오는 중입니다." /> : (
        <>
          <Card>
            <Text style={styles.sectionTitle}>연체 기자재 목록</Text>
            {overdueRentals.length ? overdueRentals.map((item) => (
              <View key={item.id} style={styles.itemBox}>
                <Text style={styles.name}>{item.equipmentName}</Text>
                <Text style={styles.meta}>{item.userName} · 반납 예정일 {item.dueDate}</Text>
                <StatusBadge status={item.status} />
              </View>
            )) : <Text style={styles.meta}>현재 연체 건이 없습니다.</Text>}
          </Card>

          <Card>
            <Text style={styles.sectionTitle}>관리자 수동 상태 업데이트</Text>
            {equipments.length ? equipments.map((item) => (
              <View key={item.id} style={styles.itemBox}>
                <Text style={styles.name}>{item.name}</Text>
                <StatusBadge status={item.status} />
                <View style={styles.actions}>
                  <AppButton title="AVAILABLE" variant="secondary" onPress={() => updateStatus(item.id, "AVAILABLE")} />
                  <AppButton title="REPAIR" variant="danger" onPress={() => updateStatus(item.id, "REPAIR")} />
                </View>
              </View>
            )) : <Text style={styles.meta}>수동 확인이 필요한 기자재가 없습니다.</Text>}
          </Card>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { fontSize: 20, fontWeight: "800", color: theme.colors.text },
  itemBox: { gap: 8, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  name: { fontSize: 16, fontWeight: "700", color: theme.colors.text },
  meta: { color: theme.colors.muted },
  actions: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
});
