import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const arduinoImage = require("./assets/arduino.jpg");
const raspberryImage = require("./assets/raspberry.jpg");
const laptopImage = require("./assets/laptop.jpg");

const API_BASES = [
  "http://10.0.2.2:4000/api",
  "http://127.0.0.1:4000/api",
];

const QUICK_MEMOS = ["수업 실습", "프로젝트 발표", "개인 학습", "팀 과제"];

const CATEGORY_META = {
  ARDUINO: {
    image: arduinoImage,
    badge: "키트",
  },
  RASPBERRY_PI: {
    image: raspberryImage,
    badge: "키트",
  },
  LAPTOP: {
    image: laptopImage,
    badge: "기기",
  },
};

function getEquipmentImage(category) {
  return CATEGORY_META[category]?.image || laptopImage;
}

function getStatusLabel(status) {
  const map = {
    AVAILABLE: "대여 가능",
    RENTAL_PENDING: "승인 대기",
    RENTED: "대여 중",
    RETURN_PENDING: "반납 대기",
    INSPECTION_REQUIRED: "점검 필요",
    REPAIR: "수리 중",
    OVERDUE: "연체",
  };

  return map[status] || status || "상태 없음";
}

function getStatusColors(status) {
  const palette = {
    AVAILABLE: { bg: "#35c98e", text: "#ffffff" },
    RENTAL_PENDING: { bg: "#3b82f6", text: "#ffffff" },
    RENTED: { bg: "#475569", text: "#ffffff" },
    RETURN_PENDING: { bg: "#f97316", text: "#ffffff" },
    INSPECTION_REQUIRED: { bg: "#a855f7", text: "#ffffff" },
    REPAIR: { bg: "#ef4444", text: "#ffffff" },
    OVERDUE: { bg: "#ef4444", text: "#ffffff" },
  };

  return palette[status] || { bg: "#cbd5e1", text: "#0f172a" };
}

function normalizeEquipment(equipment) {
  return {
    id: equipment.id,
    name: equipment.name,
    category: equipment.category,
    code: equipment.code,
    qrValue: equipment.qrValue || equipment.code,
    status: equipment.status,
    location: equipment.location || "보관 위치 미등록",
    components: Array.isArray(equipment.components) ? equipment.components : [],
    description: equipment.description || "기자재 설명이 없습니다.",
    imageSource: getEquipmentImage(equipment.category),
    statusLabel: getStatusLabel(equipment.status),
  };
}

function normalizeRental(rental) {
  return {
    id: rental.id,
    equipmentId: rental.equipmentId,
    title: rental.equipmentName,
    code: rental.equipmentCode,
    period: rental.dueDate ? `반납 예정 ${rental.dueDate}` : "반납일 미정",
    status: rental.status,
    statusLabel: getStatusLabel(
      rental.status === "REQUESTED" ? "RENTAL_PENDING" : rental.equipmentStatus || rental.status
    ),
  };
}

async function requestJson(baseUrl, path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, options);
  let payload = null;

  try {
    payload = await response.json();
  } catch (error) {
    payload = null;
  }

  if (!response.ok) {
    const message = payload?.message || "요청 처리 중 오류가 발생했습니다.";
    throw new Error(message);
  }

  return payload;
}

async function loginAgainstBackend(studentId, password) {
  let lastError = new Error("백엔드 서버에 연결할 수 없습니다.");

  for (const baseUrl of API_BASES) {
    try {
      const payload = await requestJson(baseUrl, "/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, password }),
      });

      return { baseUrl, payload };
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}

async function fetchEquipments(baseUrl, token) {
  const payload = await requestJson(baseUrl, "/equipments", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return Array.isArray(payload) ? payload.map(normalizeEquipment) : [];
}

async function fetchRentals(baseUrl, token) {
  const payload = await requestJson(baseUrl, "/rentals?onlyActive=true", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return Array.isArray(payload) ? payload.map(normalizeRental) : [];
}

async function createRentalRequest(baseUrl, token, equipmentId, dueDate, note) {
  return requestJson(baseUrl, "/rentals/request", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      equipmentId,
      dueDate,
      note,
    }),
  });
}

