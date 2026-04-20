import { Alert, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { useEffect, useState } from "react";
import { CameraView, useCameraPermissions } from "expo-camera";
import AppButton from "../../components/AppButton";
import Screen from "../../components/Screen";
import { api } from "../../api/client";
import { useAuth } from "../../hooks/useAuth";
import { theme } from "../../styles/theme";
import { formatRelativePlatformLabel, getErrorMessage } from "../../utils/helpers";

export default function QRScannerScreen({ navigation, route }) {
  const { token } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const [isLocked, setIsLocked] = useState(false);
  const { height } = useWindowDimensions();
  const mode = route.params?.mode || "lookup";
  const expectedCode = route.params?.equipmentCode;
  const [mockScanCode, setMockScanCode] = useState(route.params?.mockCode || expectedCode || null);
  const cameraHeight = Math.min(Math.max(300, Math.floor(height * 0.34)), 390);

  useEffect(() => {
    async function prepareMockCode() {
      if (!route.params?.allowMockScan) {
        return;
      }

      if (route.params?.mockCode || expectedCode) {
        setMockScanCode(route.params?.mockCode || expectedCode);
        return;
      }

      try {
        const rows = await api.get("/equipments?status=AVAILABLE", token);
        const firstAvailableCode = Array.isArray(rows) ? rows[0]?.code : null;
        setMockScanCode(firstAvailableCode || null);
      } catch (error) {
        setMockScanCode(null);
      }
    }

    prepareMockCode();
  }, [expectedCode, route.params?.allowMockScan, route.params?.mockCode, token]);

  const moveNext = async (scannedCode) => {
    try {
      const equipment = await api.get(`/equipments/qr/${encodeURIComponent(scannedCode)}`, token);

      if (mode === "rent" || mode === "return") {
        navigation.navigate("RentalCheckout", {
          mode,
          equipment,
          rentalId: route.params?.rentalId,
          scannedCode,
        });
        return;
      }

      navigation.navigate("EquipmentDetail", { equipmentId: equipment.id });
    } catch (error) {
      Alert.alert("QR 조회 실패", getErrorMessage(error));
      setIsLocked(false);
    }
  };

  const handleScan = async ({ data }) => {
    if (isLocked) {
      return;
    }

    setIsLocked(true);

    if (expectedCode && expectedCode !== data) {
      Alert.alert("QR 불일치", "선택한 기자재와 다른 QR 코드입니다. 같은 기자재의 QR을 다시 스캔해주세요.");
      setIsLocked(false);
      return;
    }

    await moveNext(data);
  };

  if (!permission) {
    return (
      <Screen showWatermark={false} backgroundColor={theme.colors.scannerBg}>
        <Text style={styles.permissionTitle}>카메라 권한을 확인하는 중입니다.</Text>
      </Screen>
    );
  }

  if (!permission.granted) {
    return (
      <Screen style={styles.permissionScreen} showWatermark={false} backgroundColor={theme.colors.scannerBg}>
        <Text style={styles.scannerTitle}>QR 스캔</Text>
        <Text style={styles.permissionTitle}>카메라 권한이 필요합니다.</Text>
        <Text style={styles.permissionHelp}>
          {formatRelativePlatformLabel()}에서 QR 스캔을 진행하려면 카메라 접근을 허용해주세요.
        </Text>
        <AppButton title="권한 요청" onPress={requestPermission} />
      </Screen>
    );
  }

  return (
    <Screen scroll={false} style={styles.screen} showWatermark={false} backgroundColor={theme.colors.scannerBg}>
      <View style={styles.topBlock}>
        <Text style={styles.scannerTitle}>QR 코드 스캔</Text>
        <Text style={styles.scannerHelp}>
          {mode === "lookup"
            ? "기자재 QR을 스캔하면 해당 상세 화면으로 이동합니다."
            : "기자재에 부착된 QR을 스캔한 뒤 다음 화면에서 대여 또는 반납 요청을 진행합니다."}
        </Text>
        {expectedCode ? <Text style={styles.expectedCode}>기준 코드: {expectedCode}</Text> : null}
      </View>

      <View style={[styles.cameraShell, { height: cameraHeight }]}>
        <CameraView
          style={styles.camera}
          onBarcodeScanned={handleScan}
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        />
        <View style={styles.scanFrame} />
      </View>

      <View style={styles.bottomBlock}>
        <Text style={styles.bottomText}>프레임 안에 QR 코드를 맞추면 자동으로 인식됩니다.</Text>
        <AppButton title="다시 스캔하기" variant="secondary" onPress={() => setIsLocked(false)} />
        {route.params?.allowMockScan ? (
          <AppButton
            title={mockScanCode ? `테스트 QR(${mockScanCode})` : "테스트 QR 준비 중"}
            variant="ghost"
            onPress={() => {
              if (!mockScanCode) {
                Alert.alert("테스트 QR 없음", "현재 대여 가능한 기자재가 없어 테스트 QR을 사용할 수 없습니다.");
                return;
              }

              handleScan({ data: mockScanCode });
            }}
            disabled={!mockScanCode}
          />
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: 18,
    justifyContent: "center",
  },
  topBlock: {
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 22,
    padding: 18,
  },
  scannerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#ffffff",
  },
  scannerHelp: {
    color: "#d8def0",
    lineHeight: 21,
  },
  expectedCode: {
    color: "#8db0ff",
    fontWeight: "700",
  },
  cameraShell: {
    overflow: "hidden",
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    backgroundColor: "#000000",
    justifyContent: "center",
    alignItems: "center",
  },
  camera: {
    ...StyleSheet.absoluteFillObject,
  },
  scanFrame: {
    width: 220,
    height: 220,
    borderWidth: 2,
    borderColor: "#ffffff",
    borderRadius: 18,
    backgroundColor: "transparent",
  },
  bottomBlock: {
    gap: 10,
  },
  bottomText: {
    color: "#d8def0",
    textAlign: "center",
    lineHeight: 20,
  },
  permissionScreen: {
    justifyContent: "center",
  },
  permissionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#ffffff",
    textAlign: "center",
  },
  permissionHelp: {
    color: "#d8def0",
    textAlign: "center",
    lineHeight: 21,
  },
});
