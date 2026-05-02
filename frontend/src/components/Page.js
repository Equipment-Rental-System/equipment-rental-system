import { SafeAreaView } from "react-native";
import { StatusBar } from "expo-status-bar";
import { styles } from "../styles/appStyles";

export default function Page({ children, dark = false }) {
  return (
    <SafeAreaView style={[styles.safeArea, dark && styles.safeAreaDark]}>
      <StatusBar style={dark ? "light" : "dark"} />
      {children}
    </SafeAreaView>
  );
}
