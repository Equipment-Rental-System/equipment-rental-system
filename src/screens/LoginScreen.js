import { Pressable, Text, View } from "react-native";
import Header from "../components/Header";
import InputField from "../components/InputField";
import Page from "../components/Page";
import PrimaryButton from "../components/PrimaryButton";
import { styles } from "../styles/appStyles";

export default function LoginScreen({
  studentId,
  password,
  onChangeStudentId,
  onChangePassword,
  onLogin,
  onSignup,
  loading,
}) {
  return (
    <Page>
      <Header title="로그인" />
      <View style={styles.centerWrap}>
        <View style={styles.authCard}>
          <Text style={styles.brand}>동국대학교</Text>
          <Text style={styles.authTitle}>스마트 학과 기자재 대여 관리</Text>
          <Text style={styles.authSubtitle}>
            학생은 학번으로, 관리자는 관리자 아이디로 로그인할 수 있습니다.
          </Text>

          <InputField
            label="학번 또는 관리자 아이디"
            value={studentId}
            onChangeText={onChangeStudentId}
            placeholder="예: 20240001 또는 admin01"
          />
          <InputField
            label="비밀번호"
            value={password}
            onChangeText={onChangePassword}
            placeholder="비밀번호를 입력해주세요"
            secureTextEntry
            returnKeyType="done"
            onSubmitEditing={onLogin}
            blurOnSubmit
          />

          <PrimaryButton
            label={loading ? "로그인 중..." : "로그인"}
            onPress={onLogin}
            disabled={loading}
          />

          <Pressable onPress={onSignup}>
            <Text style={styles.linkText}>계정이 없나요? 회원가입</Text>
          </Pressable>
        </View>
      </View>
    </Page>
  );
}
