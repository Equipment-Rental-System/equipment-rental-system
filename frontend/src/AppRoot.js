import { useEffect, useMemo, useState } from "react";
import { Alert, Modal, Pressable, Text, View } from "react-native";
import LoginScreen from "./screens/LoginScreen";
import SignupScreen from "./screens/SignupScreen";
import SignupCompleteScreen from "./screens/SignupCompleteScreen";
import HomeScreen from "./screens/HomeScreen";
import ListScreen from "./screens/ListScreen";
import ScannerScreen from "./screens/ScannerScreen";
import RentalDetailScreen from "./screens/RentalDetailScreen";
import MyPageScreen from "./screens/MyPageScreen";
import {
  createRentalRequest,
  fetchAdminIssues,
  fetchAdminRentals,
  fetchEquipments,
  fetchNotifications,
  fetchRentals,
  loginAgainstBackend,
  markNotificationRead,
  verifyQrScan,
} from "./services/api";
import { normalizeUser } from "./utils/normalizers";
import { styles } from "./styles/appStyles";

export default function AppRoot() {
  const [screen, setScreen] = useState("login");
  const [studentId, setStudentId] = useState("20240001");
  const [password, setPassword] = useState("user1234");
  const [signupForm, setSignupForm] = useState({
    studentId: "",
    name: "",
    email: "",
    password: "",
  });
  const [user, setUser] = useState(null);
  const [token, setToken] = useState("");
  const [apiBase, setApiBase] = useState("");
  const [items, setItems] = useState([]);
  const [rentals, setRentals] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [adminRentals, setAdminRentals] = useState([]);
  const [adminIssues, setAdminIssues] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [dueDate, setDueDate] = useState("2026-05-10");
  const [memo, setMemo] = useState("수업 실습");
  const [loginLoading, setLoginLoading] = useState(false);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [scanLoading, setScanLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  async function loadUserData(nextToken, nextApiBase, nextUser = user) {
    setItemsLoading(true);

    try {
      const equipmentRows = await fetchEquipments(nextApiBase, nextToken);
      setItems(equipmentRows);

      try {
        setRentals(await fetchRentals(nextApiBase, nextToken));
      } catch (error) {
        setRentals([]);
      }

      try {
        setNotifications(await fetchNotifications(nextApiBase, nextToken));
      } catch (error) {
        setNotifications([]);
      }

      if (nextUser?.role === "ADMIN") {
        try {
          setAdminRentals(await fetchAdminRentals(nextApiBase, nextToken));
        } catch (error) {
          setAdminRentals([]);
        }

        try {
          setAdminIssues(await fetchAdminIssues(nextApiBase, nextToken));
        } catch (error) {
          setAdminIssues([]);
        }
      } else {
        setAdminRentals([]);
        setAdminIssues([]);
      }
    } catch (error) {
      setModalMessage(error.message);
    } finally {
      setItemsLoading(false);
    }
  }

  useEffect(() => {
    if (!screen || !token) {
      return;
    }

    if (screen === "home" || screen === "list" || screen === "mypage") {
      loadUserData(token, apiBase);
    }
  }, [apiBase, screen, token]);

  async function handleLogin() {
    if (!studentId.trim() || !password.trim()) {
      setModalMessage("학번 또는 관리자 아이디와 비밀번호를 입력해주세요.");
      return;
    }

    setLoginLoading(true);

    try {
      const backendResult = await loginAgainstBackend(studentId.trim(), password.trim());
      const nextUser = normalizeUser(backendResult.payload?.user, studentId.trim());

      setApiBase(backendResult.baseUrl);
      setToken(backendResult.payload.token);
      setUser(nextUser);
      setScreen("home");
      await loadUserData(backendResult.payload.token, backendResult.baseUrl, nextUser);
    } catch (backendError) {
      setModalMessage(backendError.message);
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleRentalSubmit() {
    if (!selectedItem) {
      return;
    }

    if (!dueDate.trim()) {
      setModalMessage("반납 예정일을 입력해주세요.");
      return;
    }

    setSubmitLoading(true);

    try {
      await createRentalRequest(apiBase, token, selectedItem.id, dueDate.trim(), memo.trim());
      await loadUserData(token, apiBase);
      Alert.alert("대여 요청 완료", "대여 요청이 정상 처리되었습니다.");
      setScreen("home");
    } catch (error) {
      setModalMessage(error.message);
    } finally {
      setSubmitLoading(false);
    }
  }

  async function handleQrVerification() {
    if (!selectedItem) {
      return;
    }

    if (!apiBase || !token) {
      setModalMessage("로그인 세션이 없어 QR 인증을 진행할 수 없습니다.");
      return;
    }

    setScanLoading(true);

    try {
      const result = await verifyQrScan(apiBase, token, selectedItem.qrValue || selectedItem.code);
      const verifiedItem = result?.item;

      if (!verifiedItem) {
        throw new Error("QR 인증 결과에서 기자재 정보를 확인하지 못했습니다.");
      }

      const sameEquipment =
        (verifiedItem.id && selectedItem.id && String(verifiedItem.id) === String(selectedItem.id)) ||
        (verifiedItem.code && selectedItem.code && verifiedItem.code === selectedItem.code) ||
        (verifiedItem.qrValue && selectedItem.qrValue && verifiedItem.qrValue === selectedItem.qrValue);

      if (!sameEquipment) {
        throw new Error("선택한 기자재와 스캔한 QR 정보가 일치하지 않습니다.");
      }

      if (result.action && result.action !== "RENT") {
        throw new Error("현재 QR 인증 결과로는 대여를 진행할 수 없습니다.");
      }

      setSelectedItem((prev) => ({ ...prev, ...verifiedItem }));
      setScreen("detail");
    } catch (error) {
      setModalMessage(error.message);
    } finally {
      setScanLoading(false);
    }
  }

  async function handleNotificationRead(notificationId) {
    if (!notificationId) {
      return;
    }

    try {
      await markNotificationRead(apiBase, token, notificationId);
      setNotifications((prev) => prev.filter((item) => String(item.id) !== String(notificationId)));
    } catch (error) {
      setModalMessage(error.message);
    }
  }

  function handleLogout() {
    setScreen("login");
    setUser(null);
    setToken("");
    setApiBase("");
    setItems([]);
    setRentals([]);
    setNotifications([]);
    setAdminRentals([]);
    setAdminIssues([]);
    setSelectedItem(null);
  }

  const currentContent = useMemo(() => {
    switch (screen) {
      case "signup":
        return (
          <SignupScreen
            form={signupForm}
            onChange={(field, value) => setSignupForm((prev) => ({ ...prev, [field]: value }))}
            onBack={() => setScreen("login")}
            onSubmit={() => setScreen("signupComplete")}
          />
        );
      case "signupComplete":
        return <SignupCompleteScreen onBack={() => setScreen("login")} />;
      case "home":
        return (
          <HomeScreen
            items={items}
            loading={itemsLoading}
            onOpenList={() => setScreen("list")}
            onOpenMyPage={() => setScreen("mypage")}
            onLogout={handleLogout}
          />
        );
      case "list":
        return (
          <ListScreen
            items={items}
            loading={itemsLoading}
            onBack={() => setScreen("home")}
            onSelectItem={(item) => {
              setSelectedItem(item);
              setDueDate("2026-05-10");
              setMemo("수업 실습");
              setScreen("scanner");
            }}
            onGoHome={() => setScreen("home")}
            onGoMyPage={() => setScreen("mypage")}
          />
        );
      case "scanner":
        return (
          <ScannerScreen
            selectedItem={selectedItem}
            onBack={() => setScreen("list")}
            onScanSuccess={handleQrVerification}
            loading={scanLoading}
          />
        );
      case "detail":
        return (
          <RentalDetailScreen
            item={selectedItem}
            dueDate={dueDate}
            memo={memo}
            submitting={submitLoading}
            onChangeDueDate={setDueDate}
            onChangeMemo={setMemo}
            onBack={() => setScreen("scanner")}
            onSubmit={handleRentalSubmit}
          />
        );
      case "mypage":
        return (
          <MyPageScreen
            user={user}
            rentals={rentals}
            notifications={notifications}
            adminRentals={adminRentals}
            adminIssues={adminIssues}
            onReadNotification={handleNotificationRead}
            onBack={() => setScreen("home")}
            onGoHome={() => setScreen("home")}
          />
        );
      default:
        return (
          <LoginScreen
            studentId={studentId}
            password={password}
            onChangeStudentId={setStudentId}
            onChangePassword={setPassword}
            onLogin={handleLogin}
            onSignup={() => setScreen("signup")}
            loading={loginLoading}
          />
        );
    }
  }, [
    adminIssues,
    adminRentals,
    apiBase,
    dueDate,
    items,
    itemsLoading,
    loginLoading,
    memo,
    notifications,
    password,
    rentals,
    screen,
    scanLoading,
    selectedItem,
    signupForm,
    studentId,
    submitLoading,
    token,
    user,
  ]);

  return (
    <View style={styles.app}>
      {currentContent}

      <Modal
        transparent
        animationType="fade"
        visible={Boolean(modalMessage)}
        onRequestClose={() => setModalMessage("")}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>안내</Text>
            <Text style={styles.modalBody}>{modalMessage}</Text>
            <Pressable style={styles.modalAction} onPress={() => setModalMessage("")}>
              <Text style={styles.modalActionText}>확인</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
