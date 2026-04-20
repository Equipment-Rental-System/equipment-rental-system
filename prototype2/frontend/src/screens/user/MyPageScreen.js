import { Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AppButton from "../../components/AppButton";
import Card from "../../components/Card";
import Screen from "../../components/Screen";
import { useAuth } from "../../hooks/useAuth";
import { useNotifications } from "../../hooks/useNotifications";
import { theme } from "../../styles/theme";

function LinkRow({ icon, title, caption, onPress }) {
  return (
    <Pressable style={styles.linkRow} onPress={onPress}>
      <View style={styles.linkIconWrap}>
        <MaterialCommunityIcons name={icon} size={20} color={theme.colors.primary} />
      </View>
      <View style={styles.linkText}>
        <Text style={styles.linkTitle}>{title}</Text>
        <Text style={styles.linkCaption}>{caption}</Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={22} color={theme.colors.muted} />
    </Pressable>
  );
}

export default function MyPageScreen({ navigation }) {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();

  return (
    <Screen>
      <Card>
        <Text style={styles.title}>마이페이지</Text>
        <View style={styles.profileBlock}>
          <View style={styles.avatar}>
            <MaterialCommunityIcons name="account" size={34} color={theme.colors.primary} />
          </View>
          <View style={styles.profileText}>
            <Text style={styles.userName}>{user?.name || "사용자"}</Text>
            <Text style={styles.userMeta}>학번 {user?.studentId || "-"}</Text>
            <Text style={styles.userMeta}>{user?.department || "컴퓨터공학과"}</Text>
          </View>
        </View>
      </Card>

      <Card>
        <LinkRow
          icon="clipboard-list-outline"
          title="내 대여 현황"
          caption="현재 대여 중인 기자재와 연장/반납 요청 확인"
          onPress={() => navigation.navigate("MyRentals")}
        />
        <LinkRow
          icon="bell-outline"
          title="알림"
          caption={`읽지 않은 알림 ${unreadCount}건`}
          onPress={() => navigation.navigate("Notifications")}
        />
        <LinkRow
          icon="format-list-bulleted"
          title="기자재 목록"
          caption="전체 기자재 상태와 상세 정보 보기"
          onPress={() => navigation.navigate("EquipmentList")}
        />
      </Card>

      <Card>
        <Text style={styles.noticeTitle}>안내</Text>
        <Text style={styles.noticeText}>대여는 기자재 QR 스캔 후 진행되며, 반납은 관리자 확인 후 완료됩니다.</Text>
        <AppButton title="로그아웃" variant="danger" onPress={logout} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: theme.colors.text,
  },
  profileBlock: {
    flexDirection: "row",
    gap: 14,
    alignItems: "center",
  },
  avatar: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: theme.colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  profileText: {
    flex: 1,
    gap: 5,
  },
  userName: {
    fontSize: 20,
    fontWeight: "800",
    color: theme.colors.text,
  },
  userMeta: {
    color: theme.colors.muted,
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },
  linkIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: theme.colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  linkText: {
    flex: 1,
    gap: 3,
  },
  linkTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.text,
  },
  linkCaption: {
    color: theme.colors.muted,
    lineHeight: 19,
  },
  noticeTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.text,
  },
  noticeText: {
    color: theme.colors.muted,
    lineHeight: 20,
  },
});
