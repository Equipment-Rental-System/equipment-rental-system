import { Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { styles } from "../styles/appStyles";

export default function InfoBanner({ text }) {
  return (
    <View style={styles.banner}>
      <MaterialCommunityIcons name="information-outline" size={16} color="#2563eb" />
      <Text style={styles.bannerText}>{text}</Text>
    </View>
  );
}
