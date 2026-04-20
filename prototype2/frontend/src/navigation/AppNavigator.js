import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import LoadingView from "../components/LoadingView";
import { useAuth } from "../hooks/useAuth";
import AdminDashboardScreen from "../screens/admin/AdminDashboardScreen";
import EquipmentFormScreen from "../screens/admin/EquipmentFormScreen";
import EquipmentManagementScreen from "../screens/admin/EquipmentManagementScreen";
import ExtensionApprovalsScreen from "../screens/admin/ExtensionApprovalsScreen";
import PendingUsersScreen from "../screens/admin/PendingUsersScreen";
import RentalApprovalsScreen from "../screens/admin/RentalApprovalsScreen";
import ReturnApprovalsScreen from "../screens/admin/ReturnApprovalsScreen";
import StatusManagementScreen from "../screens/admin/StatusManagementScreen";
import LoginScreen from "../screens/auth/LoginScreen";
import SignupScreen from "../screens/auth/SignupScreen";
import NotificationsScreen from "../screens/shared/NotificationsScreen";
import EquipmentDetailScreen from "../screens/user/EquipmentDetailScreen";
import EquipmentListScreen from "../screens/user/EquipmentListScreen";
import MyPageScreen from "../screens/user/MyPageScreen";
import MyRentalsScreen from "../screens/user/MyRentalsScreen";
import QRScannerScreen from "../screens/user/QRScannerScreen";
import RentalCheckoutScreen from "../screens/user/RentalCheckoutScreen";
import UserHomeScreen from "../screens/user/UserHomeScreen";
import { theme } from "../styles/theme";

const AuthStack = createNativeStackNavigator();
const RootStack = createNativeStackNavigator();
const AdminStack = createNativeStackNavigator();
const UserTabs = createBottomTabNavigator();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Signup" component={SignupScreen} />
    </AuthStack.Navigator>
  );
}

function getTabMeta(routeName, focused) {
  if (routeName === "HomeTab") {
    return { icon: focused ? "home" : "home-outline", label: "홈" };
  }
  if (routeName === "RentTab") {
    return { icon: "qrcode-scan", label: "기자재 대여" };
  }
  return { icon: focused ? "account-circle" : "account-circle-outline", label: "마이페이지" };
}

function UserTabButton({ routeName, accessibilityState, onPress, onLongPress }) {
  const focused = accessibilityState?.selected;
  const tab = getTabMeta(routeName, focused);
  const isPrimary = routeName === "RentTab";
  const iconColor = isPrimary ? "#ffffff" : focused ? theme.colors.primary : theme.colors.muted;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={[styles.tabButton, isPrimary && styles.primaryTabButton]}
    >
      <View style={[styles.tabIconWrap, isPrimary && styles.primaryTabIconWrap]}>
        <MaterialCommunityIcons name={tab.icon} size={isPrimary ? 24 : 22} color={iconColor} />
      </View>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive, isPrimary && styles.primaryTabLabel]}>
        {tab.label}
      </Text>
    </Pressable>
  );
}

function UserTabNavigator() {
  return (
    <UserTabs.Navigator
      screenOptions={({ route }) => {
        return {
          headerShown: false,
          tabBarShowLabel: false,
          tabBarStyle: {
            height: 84,
            paddingTop: 10,
            paddingBottom: 12,
            paddingHorizontal: 12,
            backgroundColor: "rgba(255,255,255,0.96)",
            borderTopColor: theme.colors.border,
          },
          tabBarButton: (props) => <UserTabButton routeName={route.name} {...props} />,
        };
      }}
    >
      <UserTabs.Screen name="HomeTab" component={UserHomeScreen} />
      <UserTabs.Screen
        name="RentTab"
        component={QRScannerScreen}
        initialParams={{ mode: "rent", allowMockScan: true }}
      />
      <UserTabs.Screen name="MyPageTab" component={MyPageScreen} />
    </UserTabs.Navigator>
  );
}

function UserNavigator() {
  return (
    <RootStack.Navigator
      screenOptions={{
        headerShadowVisible: false,
        headerStyle: { backgroundColor: "#ffffff" },
        headerTitleStyle: { color: theme.colors.text, fontWeight: "700" },
      }}
    >
      <RootStack.Screen name="UserTabs" component={UserTabNavigator} options={{ headerShown: false }} />
      <RootStack.Screen name="EquipmentList" component={EquipmentListScreen} options={{ title: "기자재 목록" }} />
      <RootStack.Screen name="EquipmentDetail" component={EquipmentDetailScreen} options={{ title: "기자재 상세" }} />
      <RootStack.Screen name="QRScanner" component={QRScannerScreen} options={{ title: "QR 스캔" }} />
      <RootStack.Screen name="RentalCheckout" component={RentalCheckoutScreen} options={{ title: "대여 진행" }} />
      <RootStack.Screen name="MyRentals" component={MyRentalsScreen} options={{ title: "내 대여 현황" }} />
      <RootStack.Screen name="Notifications" component={NotificationsScreen} options={{ title: "알림" }} />
    </RootStack.Navigator>
  );
}

function AdminNavigator() {
  return (
    <AdminStack.Navigator
      screenOptions={{
        headerShadowVisible: false,
        headerStyle: { backgroundColor: "#ffffff" },
        headerTitleStyle: { color: theme.colors.text, fontWeight: "700" },
      }}
    >
      <AdminStack.Screen name="AdminDashboard" component={AdminDashboardScreen} options={{ title: "관리자 대시보드" }} />
      <AdminStack.Screen name="PendingUsers" component={PendingUsersScreen} options={{ title: "회원 승인 관리" }} />
      <AdminStack.Screen name="EquipmentManagement" component={EquipmentManagementScreen} options={{ title: "기자재 관리" }} />
      <AdminStack.Screen name="EquipmentForm" component={EquipmentFormScreen} options={{ title: "기자재 등록 / 수정" }} />
      <AdminStack.Screen name="EquipmentDetail" component={EquipmentDetailScreen} options={{ title: "기자재 상세" }} />
      <AdminStack.Screen name="RentalApprovals" component={RentalApprovalsScreen} options={{ title: "대여 승인" }} />
      <AdminStack.Screen name="ExtensionApprovals" component={ExtensionApprovalsScreen} options={{ title: "연장 승인" }} />
      <AdminStack.Screen name="ReturnApprovals" component={ReturnApprovalsScreen} options={{ title: "반납 승인" }} />
      <AdminStack.Screen name="StatusManagement" component={StatusManagementScreen} options={{ title: "연체 / 상태 관리" }} />
      <AdminStack.Screen name="Notifications" component={NotificationsScreen} options={{ title: "알림" }} />
    </AdminStack.Navigator>
  );
}

export default function AppNavigator() {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return <LoadingView text="로그인 상태를 확인하는 중입니다." />;
  }

  return <NavigationContainer>{user ? (isAdmin ? <AdminNavigator /> : <UserNavigator />) : <AuthNavigator />}</NavigationContainer>;
}

const styles = StyleSheet.create({
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  primaryTabButton: {
    marginTop: -8,
  },
  tabIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryTabIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    ...theme.shadow.card,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.muted,
  },
  tabLabelActive: {
    color: theme.colors.primary,
  },
  primaryTabLabel: {
    color: theme.colors.text,
  },
});
