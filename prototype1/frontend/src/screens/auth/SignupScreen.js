import { useState } from "react";
import { Alert, Image, StyleSheet, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import AppButton from "../../components/AppButton";
import AppInput from "../../components/AppInput";
import Card from "../../components/Card";
import Screen from "../../components/Screen";
import { useAuth } from "../../hooks/useAuth";
import { theme } from "../../styles/theme";

export default function SignupScreen({ navigation }) {
  const { signup } = useAuth();
  const [form, setForm] = useState({
    name: "",
    studentId: "",
    department: "",
    password: "",
    studentCardImage: null,
  });
  const [submitting, setSubmitting] = useState(false);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("권한 필요", "학생증 이미지를 선택하려면 사진 접근 권한이 필요합니다.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.length) {
      const asset = result.assets[0];
      setForm((prev) => ({
        ...prev,
        studentCardImage: {
          uri: asset.uri,
          name: asset.fileName || `${prev.studentId || "student-card"}.jpg`,
          type: asset.mimeType || "image/jpeg",
        },
      }));
    }
  };

  const handleSubmit = async () => {
    if (!form.studentCardImage) {
      Alert.alert("입력 확인", "학생증 이미지 업로드가 필요합니다.");
      return;
    }

    setSubmitting(true);
    try {
      await signup(form);
      Alert.alert("회원가입 완료", "관리자 승인 후 로그인할 수 있습니다.", [
        { text: "확인", onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert("회원가입 실패", error.data?.message || error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen>
      <Card>
        <Text style={styles.title}>회원가입</Text>
        <Text style={styles.description}>
          헤이영캠퍼스 학생증 캡처 이미지를 업로드하면 관리자가 확인 후 승인합니다.
        </Text>
        <AppInput label="이름" value={form.name} onChangeText={(value) => setForm({ ...form, name: value })} />
        <AppInput
          label="학번"
          value={form.studentId}
          onChangeText={(value) => setForm({ ...form, studentId: value })}
        />
        <AppInput
          label="학과"
          value={form.department}
          onChangeText={(value) => setForm({ ...form, department: value })}
        />
        <AppInput
          label="비밀번호"
          value={form.password}
          secureTextEntry
          onChangeText={(value) => setForm({ ...form, password: value })}
        />
        <AppButton title="학생증 이미지 선택" variant="secondary" onPress={pickImage} />
        {form.studentCardImage?.uri ? (
          <Image source={{ uri: form.studentCardImage.uri }} style={styles.preview} />
        ) : (
          <Text style={styles.placeholder}>학생증 이미지를 업로드해주세요.</Text>
        )}
        <AppButton
          title={submitting ? "가입 요청 중..." : "가입 요청"}
          onPress={handleSubmit}
          disabled={submitting}
        />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: theme.colors.text,
  },
  description: {
    color: theme.colors.muted,
    lineHeight: 20,
  },
  preview: {
    width: "100%",
    height: 200,
    borderRadius: 16,
  },
  placeholder: {
    color: theme.colors.muted,
  },
});

