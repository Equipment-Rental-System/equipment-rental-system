import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import Header from "../components/Header";
import InputField from "../components/InputField";
import Page from "../components/Page";
import PrimaryButton from "../components/PrimaryButton";
import { styles } from "../styles/appStyles";

export default function SignupScreen({
  form,
  onChange,
  onBack,
  onSubmit,
  onPickImage,
  loading,
}) {
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
            autoCapitalize="words"
          />
          <InputField
            label="이메일"
            value={form.email}
            onChangeText={(value) => onChange("email", value)}
            placeholder="이메일을 입력해주세요"
            keyboardType="email-address"
          />
          <InputField
            label="비밀번호"
            value={form.password}
            onChangeText={(value) => onChange("password", value)}
            placeholder="비밀번호를 입력해주세요"
            secureTextEntry
          />

          <Pressable style={styles.uploadPlaceholder} onPress={onPickImage}>
            {form.image?.uri ? (
              <>
                <Image source={{ uri: form.image.uri }} style={styles.uploadPreview} resizeMode="cover" />
                <Text style={styles.uploadPlaceholderText}>
                  {form.image.fileName || "학생증 이미지 선택 완료"}
                </Text>
                <Text style={styles.uploadPlaceholderSubText}>다시 누르면 이미지를 바꿀 수 있습니다.</Text>
              </>
            ) : (
              <>
                <MaterialCommunityIcons name="image-outline" size={28} color="#64748b" />
                <Text style={styles.uploadPlaceholderText}>학생증 이미지 업로드</Text>
                <Text style={styles.uploadPlaceholderSubText}>헤이영캠퍼스 학생증 캡처 이미지를 선택해주세요.</Text>
              </>
            )}
          </Pressable>

          <PrimaryButton
            label={loading ? "가입 처리 중..." : "회원가입 완료"}
            onPress={onSubmit}
            disabled={loading}
          />
        </View>
      </ScrollView>
    </Page>
  );
}
