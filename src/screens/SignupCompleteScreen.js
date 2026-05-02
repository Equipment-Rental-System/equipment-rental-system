import { Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Page from "../components/Page";
import PrimaryButton from "../components/PrimaryButton";
import { styles } from "../styles/appStyles";

export default function SignupCompleteScreen({ onBack }) {
  return (
    <Page>
      <View style={styles.completeWrap}>
        <View style={styles.completeIcon}>
          <MaterialCommunityIcons name="check" size={50} color="#ffffff" />
        </View>
        <Text style={styles.completeTitle}>가입 신청이 완료되었습니다.</Text>
        <Text style={styles.completeDescription}>
          관리자 승인 후 로그인할 수 있습니다. 승인 안내가 오면 로그인 화면에서 다시 시도해주세요.
        </Text>
        <PrimaryButton label="돌아가기" onPress={onBack} />
      </View>
    </Page>
  );
}
