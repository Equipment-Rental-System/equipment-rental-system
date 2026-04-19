import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { Alert, Image, StyleSheet, Text, View } from "react-native";
import { api, buildUploadUrl } from "../../api/client";
import AppButton from "../../components/AppButton";
import Card from "../../components/Card";
import LoadingView from "../../components/LoadingView";
import Screen from "../../components/Screen";
import StatusBadge from "../../components/StatusBadge";
import { useAuth } from "../../hooks/useAuth";
import { theme } from "../../styles/theme";

export default function EquipmentDetailScreen({ route, navigation }) {
  const { token, user, isAdmin } = useAuth();
  const { equipmentId } = route.params;
  const [equipment, setEquipment] = useState(null);
  const [qrData, setQrData] = useState(null);
  const [myRentals, setMyRentals] = useState([]);

  const loadDetail = useCallback(async () => {
    try {
      const [equipmentData, qrInfo, rentals] = await Promise.all([
        api.get(`/equipments/${equipmentId}`, token),
        api.get(`/equipments/${equipmentId}/qr`, token),
        api.get("/rentals", token),
      ]);
      setEquipment(equipmentData);
      setQrData(qrInfo);
      setMyRentals(rentals);
    } catch (error) {
      Alert.alert("오류", error.data?.message || error.message);
    }
  }, [equipmentId, token]);

  useFocusEffect(
    useCallback(() => {
      loadDetail();
    }, [loadDetail])
  );

  if (!equipment) {
    return (
      <Screen>
        <LoadingView text="기자재 상세 정보를 불러오는 중입니다." />
      </Screen>
    );
  }

  const activeRental = myRentals.find(
    (item) =>
      item.equipmentId === equipment.id &&
      ["APPROVED", "EXTENSION_APPROVED", "EXTENSION_REJECTED", "OVERDUE", "RETURN_PENDING"].includes(item.status)
  );
  const myActiveRental = activeRental && activeRental.userId === user?.id ? activeRental : null;

  return (
    <Screen>
      <Card>
        <View style={styles.headerRow}>
          <StatusBadge status={equipment.status} />
          <Text style={styles.code}>{equipment.code}</Text>
        </View>
        <Text style={styles.title}>{equipment.name}</Text>
        <Text style={styles.meta}>{equipment.category} · {equipment.location || "위치 미지정"}</Text>
        {equipment.imagePath ? (
          <Image source={{ uri: buildUploadUrl(equipment.imagePath) }} style={styles.equipmentImage} />
        ) : null}
        <Text style={styles.description}>{equipment.description || "설명 없음"}</Text>
        <Text style={styles.sectionTitle}>구성품</Text>
        <Text style={styles.components}>
          {equipment.components?.length ? equipment.components.join(", ") : "구성품 정보 없음"}
        </Text>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>기자재 QR</Text>
        {qrData?.qrImage ? (
          <Image source={{ uri: qrData.qrImage }} style={styles.qrImage} />
        ) : (
          <Text style={styles.meta}>QR 이미지를 불러오지 못했습니다.</Text>
        )}
      </Card>

      {!isAdmin && (
        <Card>
          <Text style={styles.sectionTitle}>대여 / 반납</Text>
          {equipment.status === "AVAILABLE" ? (
            <AppButton
              title="대여 신청 후 QR 인증"
              onPress={() =>
                navigation.navigate("QRScanner", {
                  mode: "rent",
                  equipmentId: equipment.id,
                  equipmentCode: equipment.code,
                })
              }
            />
          ) : null}

          {myActiveRental && ["APPROVED", "EXTENSION_APPROVED", "EXTENSION_REJECTED", "OVERDUE"].includes(myActiveRental.status) ? (
            <>
              <AppButton
                title="연장 요청"
                variant="secondary"
                onPress={() =>
                  navigation.navigate("RentalCheckout", {
                    mode: "extend",
                    rental: myActiveRental,
                    equipment,
                  })
                }
              />
              <AppButton
                title="QR 인증 후 반납 요청"
                variant="ghost"
                onPress={() =>
                  navigation.navigate("QRScanner", {
                    mode: "return",
                    equipmentId: equipment.id,
                    equipmentCode: equipment.code,
                    rentalId: myActiveRental.id,
                  })
                }
              />
            </>
          ) : null}
          {!myActiveRental && equipment.status !== "AVAILABLE" && (
            <Text style={styles.meta}>현재 이 기자재는 다른 요청 또는 대여 흐름에 포함되어 있습니다.</Text>
          )}
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  code: {
    color: theme.colors.muted,
    fontWeight: "700",
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: theme.colors.text,
  },
  meta: {
    color: theme.colors.muted,
  },
  description: {
    color: theme.colors.text,
    lineHeight: 22,
  },
  sectionTitle: {
    fontWeight: "700",
    color: theme.colors.text,
  },
  components: {
    color: theme.colors.text,
  },
  qrImage: {
    width: 220,
    height: 220,
    alignSelf: "center",
  },
  equipmentImage: {
    width: "100%",
    height: 220,
    borderRadius: 16,
  },
});
