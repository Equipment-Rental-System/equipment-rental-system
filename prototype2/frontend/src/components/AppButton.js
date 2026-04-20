import { Pressable, StyleSheet, Text } from "react-native";
import { theme } from "../styles/theme";

function getTextStyle(variant) {
  if (variant === "primary") {
    return styles.primaryText;
  }
  if (variant === "danger") {
    return styles.dangerText;
  }
  return styles.altText;
}

export default function AppButton({ title, onPress, variant = "primary", disabled = false }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Text style={[styles.text, getTextStyle(variant)]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 50,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  primary: {
    backgroundColor: theme.colors.primary,
    ...theme.shadow.card,
  },
  secondary: {
    backgroundColor: theme.colors.primarySoft,
  },
  danger: {
    backgroundColor: "#fdecee",
  },
  ghost: {
    backgroundColor: "rgba(255,255,255,0.88)",
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  text: {
    fontWeight: "700",
    fontSize: 15,
  },
  primaryText: {
    color: "#ffffff",
  },
  altText: {
    color: theme.colors.text,
  },
  dangerText: {
    color: theme.colors.danger,
  },
  disabled: {
    opacity: 0.6,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
});
