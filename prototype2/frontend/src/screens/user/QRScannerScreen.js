import { CameraView, useCameraPermissions } from "expo-camera";
import { useState } from "react";
import { Alert, Platform, StyleSheet, Text, View } from "react-native";
import { api } from "../../api/client";
import AppButton from "../../components/AppButton";
import Card from "../../components/Card";
import Screen from "../../components/Screen";
import { useAuth } from "../../hooks/useAuth";
import { theme } from "../../styles/theme";

export default function QRScannerScreen({ route, navigation }) {
  const { token } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const { mode, equipmentCode, rentalId, allowMockScan = typeof __DEV__ !== "undefined" ? __DEV__ : true } = route.params || {};

  const moveToMyRentals = () => {
    navigation.navigate("UserTabs", { screen: "내대여" });
  };

  const handleBarcodeScanned = async ({ data }) => {
    if (scanned) {
      return;
    }

    setScanned(true);

    try {
      const equipment = await api.get(`/equipments/qr/${encodeURIComponent(data)}`, token);

      if (equipmentCode && equipment.code !== equipmentCode) {
        Alert.alert("QR 불일치", "선택한 기자재와 다른 QR 코드입니다.");
        setScanned(false);
        return;
      }

      if (mode === "rent") {
        navigation.navigate("RentalCheckout", {
          mode: "rent",
          equipment,
        });
        return;
      }

      if (mode === "return") {
        await api.post(`/rentals/${rentalId}/return-request`, {}, token);
        Alert.alert("반납 요청 완료", "관리자 실물 확인 후 최종 상태가 업데이트됩니다.", [
          { text: "확인", onPress: moveToMyRentals },
        ]);
        return;
      }

      navigation.navigate("EquipmentDetail", { equipmentId: equipment.id });
    } catch (error) {
      Alert.alert("QR 처리 오류", error.data?.message || error.message);
      setScanned(false);
    }
  };

  const runMockScan = async (mockValue) => {
    await handleBarcodeScanned({ data: mockValue });
  };

  if (!permission) {
    return (
      <Screen>
        <Text>카메라 권한 상태를 확인하는 중입니다.</Text>
      </Screen>
    );
  }

  if (!permission.granted) {
    return (
      <Screen>
        <View style={styles.permissionBox}>
          <Text style={styles.title}>카메라 권한이 필요합니다.</Text>
          <Text style={styles.description}>
            {Platform.OS === "ios"
              ? "QR 코드를 스캔하려면 iPhone 카메라 접근 권한을 허용해주세요."
              : "QR 코드를 스캔하려면 Android 카메라 접근 권한을 허용해주세요."}
          </Text>
          <AppButton title="권한 허용" onPress={requestPermission} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll={false} style={styles.full}>
      <View style={styles.scannerHeader}>
        <Text style={styles.title}>
          {mode === "rent" ? "대여용 QR 인증" : mode === "return" ? "반납용 QR 인증" : "QR 스캔"}
        </Text>
        <Text style={styles.description}>기자재에 부착된 QR 코드를 카메라에 맞춰주세요.</Text>
      </View>
      {equipmentCode ? (
        <Card style={styles.infoCard}>
          <Text style={styles.infoLabel}>대상 기자재 코드</Text>
          <Text style={styles.infoValue}>{equipmentCode}</Text>
          <Text style={styles.infoHint}>다른 기자재 QR을 스캔하면 대여 또는 반납 요청이 차단됩니다.</Text>
        </Card>
      ) : null}
      <CameraView
        style={styles.camera}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={handleBarcodeScanned}
      />
      <AppButton title="다시 스캔" variant="secondary" onPress={() => setScanned(false)} />
      {allowMockScan ? (
        <View style={styles.mockActions}>
          <Text style={styles.mockTitle}>테스트용 QR 진행</Text>
          <AppButton
            title={equipmentCode ? `${equipmentCode} 로 mock 스캔` : "EQ-LAP-001 로 mock 스캔"}
            variant="ghost"
            onPress={() => runMockScan(equipmentCode || "EQ-LAP-001")}
          />
          {equipmentCode ? (
            <AppButton
              title="불일치 QR mock 스캔"
              variant="danger"
              onPress={() => runMockScan("EQ-NOT-MATCH-999")}
            />
          ) : null}
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  full: {
    flex: 1,
  },
  permissionBox: {
    gap: 12,
  },
  scannerHeader: {
    gap: 8,
  },
  infoCard: {
    gap: 6,
  },
  infoLabel: {
    color: theme.colors.muted,
    fontSize: 13,
  },
  infoValue: {
    fontSize: 20,
    fontWeight: "800",
    color: theme.colors.text,
  },
  infoHint: {
    color: theme.colors.muted,
    lineHeight: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: theme.colors.text,
  },
  description: {
    color: theme.colors.muted,
  },
  camera: {
    flex: 1,
    minHeight: 420,
    borderRadius: 24,
    overflow: "hidden",
  },
  mockActions: {
    gap: 10,
  },
  mockTitle: {
    fontWeight: "700",
    color: theme.colors.text,
  },
});
