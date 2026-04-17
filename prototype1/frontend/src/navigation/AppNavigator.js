import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoadingView from "../components/LoadingView";
import { useAuth } from "../hooks/useAuth";
import { useNotifications } from "../hooks/useNotifications";
import LoginScreen from "../screens/auth/LoginScreen";
import SignupScreen from "../screens/auth/SignupScreen";
import AdminDashboardScreen from "../screens/admin/AdminDashboardScreen";
import EquipmentFormScreen from "../screens/admin/EquipmentFormScreen";
import EquipmentManagementScreen from "../screens/admin/EquipmentManagementScreen";
import ExtensionApprovalsScreen from "../screens/admin/ExtensionApprovalsScreen";
import PendingUsersScreen from "../screens/admin/PendingUsersScreen";
import RentalApprovalsScreen from "../screens/admin/RentalApprovalsScreen";
import ReturnApprovalsScreen from "../screens/admin/ReturnApprovalsScreen";
import StatusManagementScreen from "../screens/admin/StatusManagementScreen";
import NotificationsScreen from "../screens/shared/NotificationsScreen";
import EquipmentDetailScreen from "../screens/user/EquipmentDetailScreen";
import EquipmentListScreen from "../screens/user/EquipmentListScreen";
import MyRentalsScreen from "../screens/user/MyRentalsScreen";
import QRScannerScreen from "../screens/user/QRScannerScreen";
import RentalCheckoutScreen from "../screens/user/RentalCheckoutScreen";
import UserHomeScreen from "../screens/user/UserHomeScreen";

const RootStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function AuthStack() {
  return (
    <RootStack.Navigator>
      <RootStack.Screen name="Login" component={LoginScreen} options={{ title: "로그인" }} />
      <RootStack.Screen name="Signup" component={SignupScreen} options={{ title: "회원가입" }} />
    </RootStack.Navigator>
  );
}

function UserTabs() {
  const { unreadCount } = useNotifications();
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="홈" component={UserHomeScreen} />
      <Tab.Screen name="기자재" component={EquipmentListScreen} />
      <Tab.Screen name="QR스캔" component={QRScannerScreen} initialParams={{ mode: "lookup" }} />
      <Tab.Screen name="내대여" component={MyRentalsScreen} />
      <Tab.Screen
        name="알림"
        component={NotificationsScreen}
        options={{ tabBarBadge: unreadCount ? unreadCount : undefined }}
      />
    </Tab.Navigator>
  );
}

function UserRoot() {
  return (
    <RootStack.Navigator>
      <RootStack.Screen name="UserTabs" component={UserTabs} options={{ headerShown: false }} />
      <RootStack.Screen name="EquipmentDetail" component={EquipmentDetailScreen} options={{ title: "기자재 상세" }} />
      <RootStack.Screen name="QRScanner" component={QRScannerScreen} options={{ title: "QR 스캔" }} />
      <RootStack.Screen name="RentalCheckout" component={RentalCheckoutScreen} options={{ title: "대여 상세" }} />
    </RootStack.Navigator>
  );
}

function AdminTabs() {
  const { unreadCount } = useNotifications();
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="대시보드" component={AdminDashboardScreen} />
      <Tab.Screen name="회원승인" component={PendingUsersScreen} />
      <Tab.Screen name="기자재관리" component={EquipmentManagementScreen} />
      <Tab.Screen name="상태관리" component={StatusManagementScreen} />
      <Tab.Screen
        name="알림"
        component={NotificationsScreen}
        options={{ tabBarBadge: unreadCount ? unreadCount : undefined }}
      />
    </Tab.Navigator>
  );
}

function AdminRoot() {
  return (
    <RootStack.Navigator>
      <RootStack.Screen name="AdminTabs" component={AdminTabs} options={{ headerShown: false }} />
      <RootStack.Screen name="EquipmentDetail" component={EquipmentDetailScreen} options={{ title: "기자재 상세" }} />
      <RootStack.Screen name="EquipmentForm" component={EquipmentFormScreen} options={{ title: "기자재 등록/수정" }} />
      <RootStack.Screen name="PendingUsers" component={PendingUsersScreen} options={{ title: "회원 승인 관리" }} />
      <RootStack.Screen name="RentalApprovals" component={RentalApprovalsScreen} options={{ title: "대여 승인 관리" }} />
      <RootStack.Screen name="ExtensionApprovals" component={ExtensionApprovalsScreen} options={{ title: "연장 승인 관리" }} />
      <RootStack.Screen name="ReturnApprovals" component={ReturnApprovalsScreen} options={{ title: "반납 승인 관리" }} />
    </RootStack.Navigator>
  );
}

export default function AppNavigator() {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return <LoadingView text="앱 초기 정보를 불러오는 중입니다." />;
  }

  return (
    <NavigationContainer>
      {user ? isAdmin ? <AdminRoot /> : <UserRoot /> : <AuthStack />}
    </NavigationContainer>
  );
}
