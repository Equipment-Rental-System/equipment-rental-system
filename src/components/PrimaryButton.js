import { Text, TouchableOpacity } from "react-native";
import { styles } from "../styles/appStyles";

export default function PrimaryButton({ label, onPress, disabled = false, compact = false }) {
  return (
    <TouchableOpacity
      style={[
        styles.primaryButton,
        compact && styles.primaryButtonCompact,
        disabled && styles.primaryButtonDisabled,
      ]}
      disabled={disabled}
      onPressIn={disabled ? undefined : onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      delayPressIn={0}
    >
      <Text style={[styles.primaryButtonText, compact && styles.primaryButtonTextCompact]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}
