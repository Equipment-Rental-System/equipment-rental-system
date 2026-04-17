import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { theme } from "../styles/theme";

export default function LoadingView({ text = "불러오는 중입니다." }) {
  return (
    <View style={styles.wrapper}>
      <ActivityIndicator color={theme.colors.primary} />
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 10,
  },
  text: {
    color: theme.colors.muted,
  },
});

