import { Text, View } from "react-native";
import Header from "../components/Header";
import Page from "../components/Page";
import PrimaryButton from "../components/PrimaryButton";
import { styles } from "../styles/appStyles";

export default function ScannerScreen({ selectedItem, onBack, onScanSuccess, loading }) {
  return (
    <Page dark>
      <Header title="QR 스캔" onBack={onBack} dark />
      <View style={styles.scannerWrap}>
        <Text style={styles.scannerTitle}>{selectedItem?.name}</Text>
        <Text style={styles.scannerCode}>{selectedItem?.code}</Text>
        <View style={styles.scannerFrame}>
          <View style={[styles.scannerCorner, styles.cornerLeftTop]} />
          <View style={[styles.scannerCorner, styles.cornerRightTop]} />
          <View style={[styles.scannerCorner, styles.cornerLeftBottom]} />
          <View style={[styles.scannerCorner, styles.cornerRightBottom]} />
        </View>
        <Text style={styles.scannerGuide}>QR 코드를 사각형 안에 맞춰주세요</Text>
        <Text style={styles.scannerSubGuide}>
          현재 작업본에서는 실카메라 대신 선택한 기자재의 QR 값으로 인증 요청을 보냅니다.
        </Text>
        <PrimaryButton
          label={loading ? "QR 확인 중..." : "QR 인증 확인"}
          onPress={onScanSuccess}
          disabled={loading}
        />
      </View>
    </Page>
  );
}
