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
import { formatDate, getErrorMessage, joinComponents, translateStatus } from "../../utils/helpers";

export default function EquipmentDetailScreen({ navigation, route }) {
  const { token, user, isAdmin } = useAuth();
  const [equipment, setEquipment] = useState(route.params?.equipment || null);
  const [qrImage, setQrImage] = useState(null);
  const [loading, setLoading] = useState(true);

  const equipmentId = route.params?.equipmentId || route.params?.equipment?.id;

  const loadEquipment = async () => {
    try {
      setLoading(true);
      const [equipmentRow, qrRow] = await Promise.all([
        api.get(`/equipments/${equipmentId}`, token),
        api.get(`/equipments/${equipmentId}/qr`, token),
      ]);
      setEquipment(equipmentRow);
      setQrImage(qrRow?.qrImage || null);
    } catch (error) {
      Alert.alert("상세 조회 실패", getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadEquipment();
    }, [equipmentId, token])
  );

  if (loading && !equipment) {
    return <LoadingView text="기자재 상세 정보를 불러오는 중입니다." />;
  }

  const imageUrl = buildUploadUrl(equipment?.imagePath);
  const currentRental = equipment?.currentRental;
  const isMine = currentRental?.userId === user?.id;
  const canRequestRental = !isAdmin && equipment?.status === "AVAILABLE";
  const canRequestReturn = !isAdmin && isMine && ["RENTED", "OVERDUE"].includes(equipment?.status);
  const canRequestExtension = !isAdmin && isMine && ["RENTED", "OVERDUE"].includes(equipment?.status);

  return (
    <Screen>
      <Card>
        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            <Text style={styles.name}>{equipment?.name}</Text>
            <Text style={styles.code}>{equipment?.code}</Text>
          </View>
          <StatusBadge status={equipment?.status} />
        </View>

        {imageUrl ? <Image source={{ uri: imageUrl }} style={styles.image} /> : null}

        <Text style={styles.meta}>카테고리: {equipment?.category}</Text>
        <Text style={styles.meta}>보관 위치: {equipment?.location || "-"}</Text>
        <Text style={styles.meta}>구성품: {joinComponents(equipment?.components)}</Text>
        <Text style={styles.description}>{equipment?.description || "설명이 등록되지 않았습니다."}</Text>
      </Card>

      {currentRental ? (
        <Card>
          <Text style={styles.sectionTitle}>현재 대여 정보</Text>
          <Text style={styles.meta}>대여자: {currentRental.userName}</Text>
          <Text style={styles.meta}>학번: {currentRental.studentId}</Text>
          <Text style={styles.meta}>반납 예정일: {formatDate(currentRental.dueDate)}</Text>
          <Text style={styles.meta}>대여 상태: {translateStatus(currentRental.status)}</Text>
        </Card>
      ) : null}

      {qrImage ? (
        <Card>
          <Text style={styles.sectionTitle}>등록된 QR 코드</Text>
          <Image source={{ uri: qrImage }} style={styles.qrImage} />
          <Text style={styles.qrHelp}>QR 안에는 URL이 아닌 기자재 고유 코드만 저장되어 있습니다.</Text>
        </Card>
      ) : null}

      <Card>
        <Text style={styles.sectionTitle}>실행</Text>
        {canRequestRental ? (
          <AppButton
            title="대여 신청 후 QR 인증"
            onPress={() =>
              navigation.navigate("QRScanner", {
                mode: "rent",
                equipmentId: equipment.id,
                equipmentCode: equipment.code,
                allowMockScan: true,
              })
            }
          />
        ) : null}
        {canRequestExtension ? (
          <AppButton
            title="연장 요청"
            variant="secondary"
            onPress={() =>
              navigation.navigate("RentalCheckout", {
                mode: "extend",
                equipment,
                rentalId: currentRental.id,
                currentDueDate: currentRental.dueDate,
              })
            }
          />
        ) : null}
        {canRequestReturn ? (
          <AppButton
            title="QR 인증 후 반납 요청"
            variant="ghost"
            onPress={() =>
              navigation.navigate("QRScanner", {
                mode: "return",
                equipmentId: equipment.id,
                equipmentCode: equipment.code,
                rentalId: currentRental.id,
                allowMockScan: true,
              })
            }
          />
        ) : null}
        {isAdmin ? (
          <View style={styles.adminActions}>
            <AppButton title="기자재 수정" onPress={() => navigation.navigate("EquipmentForm", { equipment })} />
            <AppButton title="관리 목록으로 이동" variant="secondary" onPress={() => navigation.navigate("EquipmentManagement")} />
          </View>
        ) : null}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
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
    fontSize: 22,
    fontWeight: "800",
    color: theme.colors.text,
  },
  code: {
    color: theme.colors.primary,
    fontWeight: "700",
  },
  image: {
    width: "100%",
    height: 220,
    borderRadius: 16,
    backgroundColor: "#eef2f7",
  },
  meta: {
    color: theme.colors.muted,
    lineHeight: 20,
  },
  description: {
    color: theme.colors.text,
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.text,
  },
  qrImage: {
    width: 220,
    height: 220,
    alignSelf: "center",
  },
  qrHelp: {
    color: theme.colors.muted,
    textAlign: "center",
  },
  adminActions: {
    gap: 10,
  },
});
