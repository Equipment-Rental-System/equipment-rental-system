import { StyleSheet, Text, TextInput, View } from "react-native";
import { theme } from "../styles/theme";

export default function AppInput({ label, value, onChangeText, secureTextEntry, placeholder, multiline }) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        placeholder={placeholder}
        style={[styles.input, multiline && styles.multiline]}
        multiline={multiline}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "#fff",
  },
  multiline: {
    minHeight: 96,
    textAlignVertical: "top",
  },
});

