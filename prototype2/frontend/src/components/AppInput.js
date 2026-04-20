import { Platform, StyleSheet, Text, TextInput, View } from "react-native";
import { theme } from "../styles/theme";

export default function AppInput({
  label,
  value,
  onChangeText,
  secureTextEntry,
  placeholder,
  multiline,
  keyboardType,
  editable = true,
  autoCapitalize = "none",
  inputMode,
  autoComplete,
  textContentType,
  importantForAutofill,
  returnKeyType,
  spellCheck = false,
}) {
  const androidInputProps =
    Platform.OS === "android"
      ? {
          autoComplete,
          importantForAutofill,
        }
      : {
          autoComplete,
          textContentType,
          importantForAutofill,
        };

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.muted}
        style={[styles.input, multiline && styles.multiline, !editable && styles.disabled]}
        multiline={multiline}
        keyboardType={keyboardType || "default"}
        inputMode={inputMode}
        editable={editable}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        spellCheck={spellCheck}
        returnKeyType={returnKeyType}
        showSoftInputOnFocus
        {...androidInputProps}
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
    color: theme.colors.text,
  },
  multiline: {
    minHeight: 96,
    textAlignVertical: "top",
  },
  disabled: {
    backgroundColor: "#eef2f7",
    color: theme.colors.muted,
  },
});
