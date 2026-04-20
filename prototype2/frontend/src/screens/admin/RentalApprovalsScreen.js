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

export default function RentalApprovalsScreen() {
  const { token } = useAuth();
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadRentals = async () => {
    try {
      setLoading(true);
      const rows = await api.get("/rentals/pending", token);
      setRentals(rows);
    } catch (error) {
      Alert.alert("대여 승인 목록 조회 실패", getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadRentals();
    }, [token])
  );

  const handleAction = async (id, action) => {
    try {
      await api.post(`/rentals/${id}/${action}`, { adminNote: "" }, token);
      loadRentals();
    } catch (error) {
      Alert.alert("처리 실패", getErrorMessage(error));
    }
  };

  if (loading) {
    return <LoadingView text="대여 승인 목록을 불러오는 중입니다." />;
  }

  return (
    <Screen>
      <Card>
        <Text style={styles.title}>대여 승인</Text>
        <Text style={styles.subtitle}>QR 인증 후 접수된 대여 요청을 승인하거나 거절할 수 있습니다.</Text>
      </Card>

      {rentals.length === 0 ? (
        <Card>
          <Text style={styles.empty}>대여 승인 대기 요청이 없습니다.</Text>
        </Card>
      ) : (
        rentals.map((rental) => (
          <Card key={rental.id}>
            <View style={styles.headerRow}>
              <View style={styles.headerText}>
                <Text style={styles.name}>{rental.equipmentName}</Text>
                <Text style={styles.meta}>{rental.userName} / {rental.studentId}</Text>
                <Text style={styles.meta}>요청일: {formatDate(rental.requestDate)}</Text>
                <Text style={styles.meta}>희망 반납일: {formatDate(rental.dueDate)}</Text>
                <Text style={styles.note}>요청 메모: {rental.note?.trim() ? rental.note : "없음"}</Text>
              </View>
              <StatusBadge status={rental.status} />
            </View>
            <View style={styles.actions}>
              <AppButton title="승인" onPress={() => handleAction(rental.id, "approve")} />
              <AppButton title="거절" variant="danger" onPress={() => handleAction(rental.id, "reject")} />
            </View>
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
    fontSize: 18,
    fontWeight: "800",
    color: theme.colors.text,
  },
  meta: {
    color: theme.colors.muted,
  },
  note: {
    color: theme.colors.text,
    lineHeight: 20,
    marginTop: 4,
  },
  actions: {
    gap: 10,
  },
});
