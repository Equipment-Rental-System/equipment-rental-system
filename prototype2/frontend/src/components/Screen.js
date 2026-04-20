import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { theme } from "../styles/theme";
import WatermarkBackground from "./WatermarkBackground";

export default function Screen({
  children,
  scroll = true,
  style,
  refreshControl,
  showWatermark = true,
  backgroundColor,
}) {
  const insets = useSafeAreaInsets();

  const content = scroll ? (
    <ScrollView
      contentContainerStyle={[styles.content, { paddingBottom: theme.spacing.lg + insets.bottom }, style]}
      keyboardShouldPersistTaps="handled"
      refreshControl={refreshControl}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.content, { paddingBottom: theme.spacing.lg + insets.bottom }, style]}>{children}</View>
  );

  return (
    <SafeAreaView style={[styles.safe, backgroundColor ? { backgroundColor } : null]}>
      {showWatermark ? <WatermarkBackground /> : null}
      {content}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flexGrow: 1,
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
});
