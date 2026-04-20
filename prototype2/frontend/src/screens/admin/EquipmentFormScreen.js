import { Alert, Image, StyleSheet, Text, View } from "react-native";
import { useMemo, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import AppButton from "../../components/AppButton";
import AppInput from "../../components/AppInput";
import Card from "../../components/Card";
import Screen from "../../components/Screen";
import StatusBadge from "../../components/StatusBadge";
import { api, buildUploadUrl } from "../../api/client";
import { useAuth } from "../../hooks/useAuth";
import { theme } from "../../styles/theme";
import { getErrorMessage } from "../../utils/helpers";

const STATUS_OPTIONS = [
  "AVAILABLE",
  "RENTAL_PENDING",
  "RENTED",
  "RETURN_PENDING",
  "INSPECTION_REQUIRED",
  "REPAIR",
  "OVERDUE",
];

function toUploadFile(asset) {
  return {
    uri: asset.uri,
    name: asset.fileName || `equipment-${Date.now()}.jpg`,
    type: asset.mimeType || "image/jpeg",
  };
}

export default function EquipmentFormScreen({ navigation, route }) {
  const { token } = useAuth();
  const equipment = route.params?.equipment;
  const [category, setCategory] = useState(equipment?.category || "");
  const [name, setName] = useState(equipment?.name || "");
  const [description, setDescription] = useState(equipment?.description || "");
  const [code, setCode] = useState(equipment?.code || "");
  const [components, setComponents] = useState(Array.isArray(equipment?.components) ? equipment.components.join(", ") : "");
  const [location, setLocation] = useState(equipment?.location || "");
  const [status, setStatus] = useState(equipment?.status || "AVAILABLE");
  const [pickedImage, setPickedImage] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const previewUri = useMemo(() => {
    if (pickedImage?.uri) {
      return pickedImage.uri;
    }
    return buildUploadUrl(equipment?.imagePath);
  }, [pickedImage, equipment?.imagePath]);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("권한 필요", "기자재 사진을 등록하려면 사진 접근 권한이 필요합니다.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.length) {
      setPickedImage(result.assets[0]);
    }
  };

  const handleSubmit = async () => {
    if (!category.trim() || !name.trim() || !code.trim()) {
      Alert.alert("입력 확인", "카테고리, 기자재명, 고유 식별 코드는 필수입니다.");
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append("category", category.trim());
      formData.append("name", name.trim());
      formData.append("description", description.trim());
      formData.append("code", code.trim());
      formData.append("qrValue", code.trim());
      formData.append("components", components.trim());
      formData.append("location", location.trim());
      formData.append("status", status);

      if (!pickedImage && equipment?.imagePath) {
        formData.append("imagePath", equipment.imagePath);
      }

      if (pickedImage) {
        formData.append("equipmentImage", toUploadFile(pickedImage));
      }

      if (equipment?.id) {
        await api.putForm(`/equipments/${equipment.id}`, formData, token);
      } else {
        await api.postForm("/equipments", formData, token);
      }

      Alert.alert("저장 완료", equipment?.id ? "기자재가 수정되었습니다." : "기자재가 등록되었습니다.", [
        { text: "확인", onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert("저장 실패", getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen>
      <Card>
        <Text style={styles.title}>{equipment?.id ? "기자재 수정" : "기자재 등록"}</Text>
        <Text style={styles.subtitle}>사진 업로드와 QR 기준 코드 등록을 함께 진행합니다.</Text>
      </Card>

      <Card>
        <AppInput label="카테고리" value={category} onChangeText={setCategory} placeholder="예: 카메라, 노트북" autoCapitalize="words" />
        <AppInput label="기자재명" value={name} onChangeText={setName} placeholder="예: 실습용 카메라 01" autoCapitalize="words" />
        <AppInput label="기자재 설명" value={description} onChangeText={setDescription} placeholder="발표용, 촬영용 등" multiline />
        <AppInput label="고유 식별 코드" value={code} onChangeText={setCode} placeholder="예: EQ-CAM-001" autoCapitalize="characters" />
        <AppInput label="구성품 정보" value={components} onChangeText={setComponents} placeholder="쉼표로 구분해서 입력" />
        <AppInput label="보관 위치" value={location} onChangeText={setLocation} placeholder="예: 학과 사무실 캐비닛 A" autoCapitalize="words" />
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>기자재 상태</Text>
        <View style={styles.statusWrap}>
          {STATUS_OPTIONS.map((item) => (
            <Text
              key={item}
              style={[styles.statusChip, status === item && styles.statusChipActive]}
              onPress={() => setStatus(item)}
            >
              {item}
            </Text>
          ))}
        </View>
        <StatusBadge status={status} />
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>기자재 사진</Text>
        <AppButton title="사진 선택" variant="secondary" onPress={pickImage} />
        {previewUri ? <Image source={{ uri: previewUri }} style={styles.preview} /> : <Text style={styles.empty}>등록된 사진이 없습니다.</Text>}
      </Card>

      <AppButton title={submitting ? "저장 중..." : "저장"} onPress={handleSubmit} disabled={submitting} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: theme.colors.text,
  },
  subtitle: {
    color: theme.colors.muted,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.text,
  },
  statusWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#eef2f7",
    color: theme.colors.text,
    fontWeight: "600",
  },
  statusChipActive: {
    backgroundColor: "#d9e5ff",
    color: theme.colors.primary,
  },
  preview: {
    width: "100%",
    height: 220,
    borderRadius: 16,
    backgroundColor: "#eef2f7",
  },
  empty: {
    color: theme.colors.muted,
  },
});