function Page({ children, dark = false }) {
  return (
    <SafeAreaView style={[styles.safeArea, dark && styles.safeAreaDark]}>
      <StatusBar style={dark ? "light" : "dark"} />
      {children}
    </SafeAreaView>
  );
}

function Header({ title, onBack, rightText, onRightPress, dark = false }) {
  const tint = dark ? "#ffffff" : "#0f172a";

  return (
    <View style={styles.header}>
      <View style={styles.headerSide}>
        {onBack ? (
          <Pressable style={styles.iconButton} onPress={onBack}>
            <MaterialCommunityIcons name="chevron-left" size={24} color={tint} />
          </Pressable>
        ) : null}
      </View>
      <Text style={[styles.headerTitle, dark && styles.headerTitleDark]}>{title}</Text>
      <View style={[styles.headerSide, styles.headerSideRight]}>
        {rightText ? (
          <Pressable style={styles.headerChip} onPress={onRightPress}>
            <Text style={styles.headerChipText}>{rightText}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function BottomTab({ current, onChange }) {
  const tabs = [
    { key: "home", icon: "home-variant", label: "홈" },
    { key: "rent", icon: "qrcode-scan", label: "기자재 대여" },
    { key: "mypage", icon: "account-outline", label: "마이페이지" },
  ];

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

function StatusBadge({ status }) {
  const colors = getStatusColors(status);

  return (
    <View style={[styles.statusBadge, { backgroundColor: colors.bg }]}>
      <Text style={[styles.statusBadgeText, { color: colors.text }]}>{getStatusLabel(status)}</Text>
    </View>
  );
}

function InputField({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  multiline = false,
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94a3b8"
        secureTextEntry={secureTextEntry}
        multiline={multiline}
        style={[styles.input, multiline && styles.textarea]}
      />
    </View>
  );
}

function PrimaryButton({ label, onPress, disabled = false, compact = false }) {
  return (
    <Pressable
      style={[
        styles.primaryButton,
        compact && styles.primaryButtonCompact,
        disabled && styles.primaryButtonDisabled,
      ]}
      disabled={disabled}
      onPress={onPress}
    >
      <Text style={[styles.primaryButtonText, compact && styles.primaryButtonTextCompact]}>
        {label}
      </Text>
    </Pressable>
  );
}

function LoginScreen({
  studentId,
  password,
  onChangeStudentId,
  onChangePassword,
  onLogin,
  onSignup,
  loading,
}) {
  return (
    <Page>
      <Header title="로그인" />
      <View style={styles.centerWrap}>
        <View style={styles.authCard}>
          <Text style={styles.brand}>4 EQUIP</Text>
          <Text style={styles.authTitle}>스마트 학과 기자재 대여</Text>
          <Text style={styles.authSubtitle}>
            학번 또는 관리자 아이디로 로그인한 뒤 기자재를 조회하고 대여 요청할 수 있습니다.
          </Text>

          <InputField
            label="학번 또는 관리자 아이디"
            value={studentId}
            onChangeText={onChangeStudentId}
            placeholder="예: 20240001"
          />
          <InputField
            label="비밀번호"
            value={password}
            onChangeText={onChangePassword}
            placeholder="비밀번호를 입력해주세요"
            secureTextEntry
          />

          <PrimaryButton
            label={loading ? "로그인 중..." : "로그인"}
            onPress={onLogin}
            disabled={loading}
          />

          <Pressable onPress={onSignup}>
            <Text style={styles.linkText}>회원이 아니신가요? 회원가입</Text>
          </Pressable>

          <View style={styles.testAccountCard}>
            <Text style={styles.testAccountTitle}>테스트 계정</Text>
            <Text style={styles.testAccountText}>사용자: 20240001 / user1234</Text>
            <Text style={styles.testAccountText}>관리자: admin01 / admin1234</Text>
          </View>
        </View>
      </View>
    </Page>
  );
}

function SignupScreen({ form, onChange, onBack, onSubmit }) {
  return (
    <Page>
      <Header title="회원가입" onBack={onBack} />
      <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
        <View style={styles.authCard}>
          <InputField
            label="학번"
            value={form.studentId}
            onChangeText={(value) => onChange("studentId", value)}
            placeholder="학번을 입력해주세요"
          />
          <InputField
            label="이름"
            value={form.name}
            onChangeText={(value) => onChange("name", value)}
            placeholder="이름을 입력해주세요"
          />
          <InputField
            label="이메일"
            value={form.email}
            onChangeText={(value) => onChange("email", value)}
            placeholder="이메일을 입력해주세요"
          />
          <InputField
            label="비밀번호"
            value={form.password}
            onChangeText={(value) => onChange("password", value)}
            placeholder="비밀번호를 입력해주세요"
            secureTextEntry
          />

          <View style={styles.uploadPlaceholder}>
            <MaterialCommunityIcons name="image-outline" size={28} color="#64748b" />
            <Text style={styles.uploadPlaceholderText}>
              학생증 업로드 영역
            </Text>
            <Text style={styles.uploadPlaceholderSubText}>
              현재 작업본에서는 화면만 제공합니다.
            </Text>
          </View>

          <PrimaryButton label="회원가입 완료" onPress={onSubmit} />
        </View>
      </ScrollView>
    </Page>
  );
}

function SignupCompleteScreen({ onBack }) {
  return (
    <Page>
      <View style={styles.completeWrap}>
        <View style={styles.completeIcon}>
          <MaterialCommunityIcons name="check" size={50} color="#ffffff" />
        </View>
        <Text style={styles.completeTitle}>가입 신청이 완료되었습니다</Text>
        <Text style={styles.completeDescription}>
          관리자 승인 후 로그인할 수 있습니다. 이 작업본에서는 회원가입 화면 흐름만 제공합니다.
        </Text>
        <PrimaryButton label="돌아가기" onPress={onBack} />
      </View>
    </Page>
  );
}

function HomeScreen({ items, loading, onOpenList, onOpenMyPage, onLogout }) {
  return (
    <Page>
      <View style={styles.topBrandRow}>
        <Text style={styles.brand}>4 EQUIP</Text>
        <Pressable style={styles.logoutButton} onPress={onLogout}>
          <Text style={styles.logoutButtonText}>로그아웃</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.homeScroll} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loaderCard}>
            <ActivityIndicator color="#2f89ef" />
            <Text style={styles.loaderText}>기자재 목록을 불러오는 중입니다.</Text>
          </View>
        ) : items.length === 0 ? (
          <View style={styles.loaderCard}>
            <MaterialCommunityIcons name="archive-outline" size={28} color="#94a3b8" />
            <Text style={styles.loaderText}>불러온 기자재가 없습니다.</Text>
          </View>
        ) : (
          items.map((item) => (
            <Pressable key={item.id} style={styles.homeCard} onPress={onOpenList}>
              <View style={styles.homeCardHeader}>
                <StatusBadge status={item.status} />
                <Text style={styles.cardCategory}>{CATEGORY_META[item.category]?.badge || "기기"}</Text>
              </View>
              <View style={styles.cardImageWrap}>
                <Image source={item.imageSource} style={styles.cardImage} resizeMode="contain" />
              </View>
              <Text style={styles.cardTitle}>{item.name}</Text>
            </Pressable>
          ))
        )}
      </ScrollView>

      <BottomTab
        current="home"
        onChange={(key) => {
          if (key === "rent") onOpenList();
          if (key === "mypage") onOpenMyPage();
        }}
      />
    </Page>
  );
}

function ListScreen({ items, loading, onBack, onSelectItem, onGoHome, onGoMyPage }) {
  return (
    <Page>
      <Header title="기자재 목록" onBack={onBack} />
      <ScrollView contentContainerStyle={styles.listScroll} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loaderCard}>
            <ActivityIndicator color="#2f89ef" />
            <Text style={styles.loaderText}>기자재 정보를 불러오는 중입니다.</Text>
          </View>
        ) : (
          items.map((item) => (
            <View key={item.id} style={styles.listCard}>
              <View style={styles.listThumb}>
                <Image source={item.imageSource} style={styles.listThumbImage} resizeMode="contain" />
              </View>
              <View style={styles.listBody}>
                <Text style={styles.listName}>{item.name}</Text>
                <Text style={styles.listCode}>{item.code}</Text>
                <Text style={styles.listLocation}>{item.location}</Text>
              </View>
              <View style={styles.listSide}>
                <StatusBadge status={item.status} />
                <PrimaryButton
                  label="대여하기"
                  compact
                  disabled={item.status !== "AVAILABLE"}
                  onPress={() => onSelectItem(item)}
                />
              </View>
            </View>
          ))
        )}
      </ScrollView>
      <BottomTab
        current="rent"
        onChange={(key) => {
          if (key === "home") onGoHome();
          if (key === "mypage") onGoMyPage();
        }}
      />
    </Page>
  );
}

