global.__DEV__ = true;

require("@babel/register")({
  extensions: [".js", ".jsx"],
  presets: [require.resolve("babel-preset-expo")],
  ignore: [/node_modules/],
});

const path = require("path");
const Module = require("module");
const React = require("react");
const renderer = require("react-test-renderer");
const { act } = renderer;

const projectRoot = path.resolve(__dirname, "..");
const srcRoot = path.join(projectRoot, "src");

const mockState = {
  auth: {
    token: "mock-token",
    user: { id: 3, name: "김학생", role: "USER", accountStatus: "APPROVED" },
    isAdmin: false,
    loading: false,
    login: async () => ({}),
    signup: async () => ({}),
    logout: async () => ({}),
  },
  notifications: {
    unreadCount: 2,
    refreshUnreadCount: async () => {},
  },
  alerts: [],
  api: {
    get: async () => [],
    post: async () => ({}),
    put: async () => ({}),
    patch: async () => ({}),
    request: async () => ({}),
  },
};

const reactNativeMock = {
  View: "View",
  Text: "Text",
  TextInput: "TextInput",
  ScrollView: "ScrollView",
  SafeAreaView: "SafeAreaView",
  ActivityIndicator: "ActivityIndicator",
  Pressable: ({ children, ...props }) => React.createElement("Pressable", props, typeof children === "function" ? children({ pressed: false }) : children),
  Image: "Image",
  StyleSheet: {
    create: (styles) => styles,
  },
  Alert: {
    alert: (...args) => {
      mockState.alerts.push(args);
    },
  },
  Platform: {
    OS: "android",
  },
};

function mockFile(relativePath, exports) {
  const absolutePath = path.join(srcRoot, relativePath);
  require.cache[absolutePath] = {
    id: absolutePath,
    filename: absolutePath,
    loaded: true,
    exports,
  };
}

const originalLoad = Module._load;
Module._load = function patchedLoad(request, parent, isMain) {
  if (request === "@react-navigation/native") {
    return {
      NavigationContainer: ({ children }) => React.createElement(React.Fragment, null, children),
      useFocusEffect: (effect) => {
        React.useEffect(() => effect(), [effect]);
      },
    };
  }

  if (request === "react-native") {
    return reactNativeMock;
  }

  if (request === "@react-navigation/bottom-tabs") {
    return {
      createBottomTabNavigator: () => ({
        Navigator: ({ children }) => React.createElement("MockBottomTabNavigator", null, children),
        Screen: ({ name, component, options, initialParams }) =>
          React.createElement("MockBottomTabScreen", {
            name,
            componentName: component?.name,
            options,
            initialParams,
          }),
      }),
    };
  }

  if (request === "@react-navigation/native-stack") {
    return {
      createNativeStackNavigator: () => ({
        Navigator: ({ children }) => React.createElement("MockStackNavigator", null, children),
        Screen: ({ name, component, options, initialParams }) =>
          React.createElement("MockStackScreen", {
            name,
            componentName: component?.name,
            options,
            initialParams,
          }),
      }),
    };
  }

  if (request === "expo-camera") {
    return {
      CameraView: (props) => React.createElement("CameraView", props),
      useCameraPermissions: () => [{ granted: true }, () => Promise.resolve({ granted: true })],
    };
  }

  if (request === "expo-image-picker") {
    return {
      MediaTypeOptions: { Images: "Images" },
      requestMediaLibraryPermissionsAsync: async () => ({ granted: true }),
      launchImageLibraryAsync: async () => ({
        canceled: false,
        assets: [
          {
            uri: "file:///mock-student-card.png",
            fileName: "student-card.png",
            mimeType: "image/png",
          },
        ],
      }),
    };
  }

  if (request === "react-native-safe-area-context") {
    return {
      SafeAreaView: ({ children, ...props }) => React.createElement("SafeAreaView", props, children),
      useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 16, left: 0 }),
    };
  }

  return originalLoad(request, parent, isMain);
};

