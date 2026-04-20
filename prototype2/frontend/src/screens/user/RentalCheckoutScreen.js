import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { useMemo, useState } from "react";
import AppButton from "../../components/AppButton";
import AppInput from "../../components/AppInput";
import Card from "../../components/Card";
import Screen from "../../components/Screen";
import StatusBadge from "../../components/StatusBadge";
import { api } from "../../api/client";
import { useAuth } from "../../hooks/useAuth";
import { theme } from "../../styles/theme";
import { formatDate, getDefaultDueDate, getErrorMessage, joinComponents } from "../../utils/helpers";

const RENT_NOTE_OPTIONS = ["수업 실습용", "졸업 프로젝트용", "발표 준비용", "단기 대여 예정"];
const EXTEND_NOTE_OPTIONS = ["추가 실습 필요", "발표 일정 연기", "프로젝트 마감 연장", "반납 준비 중"];

export default function RentalCheckoutScreen({ navigation, route }) {
  const { token } = useAuth();
  const { equipment, mode = "rent", rentalId } = route.params || {};
  const [dueDate, setDueDate] = useState(getDefaultDueDate(7));
  const [requestedDueDate, setRequestedDueDate] = useState(getDefaultDueDate(10));
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const title = useMemo(() => {
    if (mode === "extend") {
      return "연장 요청";
    }
    if (mode === "return") {
      return "반납 요청";
    }
    return "대여 요청";
  }, [mode]);

  const noteOptions = useMemo(() => {
    if (mode === "extend") {
      return EXTEND_NOTE_OPTIONS;
    }
    if (mode === "rent") {
      return RENT_NOTE_OPTIONS;
    }
    return [];
  }, [mode]);

  const moveToRentals = () => navigation.navigate("MyRentals");

  const handleSubmit = async () => {
    try {
      setSubmitting(true);

      if (mode === "rent") {
        const response = await api.post(
          "/rentals/request",
          {
            equipmentId: equipment.id,
            dueDate,
            note,
          },
          token
        );
        Alert.alert("대여 요청 완료", response.message || "관리자 승인 대기 상태로 등록되었습니다.", [
          { text: "확인", onPress: moveToRentals },
        ]);
        return;
      }

      if (mode === "extend") {
        const response = await api.post(
          `/rentals/${rentalId}/extend-request`,
          {
            requestedDueDate,
            note,
          },
          token
        );
        Alert.alert("연장 요청 완료", response.message || "연장 요청이 접수되었습니다.", [
          { text: "확인", onPress: moveToRentals },
        ]);
        return;
      }

      const response = await api.post(`/rentals/${rentalId}/return-request`, {}, token);
      Alert.alert("반납 요청 완료", response.message || "관리자가 실물 확인 후 최종 처리합니다.", [
        { text: "확인", onPress: moveToRentals },
      ]);
    } catch (error) {
      Alert.alert(`${title} 실패`, getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen>
      <Card>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>
          {mode === "rent" && "QR 인증이 완료되었습니다. 반납 예정일을 입력한 뒤 대여 요청을 진행해주세요."}
          {mode === "extend" && "새로운 희망 반납일을 입력하면 관리자 승인 대기로 등록됩니다."}
          {mode === "return" && "반납 요청은 즉시 완료되지 않으며, 관리자가 실물 확인 후 상태를 최종 처리합니다."}
        </Text>
      </Card>

      <Card>
        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            <Text style={styles.name}>{equipment?.name}</Text>
            <Text style={styles.code}>{equipment?.code}</Text>
          </View>
          <StatusBadge status={equipment?.status} />
        </View>
        <Text style={styles.meta}>카테고리: {equipment?.category}</Text>
        <Text style={styles.meta}>구성품: {joinComponents(equipment?.components)}</Text>
        <Text style={styles.meta}>설명: {equipment?.description || "-"}</Text>
      </Card>

      <Card>
        {mode === "rent" ? (
          <AppInput label="반납 예정일" value={dueDate} onChangeText={setDueDate} placeholder="YYYY-MM-DD" />
        ) : null}

        {mode === "extend" ? (
          <>
            <Text style={styles.meta}>현재 반납 예정일: {formatDate(route.params?.currentDueDate)}</Text>
            <AppInput
              label="새로운 반납 예정일"
              value={requestedDueDate}
              onChangeText={setRequestedDueDate}
              placeholder="YYYY-MM-DD"
            />
          </>
        ) : null}

        {mode !== "return" ? (
          <>
            <AppInput
              label="요청 메모"
              value={note}
              onChangeText={setNote}
              placeholder="관리자에게 전달할 메모가 있으면 입력해주세요"
              multiline
            />
            <View style={styles.chipWrap}>
              {noteOptions.map((option) => {
                const active = note === option;
                return (
                  <Pressable
                    key={option}
                    onPress={() => setNote(option)}
                    style={[styles.chip, active && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{option}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={styles.helperText}>
              메모는 빠른 선택으로 넣을 수 있고, 한글 직접 입력이 필요하면 PC 키보드의 `한/영` 전환으로 입력하면 됩니다.
            </Text>
          </>
        ) : (
          <Text style={styles.returnNotice}>
            반납 요청 이후 기자재 상태는 `RETURN_PENDING`으로 변경되며, 관리자 확인 전까지는 반납 완료가 아닙니다.
          </Text>
        )}

        <AppButton title={submitting ? "처리 중..." : `${title} 실행`} onPress={handleSubmit} disabled={submitting} />
      </Card>
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
    lineHeight: 21,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  headerText: {
    flex: 1,
    gap: 6,
  },
  name: {
    fontSize: 20,
    fontWeight: "800",
    color: theme.colors.text,
  },
  code: {
    color: theme.colors.primary,
    fontWeight: "700",
  },
  meta: {
    color: theme.colors.muted,
    lineHeight: 20,
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
  returnNotice: {
    color: theme.colors.warning,
    lineHeight: 21,
  },
});
