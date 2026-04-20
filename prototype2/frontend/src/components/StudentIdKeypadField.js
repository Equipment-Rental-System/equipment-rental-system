import { useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { theme } from "../styles/theme";

const KEY_ROWS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["clear", "0", "backspace"],
];

export default function StudentIdKeypadField({
  label = "학번",
  value,
  onChangeText,
  placeholder = "예: 20240001",
  maxLength = 10,
}) {
  const [visible, setVisible] = useState(false);

  const displayValue = useMemo(() => {
    if (value) {
      return value;
    }

    return placeholder;
  }, [placeholder, value]);

  const appendDigit = (digit) => {
    if ((value || "").length >= maxLength) {
      return;
    }

    onChangeText(`${value || ""}${digit}`);
  };

  const handleKeyPress = (key) => {
    if (key === "clear") {
      onChangeText("");
      return;
    }

    if (key === "backspace") {
      onChangeText((value || "").slice(0, -1));
      return;
    }

    appendDigit(key);
  };

  return (
    <>
      <View style={styles.wrapper}>
        <View style={styles.labelRow}>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.hint}>숫자 패드로 입력</Text>
        </View>
        <Pressable style={styles.input} onPress={() => setVisible(true)} accessibilityLabel="학번 숫자 패드 열기">
          <Text style={[styles.inputText, !value && styles.placeholder]}>{displayValue}</Text>
        </Pressable>
      </View>

      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <View style={styles.overlay}>
          <Pressable style={styles.backdrop} onPress={() => setVisible(false)} />
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>학번 입력</Text>
            <Text style={styles.sheetValue}>{value || "숫자를 입력해주세요"}</Text>
            <Text style={styles.sheetHint}>숫자만 입력되며 최대 {maxLength}자리까지 입력할 수 있습니다.</Text>

            <View style={styles.pad}>
              {KEY_ROWS.map((row) => (
                <View key={row.join("-")} style={styles.row}>
                  {row.map((key) => (
                    <Pressable key={key} style={[styles.key, key !== "0" && styles.squareKey]} onPress={() => handleKeyPress(key)}>
                      <Text style={[styles.keyText, (key === "clear" || key === "backspace") && styles.actionKeyText]}>
                        {key === "clear" ? "초기화" : key === "backspace" ? "지우기" : key}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              ))}
            </View>

            <Pressable style={styles.doneButton} onPress={() => setVisible(false)}>
              <Text style={styles.doneButtonText}>입력 완료</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 8,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: "600",
  },
  hint: {
    fontSize: 12,
    color: theme.colors.muted,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 16,
    backgroundColor: "#fff",
  },
  inputText: {
    color: theme.colors.text,
    fontSize: 16,
  },
  placeholder: {
    color: theme.colors.muted,
  },
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(10, 18, 36, 0.18)",
  },
  backdrop: {
    flex: 1,
  },
  sheet: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    gap: 14,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: theme.colors.text,
    textAlign: "center",
  },
  sheetValue: {
    minHeight: 40,
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceMuted,
    textAlign: "center",
    textAlignVertical: "center",
    fontSize: 24,
    fontWeight: "800",
    color: theme.colors.text,
    paddingVertical: 10,
  },
  sheetHint: {
    textAlign: "center",
    color: theme.colors.muted,
    lineHeight: 20,
  },
  pad: {
    gap: 10,
    marginTop: 6,
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  key: {
    flex: 1,
    minHeight: 62,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.primarySoft,
  },
  squareKey: {
    aspectRatio: 1.1,
  },
  keyText: {
    fontSize: 22,
    fontWeight: "800",
    color: theme.colors.text,
  },
  actionKeyText: {
    fontSize: 15,
  },
  doneButton: {
    minHeight: 54,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.primary,
    marginTop: 6,
  },
  doneButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
  },
});
