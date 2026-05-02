import { Pressable, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { styles } from "../styles/appStyles";

export default function Header({ title, onBack, rightText, onRightPress, dark = false }) {
  const tint = dark ? "#ffffff" : "#0f172a";

  return (
    <View style={styles.header}>
      <View style={styles.headerSide}>
        {onBack ? (
          <Pressable style={styles.iconButton} onPress={onBack}>
            <MaterialCommunityIcons name="chevron-left" size={24} color={tint} />
          </Pressable>
        ) : null}
      </View>
      <Text style={[styles.headerTitle, dark && styles.headerTitleDark]}>{title}</Text>
      <View style={[styles.headerSide, styles.headerSideRight]}>
        {rightText ? (
          <Pressable style={styles.headerChip} onPress={onRightPress}>
            <Text style={styles.headerChipText}>{rightText}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
