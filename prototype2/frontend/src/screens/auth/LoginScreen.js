import { Alert, StyleSheet, Text, View } from "react-native";
import { useState } from "react";
import AppButton from "../../components/AppButton";
import AppInput from "../../components/AppInput";
import Card from "../../components/Card";
import Screen from "../../components/Screen";
import { useAuth } from "../../hooks/useAuth";
import { theme } from "../../styles/theme";
import { getErrorMessage } from "../../utils/helpers";

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async () => {
    if (!studentId.trim() || !password.trim()) {
      Alert.alert("입력 확인", "학번 또는 관리자 아이디와 비밀번호를 모두 입력해주세요.");
      return;
    }

    try {
      setSubmitting(true);
      await login(studentId.trim(), password);
    } catch (error) {
      Alert.alert("로그인 실패", getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>DGU EQUIP</Text>
        <Text style={styles.title}>스마트 학과 기자재 대여 관리기</Text>
        <Text style={styles.subtitle}>
          컴퓨터공학과 사무실 기자재를 모바일에서 조회하고 QR 인증 후 대여할 수 있습니다.
        </Text>
      </View>

      <Card style={styles.formCard}>
        <AppInput
          label="학번 또는 관리자 아이디"
          value={studentId}
          onChangeText={setStudentId}
          placeholder="예: 20240001 또는 admin01"
          keyboardType="default"
          inputMode="text"
          autoCapitalize="none"
          autoComplete="username"
          textContentType="username"
          importantForAutofill="yes"
          returnKeyType="next"
        />
        <AppInput
          label="비밀번호"
          value={password}
          onChangeText={setPassword}
          placeholder="비밀번호를 입력해주세요"
          secureTextEntry
          keyboardType="default"
          inputMode="text"
          autoComplete="password"
          textContentType="password"
          importantForAutofill="yes"
          returnKeyType="done"
        />
        <AppButton title={submitting ? "로그인 중..." : "로그인"} onPress={handleLogin} disabled={submitting} />
        <AppButton title="회원가입" variant="secondary" onPress={() => navigation.navigate("Signup")} />
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>테스트 계정</Text>
        <Text style={styles.helper}>관리자: admin01 / admin1234</Text>
        <Text style={styles.helper}>사용자: 20240001 / user1234</Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
  },
  hero: {
    gap: 10,
    paddingTop: 28,
  },
  eyebrow: {
    color: theme.colors.primary,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  title: {
    fontSize: 29,
    fontWeight: "800",
    color: theme.colors.text,
    lineHeight: 38,
  },
  subtitle: {
    color: theme.colors.muted,
    lineHeight: 22,
  },
  formCard: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.text,
  },
  helper: {
    color: theme.colors.muted,
    lineHeight: 20,
  },
});
