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
import { theme } from "../../styles/theme";
import { formatDate, getErrorMessage } from "../../utils/helpers";

export default function MyRentalsScreen({ navigation }) {
  const { token } = useAuth();
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadRentals = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      }
      const rows = await api.get("/rentals", token);
      setRentals(rows);
    } catch (error) {
      Alert.alert("대여 현황 조회 실패", getErrorMessage(error));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadRentals();
    }, [token])
  );

  if (loading && rentals.length === 0) {
    return <LoadingView text="내 대여 현황을 불러오는 중입니다." />;
  }

  return (
    <Screen
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            loadRentals(true);
          }}
        />
      }
    >
      <Card>
        <Text style={styles.title}>내 대여 현황</Text>
        <Text style={styles.subtitle}>연장 요청과 반납 요청도 여기서 이어서 진행할 수 있습니다.</Text>
      </Card>

      {rentals.length === 0 ? (
        <Card>
          <Text style={styles.empty}>등록된 대여 이력이 없습니다.</Text>
        </Card>
      ) : (
        rentals.map((rental) => (
          <Card key={rental.id}>
            <View style={styles.headerRow}>
              <View style={styles.headerText}>
                <Text style={styles.name}>{rental.equipmentName}</Text>
                <Text style={styles.code}>{rental.equipmentCode}</Text>
              </View>
              <StatusBadge status={rental.status} />
            </View>
            <Text style={styles.meta}>반납 예정일: {formatDate(rental.dueDate)}</Text>
            <Text style={styles.meta}>요청 메모: {rental.note || "-"}</Text>
            <View style={styles.actions}>
              <AppButton
                title="상세 보기"
                variant="ghost"
                onPress={() => navigation.navigate("EquipmentDetail", { equipmentId: rental.equipmentId })}
              />
              {["APPROVED", "EXTENSION_APPROVED", "EXTENSION_REJECTED", "OVERDUE"].includes(rental.status) ? (
                <AppButton
                  title="연장 요청"
                  variant="secondary"
                  onPress={() =>
                    navigation.navigate("RentalCheckout", {
                      mode: "extend",
                      equipment: {
                        id: rental.equipmentId,
                        name: rental.equipmentName,
                        code: rental.equipmentCode,
                        status: rental.equipmentStatus,
                        components: [],
                        description: "",
                      },
                      rentalId: rental.id,
                      currentDueDate: rental.dueDate,
                    })
                  }
                />
              ) : null}
              {["APPROVED", "EXTENSION_APPROVED", "EXTENSION_REJECTED", "OVERDUE"].includes(rental.status) ? (
                <AppButton
                  title="QR 인증 후 반납"
                  onPress={() =>
                    navigation.navigate("QRScanner", {
                      mode: "return",
                      equipmentId: rental.equipmentId,
                      equipmentCode: rental.equipmentCode,
                      rentalId: rental.id,
                      allowMockScan: true,
                    })
                  }
                />
              ) : null}
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
    gap: 6,
  },
  name: {
    fontSize: 18,
    fontWeight: "800",
    color: theme.colors.text,
  },
  code: {
    color: theme.colors.primary,
    fontWeight: "700",
  },
  meta: {
    color: theme.colors.muted,
    lineHeight: 20,
  },
  actions: {
    gap: 10,
  },
});
