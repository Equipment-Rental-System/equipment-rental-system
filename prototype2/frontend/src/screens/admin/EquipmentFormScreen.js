import { useState } from "react";
import { Alert, Image, StyleSheet, Text } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { api, buildUploadUrl } from "../../api/client";
import AppButton from "../../components/AppButton";
import AppInput from "../../components/AppInput";
import Card from "../../components/Card";
import Screen from "../../components/Screen";
import { useAuth } from "../../hooks/useAuth";
import { theme } from "../../styles/theme";

export default function EquipmentFormScreen({ route, navigation }) {
  const { token } = useAuth();
  const equipment = route.params?.equipment;
  const [form, setForm] = useState({
    category: equipment?.category || "노트북",
    name: equipment?.name || "",
    description: equipment?.description || "",
    code: equipment?.code || "",
    components: equipment?.components?.join(", ") || "",
    location: equipment?.location || "",
    status: equipment?.status || "AVAILABLE",
    image: null,
    existingImagePath: equipment?.imagePath || null,
  });
  const [submitting, setSubmitting] = useState(false);

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("권한 필요", "기자재 사진을 선택하려면 사진 접근 권한이 필요합니다.");
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
        image: {
          uri: asset.uri,
          name: asset.fileName || `${prev.code || "equipment"}.jpg`,
          type: asset.mimeType || "image/jpeg",
        },
      }));
    }
  };

  const submit = async () => {
    if (!form.category || !form.name || !form.code || !form.status) {
      Alert.alert("입력 확인", "카테고리, 기자재명, 고유 식별 코드, 상태는 필수입니다.");
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("category", form.category);
      formData.append("name", form.name);
      formData.append("description", form.description);
      formData.append("code", form.code);
      formData.append("qrValue", form.code);
      formData.append("components", form.components);
      formData.append("location", form.location);
      formData.append("status", form.status);

      if (form.image) {
        formData.append("equipmentImage", form.image);
      }

      if (equipment) {
        await api.putForm(`/equipments/${equipment.id}`, formData, token);
      } else {
        await api.postForm("/equipments", formData, token);
      }

      Alert.alert("저장 완료", equipment ? "기자재 정보가 수정되었습니다." : "기자재가 등록되었습니다.", [
        { text: "확인", onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert("저장 실패", error.data?.message || error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const imageUri = form.image?.uri || buildUploadUrl(form.existingImagePath);

  return (
    <Screen>
      <Card>
        <Text style={styles.title}>{equipment ? "기자재 수정" : "기자재 등록"}</Text>
        <AppInput label="카테고리" value={form.category} onChangeText={(value) => setField("category", value)} />
        <AppInput label="기자재명" value={form.name} onChangeText={(value) => setField("name", value)} />
        <AppInput
          label="기자재 설명"
          value={form.description}
          onChangeText={(value) => setField("description", value)}
          multiline
        />
        <AppInput
          label="기자재 고유 식별 코드"
          value={form.code}
          onChangeText={(value) => setField("code", value)}
          placeholder="예: EQ-CAM-001"
        />
        <AppInput
          label="구성품 정보"
          value={form.components}
          onChangeText={(value) => setField("components", value)}
          placeholder="쉼표로 구분"
        />
        <AppInput label="보관 위치" value={form.location} onChangeText={(value) => setField("location", value)} />
        <AppInput
          label="기자재 상태"
          value={form.status}
          onChangeText={(value) => setField("status", value)}
          placeholder="AVAILABLE"
        />

        <Text style={styles.photoLabel}>기자재 사진 업로드</Text>
        <AppButton title="사진 선택" variant="secondary" onPress={pickImage} />
        {imageUri ? <Image source={{ uri: imageUri }} style={styles.preview} /> : <Text style={styles.hint}>등록된 사진이 없습니다.</Text>}
        <Text style={styles.hint}>QR 값은 입력한 기자재 고유 식별 코드와 동일하게 저장됩니다.</Text>

        <AppButton title={submitting ? "저장 중..." : "저장"} onPress={submit} disabled={submitting} />
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
  photoLabel: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: "600",
  },
  preview: {
    width: "100%",
    height: 220,
    borderRadius: 16,
  },
  hint: {
    color: theme.colors.muted,
    lineHeight: 20,
  },
});