mockFile("hooks/useAuth.js", {
  useAuth: () => mockState.auth,
});

mockFile("hooks/useNotifications.js", {
  useNotifications: () => mockState.notifications,
});

mockFile("api/client.js", {
  api: new Proxy(
    {},
    {
      get: (_, key) => mockState.api[key],
    }
  ),
  buildUploadUrl: (value) => value || null,
});

function createNavigationMock() {
  const calls = [];
  return {
    calls,
    navigate: (...args) => calls.push({ type: "navigate", args }),
    goBack: (...args) => calls.push({ type: "goBack", args }),
  };
}

async function flush() {
  await Promise.resolve();
  await new Promise((resolve) => setTimeout(resolve, 0));
}

function collectText(node, bucket = []) {
  if (!node) {
    return bucket;
  }

  if (typeof node === "string") {
    bucket.push(node);
    return bucket;
  }

  if (Array.isArray(node)) {
    node.forEach((item) => collectText(item, bucket));
    return bucket;
  }

  if (node.children) {
    collectText(node.children, bucket);
  }

  return bucket;
}

async function renderScreen(relativePath, props) {
  const mod = require(path.join(srcRoot, relativePath));
  const ScreenComponent = mod.default || mod;
  let tree;

  await act(async () => {
    tree = renderer.create(React.createElement(ScreenComponent, props));
    await flush();
  });

  return tree;
}

