import { Alert, StyleSheet, Text, View } from "react-native";
import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import AppButton from "../../components/AppButton";
import Card from "../../components/Card";
import LoadingView from "../../components/LoadingView";
import Screen from "../../components/Screen";
import StatusBadge from "../../components/StatusBadge";
import { api } from "../../api/client";
import { useAuth } from "../../hooks/useAuth";
import { theme } from "../../styles/theme";
import { formatDate, getErrorMessage } from "../../utils/helpers";

const QUICK_STATUSES = ["AVAILABLE", "INSPECTION_REQUIRED", "REPAIR"];

export default function StatusManagementScreen() {
  const { token } = useAuth();
  const [overdues, setOverdues] = useState([]);
  const [equipments, setEquipments] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [overdueRows, equipmentRows] = await Promise.all([
        api.get("/rentals/overdue", token),
        api.get("/equipments", token),
      ]);
      setOverdues(overdueRows);
      setEquipments(equipmentRows.filter((item) => ["OVERDUE", "INSPECTION_REQUIRED", "REPAIR"].includes(item.status)));
    } catch (error) {
      Alert.alert("상태 관리 조회 실패", getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [token])
  );

  const updateStatus = async (equipmentId, status) => {
    try {
      await api.put(`/equipments/${equipmentId}/status`, { status }, token);
      loadData();
    } catch (error) {
      Alert.alert("상태 변경 실패", getErrorMessage(error));
    }
  };

  if (loading) {
    return <LoadingView text="연체 및 상태 관리 화면을 준비하는 중입니다." />;
  }

  return (
    <Screen>
      <Card>
        <Text style={styles.title}>연체/상태 관리</Text>
        <Text style={styles.subtitle}>연체 기자재와 점검/수리 상태 기자재를 한 번에 확인합니다.</Text>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>연체 대여 목록</Text>
        {overdues.length === 0 ? (
          <Text style={styles.empty}>연체 대여가 없습니다.</Text>
        ) : (
          overdues.map((rental) => (
            <View key={rental.id} style={styles.rowBlock}>
              <View style={styles.headerRow}>
                <View style={styles.headerText}>
                  <Text style={styles.name}>{rental.equipmentName}</Text>
                  <Text style={styles.meta}>{rental.userName} / {rental.studentId}</Text>
                  <Text style={styles.meta}>반납 예정일: {formatDate(rental.dueDate)}</Text>
                </View>
                <StatusBadge status={rental.status} />
              </View>
            </View>
          ))
        )}
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>기자재 상태 빠른 변경</Text>
        {equipments.length === 0 ? (
          <Text style={styles.empty}>관리 대상 기자재가 없습니다.</Text>
        ) : (
          equipments.map((equipment) => (
            <View key={equipment.id} style={styles.rowBlock}>
              <View style={styles.headerRow}>
                <View style={styles.headerText}>
                  <Text style={styles.name}>{equipment.name}</Text>
                  <Text style={styles.meta}>{equipment.code}</Text>
                  <Text style={styles.meta}>현재 위치: {equipment.location || "-"}</Text>
                </View>
                <StatusBadge status={equipment.status} />
              </View>
              <View style={styles.actions}>
                {QUICK_STATUSES.map((status) => (
                  <AppButton
                    key={status}
                    title={status}
                    variant={status === "AVAILABLE" ? "secondary" : "ghost"}
                    onPress={() => updateStatus(equipment.id, status)}
                  />
                ))}
              </View>
            </View>
          ))
        )}
      </Card>
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.text,
  },
  empty: {
    color: theme.colors.muted,
  },
  rowBlock: {
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eef2f7",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontSize: 17,
    fontWeight: "800",
    color: theme.colors.text,
  },
  meta: {
    color: theme.colors.muted,
  },
  actions: {
    gap: 10,
  },
});
