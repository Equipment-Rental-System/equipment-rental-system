import "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { AuthProvider } from "./src/context/AuthContext";
import { NotificationProvider } from "./src/context/NotificationContext";
import LoadingView from "./src/components/LoadingView";
import AppNavigator from "./src/navigation/AppNavigator";

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    ...MaterialCommunityIcons.font,
  });

  if (!fontsLoaded && !fontError) {
    return <LoadingView text="앱 리소스를 준비하는 중입니다." />;
  }

  return (
    <AuthProvider>
      <NotificationProvider>
        <StatusBar style="dark" />
        <AppNavigator />
      </NotificationProvider>
    </AuthProvider>
  );
}
