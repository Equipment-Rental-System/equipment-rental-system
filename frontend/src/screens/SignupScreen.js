import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, View, ScrollView } from "react-native";
import Header from "../components/Header";
import InputField from "../components/InputField";
import Page from "../components/Page";
import PrimaryButton from "../components/PrimaryButton";
import { styles } from "../styles/appStyles";

export default function SignupScreen({ form, onChange, onBack, onSubmit }) {
  return (
    <Page>
      <Header title="회원가입" onBack={onBack} />
      <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
        <View style={styles.authCard}>
          <InputField
            label="학번"
            value={form.studentId}
            onChangeText={(value) => onChange("studentId", value)}
            placeholder="학번을 입력해주세요"
          />
          <InputField
            label="이름"
            value={form.name}
            onChangeText={(value) => onChange("name", value)}
            placeholder="이름을 입력해주세요"
          />
          <InputField
            label="이메일"
            value={form.email}
            onChangeText={(value) => onChange("email", value)}
            placeholder="이메일을 입력해주세요"
          />
          <InputField
            label="비밀번호"
            value={form.password}
            onChangeText={(value) => onChange("password", value)}
            placeholder="비밀번호를 입력해주세요"
            secureTextEntry
          />

          <View style={styles.uploadPlaceholder}>
            <MaterialCommunityIcons name="image-outline" size={28} color="#64748b" />
            <Text style={styles.uploadPlaceholderText}>학생증 업로드 영역</Text>
            <Text style={styles.uploadPlaceholderSubText}>현재 작업본에서는 화면만 제공합니다.</Text>
          </View>

          <PrimaryButton label="회원가입 완료" onPress={onSubmit} />
        </View>
      </ScrollView>
    </Page>
  );
}
