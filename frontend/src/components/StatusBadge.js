import { Text, View } from "react-native";
import { styles } from "../styles/appStyles";
import { getStatusColors, getStatusLabel } from "../utils/normalizers";

export default function StatusBadge({ status }) {
  const colors = getStatusColors(status);

  return (
    <View style={[styles.statusBadge, { backgroundColor: colors.bg }]}>
      <Text style={[styles.statusBadgeText, { color: colors.text }]}>{getStatusLabel(status)}</Text>
    </View>
  );
}
