import { Alert, Image, StyleSheet, Text, View } from "react-native";
import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import AppButton from "../../components/AppButton";
import Card from "../../components/Card";
import LoadingView from "../../components/LoadingView";
import Screen from "../../components/Screen";
import StatusBadge from "../../components/StatusBadge";
import { api, buildUploadUrl } from "../../api/client";
import { useAuth } from "../../hooks/useAuth";
import { theme } from "../../styles/theme";
import { getErrorMessage, joinComponents } from "../../utils/helpers";

export default function EquipmentManagementScreen({ navigation }) {
  const { token } = useAuth();
  const [equipments, setEquipments] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadEquipments = async () => {
    try {
      setLoading(true);
      const rows = await api.get("/equipments", token);
      setEquipments(rows);
    } catch (error) {
      Alert.alert("기자재 목록 조회 실패", getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadEquipments();
    }, [token])
  );

  const handleDelete = (id) => {
    Alert.alert("기자재 삭제", "이 기자재를 삭제하시겠습니까?", [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: async () => {
          try {
            await api.request(`/equipments/${id}`, {
              method: "DELETE",
              headers: { Authorization: `Bearer ${token}` },
            });
            loadEquipments();
          } catch (error) {
            Alert.alert("삭제 실패", getErrorMessage(error));
          }
        },
      },
    ]);
  };

  if (loading) {
    return <LoadingView text="관리용 기자재 목록을 불러오는 중입니다." />;
  }

  return (
    <Screen>
      <Card>
        <Text style={styles.title}>기자재 관리</Text>
        <Text style={styles.subtitle}>신규 기자재를 등록하고, 사진과 상태를 함께 관리할 수 있습니다.</Text>
        <AppButton title="새 기자재 등록" onPress={() => navigation.navigate("EquipmentForm")} />
      </Card>

      {equipments.map((equipment) => (
        <Card key={equipment.id}>
          <View style={styles.headerRow}>
            <View style={styles.headerText}>
              <Text style={styles.name}>{equipment.name}</Text>
              <Text style={styles.code}>{equipment.code}</Text>
            </View>
            <StatusBadge status={equipment.status} />
          </View>
          {equipment.imagePath ? (
            <Image source={{ uri: buildUploadUrl(equipment.imagePath) }} style={styles.image} />
          ) : null}
          <Text style={styles.meta}>카테고리: {equipment.category}</Text>
          <Text style={styles.meta}>보관 위치: {equipment.location || "-"}</Text>
          <Text style={styles.meta}>구성품: {joinComponents(equipment.components)}</Text>
          <View style={styles.actions}>
            <AppButton title="상세" variant="ghost" onPress={() => navigation.navigate("EquipmentDetail", { equipmentId: equipment.id })} />
            <AppButton title="수정" variant="secondary" onPress={() => navigation.navigate("EquipmentForm", { equipment })} />
            <AppButton title="삭제" variant="danger" onPress={() => handleDelete(equipment.id)} />
          </View>
        </Card>
      ))}
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
  image: {
    width: "100%",
    height: 200,
    borderRadius: 14,
    backgroundColor: "#eef2f7",
  },
  meta: {
    color: theme.colors.muted,
  },
  actions: {
    gap: 10,
  },
});
