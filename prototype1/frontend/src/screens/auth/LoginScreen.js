import { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import AppButton from "../../components/AppButton";
import AppInput from "../../components/AppInput";
import Card from "../../components/Card";
import Screen from "../../components/Screen";
import { useAuth } from "../../hooks/useAuth";
import { theme } from "../../styles/theme";

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [studentId, setStudentId] = useState("admin01");
  const [password, setPassword] = useState("admin1234");
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async () => {
    setSubmitting(true);
    try {
      await login(studentId, password);
    } catch (error) {
      Alert.alert("로그인 실패", error.data?.message || error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>Mobile MVP</Text>
        <Text style={styles.title}>스마트 학과 기자재 대여 관리기</Text>
        <Text style={styles.description}>
          학번과 비밀번호로 로그인하고, QR 스캔을 통해 기자재 대여와 반납 요청을 진행합니다.
        </Text>
      </View>

      <Card>
        <AppInput label="학번" value={studentId} onChangeText={setStudentId} placeholder="예: 20240001" />
        <AppInput
          label="비밀번호"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="비밀번호 입력"
        />
        <AppButton title={submitting ? "로그인 중..." : "로그인"} onPress={handleLogin} disabled={submitting} />
        <AppButton title="회원가입" variant="secondary" onPress={() => navigation.navigate("Signup")} />
      </Card>

      <Card>
        <Text style={styles.helpTitle}>테스트 계정</Text>
        <Text style={styles.helpText}>관리자: admin01 / admin1234</Text>
        <Text style={styles.helpText}>사용자: 20240001 / user1234, 20240002 / user1234</Text>
        <Text style={styles.helpText}>승인 대기: 20240003 / user1234</Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: 10,
  },
  eyebrow: {
    color: theme.colors.primary,
    fontWeight: "700",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: theme.colors.text,
  },
  description: {
    color: theme.colors.muted,
    lineHeight: 22,
  },
  helpTitle: {
    fontWeight: "700",
    color: theme.colors.text,
  },
  helpText: {
    color: theme.colors.muted,
  },
});

