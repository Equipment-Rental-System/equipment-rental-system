import { useEffect, useMemo, useState } from "react";
import { Alert, Modal, Pressable, Text, View } from "react-native";
import LoginScreen from "./screens/LoginScreen";
import SignupCompleteScreen from "./screens/SignupCompleteScreen";
import HomeScreen from "./screens/HomeScreen";
import ListScreen from "./screens/ListScreen";
import RentalDetailScreen from "./screens/RentalDetailScreen";
import MyPageScreen from "./screens/MyPageScreen";
import AdminScreen from "./screens/AdminScreen";
import {
  createRentalRequest,
  fetchEquipments,
  fetchNotifications,
  fetchRentals,
  loginAgainstBackend,
  markNotificationRead,
  signupAgainstBackend,
  verifyQrScan,
} from "./services/api";
import { normalizeUser } from "./utils/normalizers";
import { styles } from "./styles/appStyles";

let SignupScreenModule = null;
let ScannerScreenModule = null;

function getSignupScreen() {
  if (!SignupScreenModule) {
    SignupScreenModule = require("./screens/SignupScreen").default;
  }

  return SignupScreenModule;
}

function getScannerScreen() {
  if (!ScannerScreenModule) {
    ScannerScreenModule = require("./screens/ScannerScreen").default;
  }

  return ScannerScreenModule;
}

export default function AppRoot() {
  const [screen, setScreen] = useState("login");
  const [studentId, setStudentId] = useState("20240001");
  const [password, setPassword] = useState("user1234");
  const [signupForm, setSignupForm] = useState({
    studentId: "",
    name: "",
    email: "",
    password: "",
    image: null,
  });
  const [user, setUser] = useState(null);
  const [token, setToken] = useState("");
  const [apiBase, setApiBase] = useState("");
  const [items, setItems] = useState([]);
  const [rentals, setRentals] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [dueDate, setDueDate] = useState("2026-05-10");
  const [memo, setMemo] = useState("수업 실습");
  const [loginLoading, setLoginLoading] = useState(false);
  const [signupLoading, setSignupLoading] = useState(false);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [scanLoading, setScanLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  async function loadUserData(nextToken, nextApiBase) {
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
    } catch (error) {
      setModalMessage(error.message);
    } finally {
      setItemsLoading(false);
    }
  }

  useEffect(() => {
    if (!token) {
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

      if (nextUser.role === "ADMIN") {
        setScreen("admin");
        return;
      }

      setScreen("home");
      await loadUserData(backendResult.payload.token, backendResult.baseUrl);
    } catch (error) {
      setModalMessage(error.message);
    } finally {
      setLoginLoading(false);
    }
  }

  async function handlePickSignupImage() {
    const ImagePicker = require("expo-image-picker");
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setModalMessage("학생증 이미지를 선택하려면 사진 권한이 필요합니다.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.length) {
      return;
    }

    const asset = result.assets[0];
    setSignupForm((prev) => ({
      ...prev,
      image: {
        uri: asset.uri,
        fileName: asset.fileName || `student-card-${Date.now()}.jpg`,
        mimeType: asset.mimeType || "image/jpeg",
      },
    }));
  }

  async function handleSignup() {
    if (!signupForm.studentId.trim() || !signupForm.name.trim() || !signupForm.email.trim() || !signupForm.password.trim()) {
      setModalMessage("회원가입 정보를 모두 입력해주세요.");
      return;
    }

    if (!signupForm.image?.uri) {
      setModalMessage("학생증 이미지를 첨부해주세요.");
      return;
    }

    setSignupLoading(true);

    try {
      await signupAgainstBackend(signupForm);
      setSignupForm({
        studentId: "",
        name: "",
        email: "",
        password: "",
        image: null,
      });
      setScreen("signupComplete");
    } catch (error) {
      setModalMessage(error.message);
    } finally {
      setSignupLoading(false);
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
      Alert.alert("대여 요청 완료", "대여 요청이 정상적으로 등록되었습니다.");
      setScreen("home");
    } catch (error) {
      setModalMessage(error.message);
    } finally {
      setSubmitLoading(false);
    }
  }

  async function handleQrVerification(scannedValue) {
    if (!selectedItem) {
      return;
    }

    if (!apiBase || !token) {
      setModalMessage("로그인 세션이 없어 QR 인증을 진행할 수 없습니다.");
      return;
    }

    setScanLoading(true);

    try {
      const result = await verifyQrScan(apiBase, token, scannedValue || selectedItem.qrValue || selectedItem.code);
      const verifiedItem = result?.item;

      if (!verifiedItem) {
        throw new Error("QR 인증 결과에서 기자재 정보를 확인하지 못했습니다.");
      }

      const sameEquipment =
        (verifiedItem.id && selectedItem.id && String(verifiedItem.id) === String(selectedItem.id)) ||
        (verifiedItem.code && selectedItem.code && verifiedItem.code === selectedItem.code) ||
        (verifiedItem.qrValue && selectedItem.qrValue && verifiedItem.qrValue === selectedItem.qrValue);

      if (!sameEquipment) {
        throw new Error("선택한 기자재와 다른 QR 코드입니다.");
      }

      if (result.action && result.action !== "RENT") {
        throw new Error("현재 상태에서는 대여를 진행할 수 없습니다.");
      }

      setSelectedItem((prev) => ({
        ...prev,
        id: verifiedItem.id || prev?.id,
        name: verifiedItem.name || prev?.name,
        status: verifiedItem.status || prev?.status,
        statusLabel: verifiedItem.statusLabel || prev?.statusLabel,
      }));
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
    setSelectedItem(null);
  }

  const currentContent = useMemo(() => {
    switch (screen) {
      case "signup":
        const SignupScreen = getSignupScreen();
        return (
          <SignupScreen
            form={signupForm}
            onChange={(field, value) => setSignupForm((prev) => ({ ...prev, [field]: value }))}
            onBack={() => setScreen("login")}
            onPickImage={handlePickSignupImage}
            onSubmit={handleSignup}
            loading={signupLoading}
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
        const ScannerScreen = getScannerScreen();
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
            onReadNotification={handleNotificationRead}
            onBack={() => setScreen("home")}
            onGoHome={() => setScreen("home")}
          />
        );
      case "admin":
        return (
          <AdminScreen
            apiBase={apiBase}
            token={token}
            user={user}
            onLogout={handleLogout}
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
    apiBase,
    dueDate,
    items,
    itemsLoading,
    loginLoading,
    memo,
    notifications,
    password,
    rentals,
    scanLoading,
    screen,
    selectedItem,
    signupForm,
    signupLoading,
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
