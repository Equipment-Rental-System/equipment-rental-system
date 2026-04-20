import { Alert, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useCallback, useMemo, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import AppInput from "../../components/AppInput";
import Card from "../../components/Card";
import LoadingView from "../../components/LoadingView";
import Screen from "../../components/Screen";
import StatusBadge from "../../components/StatusBadge";
import { api } from "../../api/client";
import { useAuth } from "../../hooks/useAuth";
import { theme } from "../../styles/theme";
import { getErrorMessage, joinComponents, translateStatus } from "../../utils/helpers";

const STATUS_FILTERS = ["ALL", "AVAILABLE", "RENTAL_PENDING", "RENTED", "RETURN_PENDING", "OVERDUE"];

export default function EquipmentListScreen({ navigation }) {
  const { token } = useAuth();
  const [equipments, setEquipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const loadEquipments = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      }
      const query = [];
      if (search.trim()) {
        query.push(`search=${encodeURIComponent(search.trim())}`);
      }
      if (statusFilter !== "ALL") {
        query.push(`status=${encodeURIComponent(statusFilter)}`);
      }

      const suffix = query.length ? `?${query.join("&")}` : "";
      const rows = await api.get(`/equipments${suffix}`, token);
      setEquipments(rows);
    } catch (error) {
      Alert.alert("기자재 조회 실패", getErrorMessage(error));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadEquipments();
    }, [token, search, statusFilter])
  );

  const filterButtons = useMemo(
    () =>
      STATUS_FILTERS.map((item) => {
        const active = statusFilter === item;
        return (
          <Pressable
            key={item}
            onPress={() => setStatusFilter(item)}
            style={[styles.filterChip, active && styles.filterChipActive]}
          >
            <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
              {item === "ALL" ? "전체" : translateStatus(item)}
            </Text>
          </Pressable>
        );
      }),
    [statusFilter]
  );

  if (loading && equipments.length === 0) {
    return <LoadingView text="기자재 목록을 불러오는 중입니다." />;
  }

  return (
    <Screen
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            loadEquipments(true);
          }}
        />
      }
    >
      <Card>
        <Text style={styles.title}>기자재 목록</Text>
        <AppInput
          label="검색"
          value={search}
          onChangeText={setSearch}
          placeholder="기자재명, 코드, 보관 위치로 검색"
        />
        <View style={styles.filterWrap}>{filterButtons}</View>
      </Card>

      {equipments.length === 0 ? (
        <Card>
          <Text style={styles.empty}>조건에 맞는 기자재가 없습니다.</Text>
        </Card>
      ) : (
        equipments.map((equipment) => (
          <Pressable key={equipment.id} onPress={() => navigation.navigate("EquipmentDetail", { equipmentId: equipment.id })}>
            <Card style={styles.equipmentCard}>
              <View style={styles.headerRow}>
                <View style={styles.headerText}>
                  <Text style={styles.name}>{equipment.name}</Text>
                  <Text style={styles.code}>{equipment.code}</Text>
                </View>
                <StatusBadge status={equipment.status} />
              </View>
              <Text style={styles.meta}>카테고리: {equipment.category}</Text>
              <Text style={styles.meta}>보관 위치: {equipment.location || "-"}</Text>
              <Text style={styles.meta}>구성품: {joinComponents(equipment.components)}</Text>
            </Card>
          </Pressable>
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
  filterWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#edf1f7",
  },
  filterChipActive: {
    backgroundColor: theme.colors.primarySoft,
  },
  filterChipText: {
    color: theme.colors.text,
    fontWeight: "600",
  },
  filterChipTextActive: {
    color: theme.colors.primary,
  },
  equipmentCard: {
    gap: 8,
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
  empty: {
    color: theme.colors.muted,
    textAlign: "center",
  },
});
