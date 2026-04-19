import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { Alert, StyleSheet, Text, TextInput, View } from "react-native";
import { api } from "../../api/client";
import AppButton from "../../components/AppButton";
import Card from "../../components/Card";
import LoadingView from "../../components/LoadingView";
import Screen from "../../components/Screen";
import StatusBadge from "../../components/StatusBadge";
import { useAuth } from "../../hooks/useAuth";
import { theme } from "../../styles/theme";

export default function EquipmentManagementScreen({ navigation }) {
  const { token } = useAuth();
  const [equipments, setEquipments] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const loadEquipments = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get(
        search ? `/equipments?search=${encodeURIComponent(search)}` : "/equipments",
        token
      );
      setEquipments(data);
    } catch (error) {
      Alert.alert("오류", error.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  }, [search, token]);

  useFocusEffect(
    useCallback(() => {
      loadEquipments();
    }, [loadEquipments])
  );

  const deleteEquipment = async (equipmentId) => {
    try {
      await api.request(`/equipments/${equipmentId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      await loadEquipments();
    } catch (error) {
      Alert.alert("삭제 실패", error.data?.message || error.message);
    }
  };

  return (
    <Screen>
      <AppButton title="기자재 등록" onPress={() => navigation.navigate("EquipmentForm")} />
      <TextInput
        value={search}
        onChangeText={setSearch}
        onSubmitEditing={loadEquipments}
        style={styles.search}
        placeholder="이름 또는 코드 검색"
      />

      {loading ? (
        <LoadingView text="기자재 목록을 불러오는 중입니다." />
      ) : (
        equipments.map((item) => (
          <Card key={item.id}>
            <View style={styles.header}>
              <Text style={styles.name}>{item.name}</Text>
              <StatusBadge status={item.status} />
            </View>
            <Text style={styles.meta}>{item.code} · {item.category}</Text>
            <View style={styles.actions}>
              <AppButton title="상세" variant="ghost" onPress={() => navigation.navigate("EquipmentDetail", { equipmentId: item.id })} />
              <AppButton title="수정" variant="secondary" onPress={() => navigation.navigate("EquipmentForm", { equipment: item })} />
              <AppButton title="삭제" variant="danger" onPress={() => deleteEquipment(item.id)} />
            </View>
          </Card>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  search: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "#fff",
  },
  header: {
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
  actions: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },
});
