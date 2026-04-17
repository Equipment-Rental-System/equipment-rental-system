import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { Alert, StyleSheet, Text, TextInput, View } from "react-native";
import { api } from "../../api/client";
import Card from "../../components/Card";
import LoadingView from "../../components/LoadingView";
import Screen from "../../components/Screen";
import StatusBadge from "../../components/StatusBadge";
import { useAuth } from "../../hooks/useAuth";
import { theme } from "../../styles/theme";

export default function EquipmentListScreen({ navigation }) {
  const { token } = useAuth();
  const [equipments, setEquipments] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const loadEquipments = useCallback(async () => {
    setLoading(true);
    try {
      const path = search ? `/equipments?search=${encodeURIComponent(search)}` : "/equipments";
      const data = await api.get(path, token);
      setEquipments(data);
    } catch (error) {
      Alert.alert("오류", error.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  }, [token, search]);

  useFocusEffect(
    useCallback(() => {
      loadEquipments();
    }, [loadEquipments])
  );

  return (
    <Screen>
      <TextInput
        value={search}
        onChangeText={setSearch}
        onSubmitEditing={loadEquipments}
        placeholder="이름, 코드, 위치 검색"
        style={styles.search}
      />

      {loading ? (
        <LoadingView text="기자재 목록을 불러오는 중입니다." />
      ) : (
        equipments.map((item) => (
          <Card key={item.id}>
            <View style={styles.row}>
              <StatusBadge status={item.status} />
              <Text style={styles.code}>{item.code}</Text>
            </View>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.meta}>{item.category} · {item.location || "위치 미지정"}</Text>
            <Text style={styles.description} numberOfLines={2}>
              {item.description || "설명 없음"}
            </Text>
            <Text style={styles.link} onPress={() => navigation.navigate("EquipmentDetail", { equipmentId: item.id })}>
              상세 보기
            </Text>
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
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  code: {
    color: theme.colors.muted,
    fontWeight: "600",
  },
  name: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.text,
  },
  meta: {
    color: theme.colors.muted,
  },
  description: {
    color: theme.colors.text,
  },
  link: {
    color: theme.colors.primary,
    fontWeight: "700",
  },
});

