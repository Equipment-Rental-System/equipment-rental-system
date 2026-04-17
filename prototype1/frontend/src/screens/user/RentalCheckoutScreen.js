import { useState } from "react";
import { Alert, StyleSheet, Text } from "react-native";
import { api } from "../../api/client";
import AppButton from "../../components/AppButton";
import AppInput from "../../components/AppInput";
import Card from "../../components/Card";
import Screen from "../../components/Screen";
import StatusBadge from "../../components/StatusBadge";
import { useAuth } from "../../hooks/useAuth";
import { getDefaultDueDate } from "../../utils/helpers";
import { theme } from "../../styles/theme";

export default function RentalCheckoutScreen({ route, navigation }) {
  const { token } = useAuth();
  const { mode, equipment, rental } = route.params || {};
  const [dueDate, setDueDate] = useState(
    mode === "extend" ? rental?.requestedDueDate || rental?.dueDate || getDefaultDueDate(7) : getDefaultDueDate(7)
  );
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const moveToMyRentals = () => {
    navigation.navigate("UserTabs", { screen: "내대여" });
  };

  const handleSubmit = async () => {
    if (!equipment?.id) {
      Alert.alert("진입 오류", "기자재 정보가 누락되었습니다. 다시 QR 인증을 진행해주세요.");
      return;
    }

    setSubmitting(true);
    try {
      if (mode === "rent") {
        await api.post(
          "/rentals/request",
          {
            equipmentId: equipment.id,
            dueDate,
            note,
          },
          token
        );
        Alert.alert("대여 요청 완료", "관리자 승인 후 대여가 시작됩니다.", [
          { text: "확인", onPress: moveToMyRentals },
        ]);
      } else {
        await api.post(
          `/rentals/${rental.id}/extend-request`,
          {
            requestedDueDate: dueDate,
            note,
          },
          token
        );
        Alert.alert("연장 요청 완료", "관리자 승인 후 반납 예정일이 변경됩니다.", [
          { text: "확인", onPress: moveToMyRentals },
        ]);
      }
    } catch (error) {
      Alert.alert("처리 오류", error.data?.message || error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen>
      {!equipment ? (
        <Card>
          <Text style={styles.errorTitle}>대여 정보를 불러오지 못했습니다.</Text>
          <Text style={styles.meta}>QR 스캔 화면으로 돌아가 다시 인증을 진행해주세요.</Text>
          <AppButton title="QR 스캔으로 돌아가기" onPress={() => navigation.navigate("QRScanner")} />
        </Card>
      ) : null}
      {equipment ? (
        <>
      <Card>
        <StatusBadge status={equipment.status} />
        <Text style={styles.title}>{equipment.name}</Text>
        <Text style={styles.meta}>{equipment.code}</Text>
        <Text style={styles.meta}>
          구성품: {equipment.components?.length ? equipment.components.join(", ") : "구성품 정보 없음"}
        </Text>
        <Text style={styles.description}>{equipment.description || "설명 없음"}</Text>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>{mode === "rent" ? "대여 상세" : "연장 요청 상세"}</Text>
        <AppInput
          label={mode === "rent" ? "반납 예정일" : "희망 반납일"}
          value={dueDate}
          onChangeText={setDueDate}
          placeholder="YYYY-MM-DD"
        />
        <AppInput label="비고" value={note} onChangeText={setNote} multiline placeholder="요청 사유 입력" />
        <AppButton
          title={submitting ? "처리 중..." : mode === "rent" ? "대여 실행" : "연장 요청 전송"}
          onPress={handleSubmit}
          disabled={submitting}
        />
      </Card>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: theme.colors.text,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: theme.colors.text,
  },
  meta: {
    color: theme.colors.muted,
  },
  description: {
    color: theme.colors.text,
  },
  sectionTitle: {
    fontWeight: "700",
    color: theme.colors.text,
  },
});
