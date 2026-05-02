import { useState } from "react";
import { Text, View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import Header from "../components/Header";
import Page from "../components/Page";
import PrimaryButton from "../components/PrimaryButton";
import { styles } from "../styles/appStyles";

export default function ScannerScreen({ selectedItem, onBack, onScanSuccess, loading }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const hasPermission = permission?.granted;

  function handleBarcodeScanned(result) {
    if (scanned || loading) {
      return;
    }

    const scannedValue = result?.data;
    if (!scannedValue) {
      return;
    }

    setScanned(true);
    onScanSuccess(scannedValue);
  }

  function handleMockScan() {
    setScanned(true);
    onScanSuccess(selectedItem?.qrValue || selectedItem?.code);
  }

  return (
    <Page dark>
      <Header title="QR 스캔" onBack={onBack} dark />
      <View style={styles.scannerWrap}>
        <Text style={styles.scannerTitle}>{selectedItem?.name}</Text>
        <Text style={styles.scannerCode}>{selectedItem?.code}</Text>

        <View style={styles.scannerFrame}>
          {hasPermission ? (
            <CameraView
              style={styles.scannerCamera}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
              onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
            />
          ) : (
            <View style={styles.scannerPermissionBox}>
              <Text style={styles.scannerPermissionText}>
                QR 스캔을 위해 카메라 권한이 필요합니다.
              </Text>
            </View>
          )}
          <View style={[styles.scannerCorner, styles.cornerLeftTop]} />
          <View style={[styles.scannerCorner, styles.cornerRightTop]} />
          <View style={[styles.scannerCorner, styles.cornerLeftBottom]} />
          <View style={[styles.scannerCorner, styles.cornerRightBottom]} />
        </View>

        <Text style={styles.scannerGuide}>QR 코드를 사각형 안에 맞춰주세요.</Text>
        <Text style={styles.scannerSubGuide}>
          스캔 값이 현재 선택한 기자재 코드와 일치해야 대여 상세 화면으로 이동합니다.
        </Text>

        {!hasPermission ? (
          <PrimaryButton label="카메라 권한 허용" onPress={requestPermission} />
        ) : null}

        <PrimaryButton
          label={loading ? "QR 확인 중..." : scanned ? "다시 테스트" : "테스트용 QR 스캔"}
          onPress={() => {
            setScanned(false);
            setTimeout(handleMockScan, 0);
          }}
          disabled={loading}
        />
      </View>
    </Page>
  );
}