async function run() {
  const equipmentFixture = {
    id: 1,
    name: "실습용 노트북 01",
    category: "노트북",
    code: "EQ-LAP-001",
    qrValue: "EQ-LAP-001",
    status: "AVAILABLE",
    location: "학과 사무실",
    components: ["노트북 본체", "충전기", "가방"],
    description: "캡스톤 수업 발표 준비용 노트북",
  };

  const rentalFixture = {
    id: 12,
    userId: 3,
    userName: "김학생",
    studentId: "20240001",
    equipmentId: 1,
    equipmentName: "실습용 노트북 01",
    equipmentCode: "EQ-LAP-001",
    equipmentStatus: "RENTED",
    dueDate: "2026-04-21",
    requestedDueDate: "2026-04-24",
    status: "APPROVED",
  };

  const renderedScreens = [];

  mockState.api.get = async (pathValue) => {
    if (pathValue === "/equipments") {
      return [equipmentFixture];
    }
    if (pathValue === "/rentals?onlyActive=true") {
      return [rentalFixture];
    }
    if (pathValue === "/rentals") {
      return [rentalFixture];
    }
    if (pathValue === `/equipments/${equipmentFixture.id}`) {
      return equipmentFixture;
    }
    if (pathValue === `/equipments/${equipmentFixture.id}/qr`) {
      return { qrImage: "data:image/png;base64,MOCK" };
    }
    if (pathValue === `/equipments/qr/${encodeURIComponent("EQ-LAP-001")}` || pathValue === "/equipments/qr/EQ-LAP-001") {
      return equipmentFixture;
    }
    if (pathValue === "/notifications") {
      return [
        {
          id: 1,
          title: "반납 3일 전 알림",
          message: "실습용 노트북 01 반납일이 3일 남았습니다.",
          isRead: false,
          createdAt: "2026-04-14T10:00:00.000Z",
        },
      ];
    }
    if (pathValue === "/admin/users/pending") {
      return [
        {
          id: 99,
          name: "신청학생",
          studentId: "20245555",
          department: "컴퓨터공학과",
          studentCardImagePath: "uploads/student-cards/20245555.png",
        },
      ];
    }
    if (pathValue === "/rentals/pending") {
      return [{ ...rentalFixture, status: "REQUESTED" }];
    }
    if (pathValue === "/rentals/return-pending") {
      return [{ ...rentalFixture, status: "RETURN_PENDING" }];
    }
    if (pathValue === "/rentals/overdue") {
      return [{ ...rentalFixture, id: 13, status: "OVERDUE", dueDate: "2026-04-10" }];
    }
    if (pathValue === "/rentals?status=EXTENSION_REQUESTED") {
      return [{ ...rentalFixture, status: "EXTENSION_REQUESTED" }];
    }
    return [];
  };

  mockState.api.post = async (pathValue) => {
    if (pathValue === "/rentals/request") {
      return { message: "대여 요청 완료", rental: { ...rentalFixture, status: "REQUESTED" } };
    }
    if (pathValue.endsWith("/return-request")) {
      return { message: "반납 요청 완료", rental: { ...rentalFixture, status: "RETURN_PENDING" } };
    }
    if (pathValue.endsWith("/extend-request")) {
      return { message: "연장 요청 완료", rental: { ...rentalFixture, status: "EXTENSION_REQUESTED" } };
    }
    return { ok: true };
  };
  mockState.api.patch = async () => ({ updatedCount: 1 });
  mockState.api.put = async () => ({ ...equipmentFixture, status: "AVAILABLE" });
  mockState.api.request = async () => ({ success: true });

  const loginTree = await renderScreen("screens/auth/LoginScreen.js", {
    navigation: createNavigationMock(),
  });
  renderedScreens.push({ name: "로그인 화면", texts: collectText(loginTree.toJSON()).slice(0, 8) });

  const signupTree = await renderScreen("screens/auth/SignupScreen.js", {
    navigation: createNavigationMock(),
  });
  renderedScreens.push({ name: "회원가입 화면", texts: collectText(signupTree.toJSON()).slice(0, 8) });

  const userNav = createNavigationMock();
  const userHomeTree = await renderScreen("screens/user/UserHomeScreen.js", {
    navigation: userNav,
  });
  renderedScreens.push({ name: "사용자 홈", texts: collectText(userHomeTree.toJSON()).slice(0, 10) });

  const equipmentFormTree = await renderScreen("screens/admin/EquipmentFormScreen.js", {
    navigation: createNavigationMock(),
    route: { params: { equipment: equipmentFixture } },
  });
  renderedScreens.push({ name: "기자재 등록/수정 화면", texts: collectText(equipmentFormTree.toJSON()).slice(0, 16) });

  const equipmentListTree = await renderScreen("screens/user/EquipmentListScreen.js", {
    navigation: createNavigationMock(),
  });
  renderedScreens.push({ name: "기자재 목록", texts: collectText(equipmentListTree.toJSON()).slice(0, 10) });

  const equipmentDetailTree = await renderScreen("screens/user/EquipmentDetailScreen.js", {
    navigation: createNavigationMock(),
    route: { params: { equipmentId: 1 } },
  });
  renderedScreens.push({ name: "기자재 상세", texts: collectText(equipmentDetailTree.toJSON()).slice(0, 12) });

  const qrNavigation = createNavigationMock();
  mockState.alerts.length = 0;
  const qrTree = await renderScreen("screens/user/QRScannerScreen.js", {
    navigation: qrNavigation,
    route: { params: { mode: "rent", equipmentCode: "EQ-LAP-001", allowMockScan: true } },
  });
  const camera = qrTree.root.findByType("CameraView");
  await act(async () => {
    await camera.props.onBarcodeScanned({ data: "EQ-LAP-001" });
    await flush();
  });
  renderedScreens.push({ name: "QR 스캔 화면", texts: collectText(qrTree.toJSON()).slice(0, 12) });

  const qrMismatchNavigation = createNavigationMock();
  mockState.alerts.length = 0;
  const qrMismatchTree = await renderScreen("screens/user/QRScannerScreen.js", {
    navigation: qrMismatchNavigation,
    route: { params: { mode: "rent", equipmentCode: "EQ-LAP-001", allowMockScan: true } },
  });
  const mismatchCamera = qrMismatchTree.root.findByType("CameraView");
  await act(async () => {
    await mismatchCamera.props.onBarcodeScanned({ data: "EQ-LAP-999" });
    await flush();
  });

  const checkoutTree = await renderScreen("screens/user/RentalCheckoutScreen.js", {
    navigation: createNavigationMock(),
    route: { params: { mode: "rent", equipment: equipmentFixture } },
  });
  renderedScreens.push({ name: "대여 상세 화면", texts: collectText(checkoutTree.toJSON()).slice(0, 14) });

  const myRentalsTree = await renderScreen("screens/user/MyRentalsScreen.js", {
    navigation: createNavigationMock(),
  });
  renderedScreens.push({ name: "내 대여 현황", texts: collectText(myRentalsTree.toJSON()).slice(0, 10) });

  const notificationsTree = await renderScreen("screens/shared/NotificationsScreen.js", {
    navigation: createNavigationMock(),
  });
  renderedScreens.push({ name: "알림 화면", texts: collectText(notificationsTree.toJSON()).slice(0, 10) });

  mockState.auth = {
    ...mockState.auth,
    isAdmin: true,
    user: { id: 1, name: "학과 관리자", role: "ADMIN", accountStatus: "APPROVED" },
  };

  const adminDashboardTree = await renderScreen("screens/admin/AdminDashboardScreen.js", {
    navigation: createNavigationMock(),
  });
  renderedScreens.push({ name: "관리자 대시보드", texts: collectText(adminDashboardTree.toJSON()).slice(0, 14) });

  const pendingUsersTree = await renderScreen("screens/admin/PendingUsersScreen.js", {
    navigation: createNavigationMock(),
  });
  renderedScreens.push({ name: "회원 승인 관리", texts: collectText(pendingUsersTree.toJSON()).slice(0, 10) });

  const rentalApprovalsTree = await renderScreen("screens/admin/RentalApprovalsScreen.js", {
    navigation: createNavigationMock(),
  });
  renderedScreens.push({ name: "대여 승인 화면", texts: collectText(rentalApprovalsTree.toJSON()).slice(0, 10) });

  const returnApprovalsTree = await renderScreen("screens/admin/ReturnApprovalsScreen.js", {
    navigation: createNavigationMock(),
  });
  renderedScreens.push({ name: "반납 승인 화면", texts: collectText(returnApprovalsTree.toJSON()).slice(0, 12) });

  const statusManagementTree = await renderScreen("screens/admin/StatusManagementScreen.js", {
    navigation: createNavigationMock(),
  });
  renderedScreens.push({ name: "연체/상태 관리", texts: collectText(statusManagementTree.toJSON()).slice(0, 14) });

  const appNavigatorPath = path.join(srcRoot, "navigation/AppNavigator.js");
  delete require.cache[appNavigatorPath];
  const AppNavigator = require(appNavigatorPath).default;

  mockState.auth = {
    ...mockState.auth,
    isAdmin: false,
    user: { id: 3, name: "김학생", role: "USER", accountStatus: "APPROVED" },
  };
  const userNavigatorTree = renderer.create(React.createElement(AppNavigator));
  const userRoutes = userNavigatorTree.root
    .findAll((node) => node.type === "MockBottomTabScreen" || node.type === "MockStackScreen")
    .map((node) => node.props.name);

  mockState.auth = {
    ...mockState.auth,
    isAdmin: true,
    user: { id: 1, name: "학과 관리자", role: "ADMIN", accountStatus: "APPROVED" },
  };
  const adminNavigatorTree = renderer.create(React.createElement(AppNavigator));
  const adminRoutes = adminNavigatorTree.root
    .findAll((node) => node.type === "MockBottomTabScreen" || node.type === "MockStackScreen")
    .map((node) => node.props.name);

  const result = {
    renderedScreens,
    qrSuccessNavigation: qrNavigation.calls,
    qrMismatchAlerts: mockState.alerts,
    userRoutes,
    adminRoutes,
  };

  console.log(JSON.stringify(result, null, 2));
  process.exit(0);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
