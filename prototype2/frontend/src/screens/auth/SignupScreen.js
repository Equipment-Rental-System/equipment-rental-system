import { Alert, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import AppButton from "../../components/AppButton";
import AppInput from "../../components/AppInput";
import Card from "../../components/Card";
import Screen from "../../components/Screen";
import StudentIdKeypadField from "../../components/StudentIdKeypadField";
import { useAuth } from "../../hooks/useAuth";
import { theme } from "../../styles/theme";
import { getErrorMessage } from "../../utils/helpers";

const DEPARTMENT_OPTIONS = ["컴퓨터공학과", "인공지능학과", "소프트웨어학과", "전자전기공학과"];

function toUploadFile(asset) {
  return {
    uri: asset.uri,
    name: asset.fileName || `student-card-${Date.now()}.jpg`,
    type: asset.mimeType || "image/jpeg",
  };
}

export default function SignupScreen({ navigation }) {
  const { signup } = useAuth();
  const [name, setName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [department, setDepartment] = useState("");
  const [password, setPassword] = useState("");
  const [studentCardAsset, setStudentCardAsset] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleStudentIdChange = (nextValue) => {
    setStudentId(nextValue.replace(/[^0-9]/g, ""));
  };

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("권한 필요", "학생증 이미지를 선택하려면 사진 접근 권한이 필요합니다.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: false,
    });

    if (!result.canceled && result.assets?.length) {
      setStudentCardAsset(result.assets[0]);
    }
  };

  const handleSignup = async () => {
    if (!name.trim() || !studentId.trim() || !department.trim() || !password.trim()) {
      Alert.alert("입력 확인", "이름, 학번, 학과, 비밀번호를 모두 입력해주세요.");
      return;
    }

    if (!studentCardAsset) {
      Alert.alert("학생증 필요", "헤이영캠퍼스 학생증 캡처 이미지를 첨부해주세요.");
      return;
    }

    try {
      setSubmitting(true);
      await signup({
        name: name.trim(),
        studentId: studentId.trim(),
        department: department.trim(),
        password,
        studentCardImage: toUploadFile(studentCardAsset),
      });
      Alert.alert("가입 요청 완료", "회원가입 요청이 접수되었습니다. 관리자 승인 후 로그인할 수 있습니다.", [
        { text: "확인", onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert("회원가입 실패", getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen>
      <View style={styles.hero}>
        <Text style={styles.title}>회원가입</Text>
        <Text style={styles.subtitle}>학생증 이미지를 제출하면 관리자가 확인 후 계정을 승인합니다.</Text>
      </View>

      <Card style={styles.formCard}>
        <AppInput
          label="이름"
          value={name}
          onChangeText={setName}
          placeholder="이름 입력"
          autoCapitalize="words"
          returnKeyType="next"
        />

        <StudentIdKeypadField value={studentId} onChangeText={handleStudentIdChange} placeholder="예: 20240003" />

        <AppInput
          label="학과"
          value={department}
          onChangeText={setDepartment}
          placeholder="예: 컴퓨터공학과"
          autoCapitalize="words"
          returnKeyType="next"
        />

        <View style={styles.chipWrap}>
          {DEPARTMENT_OPTIONS.map((option) => {
            const active = department === option;
            return (
              <Pressable
                key={option}
                onPress={() => setDepartment(option)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{option}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.helperText}>
          에뮬레이터에서 한글 키보드가 영어만 보이면, PC 키보드에서 `한/영` 전환 후 바로 입력해도 됩니다.
        </Text>

        <AppInput
          label="비밀번호"
          value={password}
          onChangeText={setPassword}
          placeholder="비밀번호 입력"
          secureTextEntry
          keyboardType="default"
          inputMode="text"
          autoComplete="password-new"
          textContentType="newPassword"
          importantForAutofill="yes"
          returnKeyType="done"
        />

        <AppButton title="학생증 이미지 선택" variant="secondary" onPress={pickImage} />

        {studentCardAsset ? (
          <View style={styles.previewBlock}>
            <Image source={{ uri: studentCardAsset.uri }} style={styles.previewImage} />
            <Text style={styles.previewText}>선택된 파일: {studentCardAsset.fileName || "student-card.jpg"}</Text>
          </View>
        ) : (
          <Text style={styles.notice}>헤이영캠퍼스 학생증 캡처 이미지를 첨부해주세요.</Text>
        )}

        <AppButton title={submitting ? "가입 요청 중..." : "가입 요청"} onPress={handleSignup} disabled={submitting} />
        <AppButton
          title="메인화면으로 이동"
          variant="secondary"
          onPress={() => navigation.navigate("Login")}
          disabled={submitting}
        />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: 10,
    paddingTop: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: theme.colors.text,
  },
  subtitle: {
    color: theme.colors.muted,
    lineHeight: 21,
  },
  formCard: {
    gap: 16,
  },
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#edf1f7",
  },
  chipActive: {
    backgroundColor: theme.colors.primarySoft,
  },
  chipText: {
    color: theme.colors.text,
    fontWeight: "600",
  },
  chipTextActive: {
    color: theme.colors.primary,
  },
  helperText: {
    color: theme.colors.muted,
    lineHeight: 20,
    fontSize: 13,
  },
  previewBlock: {
    gap: 10,
  },
  previewImage: {
    width: "100%",
    height: 200,
    borderRadius: 14,
    backgroundColor: "#eef2f7",
  },
  previewText: {
    color: theme.colors.muted,
  },
  notice: {
    color: theme.colors.warning,
    lineHeight: 20,
  },
});
