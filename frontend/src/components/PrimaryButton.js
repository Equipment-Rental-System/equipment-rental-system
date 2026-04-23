import { Pressable, Text } from "react-native";
import { styles } from "../styles/appStyles";

export default function PrimaryButton({ label, onPress, disabled = false, compact = false }) {
  return (
    <Pressable
      style={[
        styles.primaryButton,
        compact && styles.primaryButtonCompact,
        disabled && styles.primaryButtonDisabled,
      ]}
      disabled={disabled}
      onPress={onPress}
    >
      <Text style={[styles.primaryButtonText, compact && styles.primaryButtonTextCompact]}>
        {label}
      </Text>
    </Pressable>
  );
}
