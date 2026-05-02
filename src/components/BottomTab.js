import { Pressable, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { styles } from "../styles/appStyles";

const tabs = [
  { key: "home", icon: "home-variant", label: "홈" },
  { key: "rent", icon: "qrcode-scan", label: "기자재 대여" },
  { key: "mypage", icon: "account-outline", label: "마이페이지" },
];

export default function BottomTab({ current, onChange }) {
  return (
    <View style={styles.bottomTab}>
      {tabs.map((tab) => {
        const active = current === tab.key;
        return (
          <Pressable key={tab.key} style={styles.tabItem} onPress={() => onChange(tab.key)}>
            <MaterialCommunityIcons
              name={tab.icon}
              size={22}
              color={active ? "#2f89ef" : "#9aa4b2"}
            />
            <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
