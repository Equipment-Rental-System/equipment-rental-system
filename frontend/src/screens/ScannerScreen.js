import { Text, View } from "react-native";
import Header from "../components/Header";
import Page from "../components/Page";
import PrimaryButton from "../components/PrimaryButton";
import { styles } from "../styles/appStyles";

export default function ScannerScreen({ selectedItem, onBack, onScanSuccess }) {
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
          현재 작업본에서는 실카메라 대신 테스트 버튼으로 다음 화면으로 이동합니다.
        </Text>
        <PrimaryButton label="테스트 QR 인증" onPress={onScanSuccess} />
      </View>
    </Page>
  );
}