function ScannerScreen({ selectedItem, onBack, onScanSuccess }) {
  return (
    <Page dark>
      <Header title="QR 스캔" onBack={onBack} dark />
      <View style={styles.scannerWrap}>
        <Text style={styles.scannerTitle}>{selectedItem?.name}</Text>
        <Text style={styles.scannerCode}>{selectedItem?.code}</Text>
        <View style={styles.scannerFrame}>
          <View style={[styles.scannerCorner, styles.cornerLeftTop]} />
          <View style={[styles.scannerCorner, styles.cornerRightTop]} />
          <View style={[styles.scannerCorner, styles.cornerLeftBottom]} />
          <View style={[styles.scannerCorner, styles.cornerRightBottom]} />
        </View>
        <Text style={styles.scannerGuide}>QR 코드를 사각형 안에 맞춰주세요</Text>
        <Text style={styles.scannerSubGuide}>
          현재 작업본에서는 실카메라 대신 테스트 버튼으로 다음 화면으로 이동합니다.
        </Text>
        <PrimaryButton label="테스트 QR 인증" onPress={onScanSuccess} />
      </View>
    </Page>
  );
}

function RentalDetailScreen({
  item,
  dueDate,
  memo,
  submitting,
  onChangeDueDate,
  onChangeMemo,
  onBack,
  onSubmit,
}) {
  return (
    <Page>
      <Header title="대여 신청 상세" onBack={onBack} />
      <ScrollView contentContainerStyle={styles.detailScroll} showsVerticalScrollIndicator={false}>
        <View style={styles.detailCard}>
          <View style={styles.detailImageWrap}>
            <Image source={item.imageSource} style={styles.detailImage} resizeMode="contain" />
          </View>
          <Text style={styles.detailName}>{item.name}</Text>
          <Text style={styles.detailCode}>{item.code}</Text>
          <View style={styles.detailInfoBox}>
            <Text style={styles.detailInfoText}>상태: {item.statusLabel}</Text>
            <Text style={styles.detailInfoText}>보관 위치: {item.location}</Text>
            <Text style={styles.detailInfoText}>
              구성품: {item.components.length ? item.components.join(", ") : "미등록"}
            </Text>
          </View>
        </View>

        <View style={styles.detailCard}>
          <Text style={styles.sectionTitle}>기자재 설명</Text>
          <Text style={styles.sectionBody}>{item.description}</Text>
        </View>

        <View style={styles.detailCard}>
          <InputField
            label="반납 예정일"
            value={dueDate}
            onChangeText={onChangeDueDate}
            placeholder="YYYY-MM-DD"
          />
          <InputField
            label="요청 메모"
            value={memo}
            onChangeText={onChangeMemo}
            placeholder="관리자에게 전달할 메모를 입력해주세요"
            multiline
          />
          <View style={styles.quickMemoRow}>
            {QUICK_MEMOS.map((quickMemo) => {
              const active = memo === quickMemo;
              return (
                <Pressable
                  key={quickMemo}
                  style={[styles.quickMemoChip, active && styles.quickMemoChipActive]}
                  onPress={() => onChangeMemo(quickMemo)}
                >
                  <Text style={[styles.quickMemoText, active && styles.quickMemoTextActive]}>
                    {quickMemo}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.submitWrap}>
          <PrimaryButton
            label={submitting ? "요청 중..." : "대여 신청 완료"}
            onPress={onSubmit}
            disabled={submitting}
          />
        </View>
      </ScrollView>
    </Page>
  );
}

function MyPageScreen({ user, rentals, onBack, onGoHome }) {
  return (
    <Page>
      <Header title="마이페이지" onBack={onBack} />
      <ScrollView contentContainerStyle={styles.myScroll} showsVerticalScrollIndicator={false}>
        <View style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            <MaterialCommunityIcons name="account" size={34} color="#2f89ef" />
          </View>
          <View style={styles.profileBody}>
            <Text style={styles.profileName}>{user?.name || "사용자"}</Text>
            <Text style={styles.profileMeta}>학번: {user?.studentId || "-"}</Text>
            <Text style={styles.profileMeta}>{user?.department || "학과 정보 없음"}</Text>
          </View>
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>{rentals.length}</Text>
            <Text style={styles.summaryLabel}>진행 중 요청</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>{user?.role || "USER"}</Text>
            <Text style={styles.summaryLabel}>계정 권한</Text>
          </View>
        </View>

        <View style={styles.panelCard}>
          <Text style={styles.sectionTitle}>내 대여 현황</Text>
          {rentals.length ? (
            rentals.map((rental) => (
              <View key={rental.id} style={styles.rentalRow}>
                <View style={styles.rentalTextWrap}>
                  <Text style={styles.rentalTitle}>{rental.title}</Text>
                  <Text style={styles.rentalSub}>{rental.code}</Text>
                  <Text style={styles.rentalSub}>{rental.period}</Text>
                </View>
                <StatusBadge
                  status={
                    rental.status === "REQUESTED"
                      ? "RENTAL_PENDING"
                      : rental.status === "APPROVED"
                        ? "RENTED"
                        : "AVAILABLE"
                  }
                />
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>아직 대여 요청 내역이 없습니다.</Text>
          )}
        </View>
      </ScrollView>
      <BottomTab
        current="mypage"
        onChange={(key) => {
          if (key === "home") onGoHome();
        }}
      />
    </Page>
  );
}

export default function App() {
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
  const [selectedItem, setSelectedItem] = useState(null);
  const [dueDate, setDueDate] = useState("2026-05-10");
  const [memo, setMemo] = useState("수업 실습");
  const [loginLoading, setLoginLoading] = useState(false);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  async function loadUserData(nextToken, nextApiBase) {
    setItemsLoading(true);

    try {
      const [equipmentRows, rentalRows] = await Promise.all([
        fetchEquipments(nextApiBase, nextToken),
        fetchRentals(nextApiBase, nextToken),
      ]);

      setItems(equipmentRows);
      setRentals(rentalRows);
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

      setApiBase(backendResult.baseUrl);
      setToken(backendResult.payload.token);
      setUser(backendResult.payload.user);
      setScreen("home");
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
      Alert.alert("대여 요청 완료", "관리자 승인 후 대여가 진행됩니다.");

      setScreen("home");
    } catch (error) {
      setModalMessage(error.message);
    } finally {
      setSubmitLoading(false);
    }
  }

  function handleLogout() {
    setScreen("login");
    setUser(null);
    setToken("");
    setApiBase("");
    setItems([]);
    setRentals([]);
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
            onScanSuccess={() => setScreen("detail")}
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
    dueDate,
    items,
    itemsLoading,
    loginLoading,
    memo,
    password,
    rentals,
    screen,
    selectedItem,
    signupForm,
    studentId,
    submitLoading,
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

const styles = StyleSheet.create({
  app: {
    flex: 1,
    backgroundColor: "#f3f5f8",
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#f3f5f8",
  },
  safeAreaDark: {
    backgroundColor: "#05070b",
  },
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
  },
  headerSide: {
    width: 72,
    justifyContent: "center",
  },
  headerSideRight: {
    alignItems: "flex-end",
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    color: "#0f172a",
  },
  headerTitleDark: {
    color: "#ffffff",
  },
  iconButton: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  headerChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: "#2f89ef",
  },
  headerChipText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "700",
  },
  centerWrap: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 22,
    paddingBottom: 36,
  },
  scrollBody: {
    paddingHorizontal: 22,
    paddingBottom: 34,
  },
  authCard: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 22,
    gap: 16,
    shadowColor: "#0f172a",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  brand: {
    fontSize: 22,
    fontWeight: "800",
    color: "#2f89ef",
  },
  authTitle: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: "800",
    color: "#0f172a",
  },
  authSubtitle: {
    color: "#64748b",
    lineHeight: 21,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
  },
  input: {
    minHeight: 50,
    borderRadius: 14,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#dbe3ef",
    paddingHorizontal: 14,
    fontSize: 14,
    color: "#0f172a",
  },
  textarea: {
    minHeight: 98,
    paddingTop: 12,
    textAlignVertical: "top",
  },
  primaryButton: {
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2f89ef",
    marginTop: 4,
  },
  primaryButtonCompact: {
    height: 32,
    paddingHorizontal: 14,
    borderRadius: 16,
  },
  primaryButtonDisabled: {
    backgroundColor: "#9ac1f7",
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#ffffff",
  },
  primaryButtonTextCompact: {
    fontSize: 12,
  },
  linkText: {
    textAlign: "center",
    color: "#64748b",
    fontSize: 12,
  },
  testAccountCard: {
    borderRadius: 16,
    backgroundColor: "#f8fafc",
    padding: 14,
    gap: 6,
  },
  testAccountTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0f172a",
  },
  testAccountText: {
    color: "#64748b",
    fontSize: 12,
  },
  uploadPlaceholder: {
    minHeight: 110,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#b8c2cf",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 20,
  },
  uploadPlaceholderText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#334155",
  },
  uploadPlaceholderSubText: {
    fontSize: 12,
    color: "#64748b",
  },
  completeWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
    gap: 18,
  },
  completeIcon: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: "#22c55e",
    alignItems: "center",
    justifyContent: "center",
  },
  completeTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0f172a",
  },
  completeDescription: {
    textAlign: "center",
    color: "#64748b",
    lineHeight: 21,
  },
  topBrandRow: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logoutButton: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: "#2f89ef",
  },
  logoutButtonText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "700",
  },
  bannerWrap: {
    paddingHorizontal: 12,
    paddingBottom: 6,
  },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "#eff6ff",
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  bannerText: {
    flex: 1,
    color: "#1d4ed8",
    fontSize: 12,
    lineHeight: 17,
  },
  homeScroll: {
    paddingHorizontal: 10,
    paddingBottom: 96,
    gap: 12,
  },
  homeCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 14,
    gap: 12,
    shadowColor: "#0f172a",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  homeCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardCategory: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "700",
  },
  cardImageWrap: {
    height: 146,
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  cardImage: {
    width: "88%",
    height: "88%",
  },
  cardTitle: {
    textAlign: "center",
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  loaderCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
    gap: 10,
    paddingVertical: 24,
  },
  loaderText: {
    color: "#64748b",
    fontSize: 13,
  },
  bottomTab: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 74,
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  tabItem: {
    alignItems: "center",
    gap: 4,
  },
  tabText: {
    fontSize: 10,
    color: "#9aa4b2",
  },
  tabTextActive: {
    color: "#2f89ef",
    fontWeight: "700",
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  listScroll: {
    paddingHorizontal: 12,
    paddingBottom: 96,
    gap: 10,
  },
  listCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 10,
  },
  listThumb: {
    width: 72,
    height: 72,
    borderRadius: 10,
    backgroundColor: "#f8fafc",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  listThumbImage: {
    width: "88%",
    height: "88%",
  },
  listBody: {
    flex: 1,
    gap: 4,
  },
  listName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },
  listCode: {
    fontSize: 12,
    color: "#475569",
  },
  listLocation: {
    fontSize: 11,
    color: "#94a3b8",
  },
  listSide: {
    alignItems: "flex-end",
    gap: 6,
  },
  scannerWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 16,
  },
  scannerTitle: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "800",
  },
  scannerCode: {
    color: "#93c5fd",
    fontSize: 13,
    fontWeight: "700",
  },
  scannerFrame: {
    width: 210,
    height: 210,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    position: "relative",
  },
  scannerCorner: {
    position: "absolute",
    width: 32,
    height: 32,
    borderColor: "#ffffff",
  },
  cornerLeftTop: {
    top: -1,
    left: -1,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  cornerRightTop: {
    top: -1,
    right: -1,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  cornerLeftBottom: {
    left: -1,
    bottom: -1,
    borderLeftWidth: 3,
    borderBottomWidth: 3,
  },
  cornerRightBottom: {
    right: -1,
    bottom: -1,
    borderRightWidth: 3,
    borderBottomWidth: 3,
  },
  scannerGuide: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  scannerSubGuide: {
    color: "#d1d5db",
    textAlign: "center",
    lineHeight: 19,
    fontSize: 12,
    marginBottom: 6,
  },
  detailScroll: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 96,
    gap: 12,
  },
  detailCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 15,
    gap: 12,
  },
  detailImageWrap: {
    height: 132,
    borderRadius: 12,
    backgroundColor: "#f8fafc",
    alignItems: "center",
    justifyContent: "center",
  },
  detailImage: {
    width: "88%",
    height: "88%",
  },
  detailName: {
    textAlign: "center",
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  detailCode: {
    textAlign: "center",
    fontSize: 26,
    fontWeight: "800",
    color: "#0f172a",
  },
  detailInfoBox: {
    borderRadius: 12,
    backgroundColor: "#f8fafc",
    padding: 12,
    gap: 6,
  },
  detailInfoText: {
    color: "#475569",
    fontSize: 13,
    lineHeight: 19,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  sectionBody: {
    fontSize: 13,
    color: "#475569",
    lineHeight: 20,
  },
  quickMemoRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  quickMemoChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#eef2ff",
  },
  quickMemoChipActive: {
    backgroundColor: "#dbeafe",
  },
  quickMemoText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
  },
  quickMemoTextActive: {
    color: "#2563eb",
  },
  submitWrap: {
    alignItems: "center",
  },
  myScroll: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 96,
    gap: 12,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 16,
  },
  avatarCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#e8f0ff",
    alignItems: "center",
    justifyContent: "center",
  },
  profileBody: {
    flex: 1,
    gap: 4,
  },
  profileName: {
    fontSize: 19,
    fontWeight: "800",
    color: "#111827",
  },
  profileMeta: {
    color: "#64748b",
    fontSize: 13,
  },
  summaryRow: {
    flexDirection: "row",
    gap: 10,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    gap: 6,
  },
  summaryNumber: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
  },
  summaryLabel: {
    fontSize: 12,
    color: "#64748b",
  },
  panelCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 16,
    gap: 12,
  },
  rentalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  rentalTextWrap: {
    flex: 1,
    gap: 4,
  },
  rentalTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  rentalSub: {
    fontSize: 12,
    color: "#64748b",
  },
  emptyText: {
    color: "#64748b",
    lineHeight: 19,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.35)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  modalCard: {
    width: "100%",
    maxWidth: 310,
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 18,
    gap: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
  },
  modalBody: {
    color: "#475569",
    lineHeight: 21,
  },
  modalAction: {
    alignSelf: "flex-end",
    paddingTop: 4,
  },
  modalActionText: {
    color: "#2563eb",
    fontWeight: "700",
  },
});
