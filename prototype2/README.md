# 스마트 학과 기자재 대여 관리기

React Native + Expo 모바일 앱과 Node.js + Express + MySQL 백엔드로 구성한 학과 기자재 대여 관리 MVP입니다.  
사용자는 회원가입 후 관리자 승인을 받아 로그인할 수 있고, 기자재 상세 화면에서 대여 신청을 시작한 뒤 실제 기자재에 부착된 QR 코드를 스캔해 대여 요청을 진행합니다. 반납은 사용자가 요청만 하고, 관리자가 실물 확인 후 직접 최종 상태를 갱신합니다.

## 1. 프로젝트 구조

```text
New project/
├─ backend/
│  ├─ package.json
│  ├─ .env.example
│  ├─ sql/
│  │  ├─ schema.sql
│  │  └─ seed.sql
│  ├─ uploads/
│  │  ├─ equipment-images/
│  │  ├─ qr-codes/
│  │  └─ student-cards/
│  └─ src/
│     ├─ app.js
│     ├─ server.js
│     ├─ config/
│     │  └─ db.js
│     ├─ controllers/
│     │  ├─ adminUserController.js
│     │  ├─ authController.js
│     │  ├─ equipmentController.js
│     │  ├─ notificationController.js
│     │  └─ rentalController.js
│     ├─ middleware/
│     │  ├─ auth.js
│     │  ├─ errorHandler.js
│     │  └─ upload.js
│     ├─ routes/
│     │  ├─ adminRoutes.js
│     │  ├─ authRoutes.js
│     │  ├─ equipmentRoutes.js
│     │  ├─ notificationRoutes.js
│     │  └─ rentalRoutes.js
│     ├─ services/
│     │  ├─ equipmentService.js
│     │  ├─ notificationService.js
│     │  ├─ rentalService.js
│     │  └─ schedulerService.js
│     └─ utils/
│        ├─ asyncHandler.js
│        ├─ constants.js
│        ├─ crypto.js
│        └─ dates.js
├─ frontend/
│  ├─ package.json
│  ├─ app.json
│  ├─ babel.config.js
│  ├─ .env.example
│  ├─ App.js
│  ├─ scripts/
│  │  └─ ui-flow-check.js
│  └─ src/
│     ├─ api/
│     │  └─ client.js
│     ├─ components/
│     │  ├─ AppButton.js
│     │  ├─ AppInput.js
│     │  ├─ Card.js
│     │  ├─ LoadingView.js
│     │  ├─ Screen.js
│     │  └─ StatusBadge.js
│     ├─ context/
│     │  ├─ AuthContext.js
│     │  └─ NotificationContext.js
│     ├─ hooks/
│     │  ├─ useAuth.js
│     │  └─ useNotifications.js
│     ├─ navigation/
│     │  └─ AppNavigator.js
│     ├─ screens/
│     │  ├─ admin/
│     │  ├─ auth/
│     │  ├─ shared/
│     │  └─ user/
│     ├─ styles/
│     │  └─ theme.js
│     └─ utils/
│        └─ helpers.js
├─ .gitignore
└─ README.md
```

## 2. 구현 범위

### 사용자 기능

- 회원가입: 이름, 학번, 학과, 비밀번호, 학생증 캡처 이미지 업로드
- 로그인: 학번 + 비밀번호, 승인된 계정만 로그인 가능
- 기자재 목록 조회
- 기자재 상세 조회
- QR 스캔으로 기자재 검증
- 대여 요청
- 연장 요청
- 반납 요청
- 내 대여 현황 조회
- 알림 목록 조회 및 읽음 처리

### 관리자 기능

- 승인 대기 회원 조회
- 회원 승인 / 거절
- 기자재 등록 / 수정 / 삭제
- 기자재 사진 업로드 / 수정 / 미리보기
- 기자재 상태 수동 업데이트
- 대여 요청 승인 / 거절
- 연장 요청 승인 / 거절
- 반납 승인 / 점검 필요 / 수리 처리
- 연체 기자재 목록 조회
- 기자재별 QR 확인
- 관리자 알림 조회

## 3. 핵심 흐름

### 회원가입 및 승인

1. 사용자가 학생증 이미지를 포함해 회원가입합니다.
2. `users.account_status` 는 `PENDING` 으로 저장됩니다.
3. 관리자가 승인하면 `APPROVED`, 거절하면 `REJECTED` 로 변경됩니다.
4. `APPROVED` 계정만 로그인할 수 있습니다.

### 대여 흐름

1. 사용자가 기자재 목록과 상세 화면에서 상태를 확인합니다.
2. 상세 화면의 `대여 신청 후 QR 인증` 버튼을 누릅니다.
3. 앱이 모바일 카메라를 열고 QR 코드를 스캔합니다.
4. 스캔한 코드가 현재 선택한 기자재의 `code` 또는 `qr_value` 와 일치하는지 검증합니다.
5. 검증이 성공하면 대여 상세 화면으로 이동합니다.
6. 사용자가 반납 예정일을 입력하고 대여 요청을 제출합니다.
7. 관리자가 승인하면 기자재 상태가 `AVAILABLE -> RENTED` 로 바뀝니다.

### 반납 흐름

1. 사용자가 자신의 대여 중 기자재 상세에서 `QR 인증 후 반납 요청` 을 누릅니다.
2. QR 스캔이 성공하면 반납 요청이 접수되고, 기자재 상태는 `RETURN_PENDING` 이 됩니다.
3. 이 단계에서는 반납 완료가 아닙니다.
4. 관리자가 실물과 구성품을 확인한 뒤 아래 중 하나로 처리합니다.
5. 이상 없음: 기자재 상태 `AVAILABLE`, rental 상태 `RETURNED`
6. 점검 필요: 기자재 상태 `INSPECTION_REQUIRED`
7. 수리 필요: 기자재 상태 `REPAIR`

### 연장 흐름

1. 사용자는 자신의 활성 대여 건에 대해 연장 요청을 보냅니다.
2. 희망 반납일 `requested_due_date` 를 입력합니다.
3. 관리자가 승인하면 `due_date` 가 갱신됩니다.
4. 거절되면 기존 반납일은 유지됩니다.

### 알림 및 연체 흐름

1. 백엔드 스케줄러가 주기적으로 대여 데이터를 검사합니다.
2. 반납 예정 3일 전, 1일 전, 당일에 사용자와 관리자 모두에게 알림을 생성합니다.
3. `due_date` 가 지나면 rental 상태와 equipment 상태를 `OVERDUE` 로 갱신합니다.
4. 중복 생성을 막기 위해 `notifications.dedupe_key` 를 사용합니다.

## 4. 상태값

### 기자재 상태

- `AVAILABLE`
- `RENTAL_PENDING`
- `RENTED`
- `RETURN_PENDING`
- `INSPECTION_REQUIRED`
- `REPAIR`
- `OVERDUE`

### 대여 상태

- `REQUESTED`
- `APPROVED`
- `REJECTED`
- `EXTENSION_REQUESTED`
- `EXTENSION_APPROVED`
- `EXTENSION_REJECTED`
- `RETURN_PENDING`
- `RETURNED`
- `OVERDUE`

### 회원 상태

- `PENDING`
- `APPROVED`
- `REJECTED`

## 5. QR 설계

- 각 기자재는 사람이 읽을 수 있는 고유 코드 `code` 를 가집니다.
- 예시: `EQ-LAP-001`, `EQ-ARD-001`, `EQ-RPI-001`
- `qr_value` 는 기본적으로 `code` 와 같은 값으로 저장합니다.
- QR 안에는 URL이 아니라 기자재 식별 코드 문자열만 담깁니다.
- 앱은 QR 생성이 아니라 QR 스캔과 검증만 담당합니다.
- 서버는 `/api/equipments/:id/qr` 에서 저장된 식별 코드를 바탕으로 QR 이미지(Data URL)를 렌더링합니다.
- `qr_image_path` 컬럼은 추후 파일 저장형 확장용으로 남겨두었습니다.
- 기자재 사진은 `image_path` 로 저장되며, 앱 상세 화면과 관리자 수정 화면에서 미리보기가 가능합니다.

## 6. 데이터베이스

### 스키마 파일

- [schema.sql](/C:/Users/조현민/Documents/New%20project/backend/sql/schema.sql)

### 시드 파일

- [seed.sql](/C:/Users/조현민/Documents/New%20project/backend/sql/seed.sql)

### 주요 테이블

- `users`
- `equipments`
- `rentals`
- `notifications`
- `inspection_logs`
- `admin_action_logs`

### 업로드 폴더 예시

- `backend/uploads/student-cards/`
- `backend/uploads/equipment-images/`
- `backend/uploads/qr-codes/`

### 시드 데이터 요약

- 관리자 2명
- 승인 사용자 2명
- 승인 대기 사용자 1명
- 거절 사용자 1명
- 노트북 10대
- 아두이노 20대
- 라즈베리파이 20대
- 총 50개의 고유 식별 코드
- 대여 요청, 승인, 연장 요청, 반납 대기, 연체 예시 데이터 포함

## 7. 주요 API

### 인증

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/admin/users/pending`
- `POST /api/admin/users/:id/approve`
- `POST /api/admin/users/:id/reject`

### 기자재

- `GET /api/equipments`
- `GET /api/equipments/:id`
- `GET /api/equipments/qr/:value`
- `GET /api/equipments/:id/qr`
- `POST /api/equipments`
- `PUT /api/equipments/:id`
- `PUT /api/equipments/:id/status`
- `DELETE /api/equipments/:id`

관리자 기자재 등록/수정 API는 `multipart/form-data` 로도 호출할 수 있으며, `equipmentImage` 파일 필드를 지원합니다.

### 대여 / 연장 / 반납

- `POST /api/rentals/request`
- `POST /api/rentals/:id/approve`
- `POST /api/rentals/:id/reject`
- `POST /api/rentals/:id/extend-request`
- `POST /api/rentals/:id/approve-extension`
- `POST /api/rentals/:id/reject-extension`
- `POST /api/rentals/:id/return-request`
- `POST /api/rentals/:id/approve-return`
- `POST /api/rentals/:id/mark-inspection`
- `POST /api/rentals/:id/mark-repair`
- `GET /api/rentals`
- `GET /api/rentals/pending`
- `GET /api/rentals/return-pending`
- `GET /api/rentals/overdue`

### 알림

- `GET /api/notifications`
- `PATCH /api/notifications/:id/read`
- `PATCH /api/notifications/read-all`

## 8. 주요 파일 안내

### 백엔드

- [backend/src/controllers/authController.js](/C:/Users/조현민/Documents/New%20project/backend/src/controllers/authController.js)
  회원가입, 로그인, 승인 상태 검증을 처리합니다.

- [backend/src/controllers/adminUserController.js](/C:/Users/조현민/Documents/New%20project/backend/src/controllers/adminUserController.js)
  승인 대기 회원 목록, 승인/거절 처리, 승인 알림 생성을 담당합니다.

- [backend/src/controllers/equipmentController.js](/C:/Users/조현민/Documents/New%20project/backend/src/controllers/equipmentController.js)
  기자재 목록/상세 CRUD와 QR 이미지 응답을 처리합니다.

- [backend/src/services/equipmentService.js](/C:/Users/조현민/Documents/New%20project/backend/src/services/equipmentService.js)
  기자재 상태 검증, QR 코드 조회, 구성품 직렬화/역직렬화를 담당합니다.

- [backend/src/services/rentalService.js](/C:/Users/조현민/Documents/New%20project/backend/src/services/rentalService.js)
  대여 요청, 승인, 연장, 반납, 연체 전이 로직의 중심 서비스입니다.

- [backend/src/services/notificationService.js](/C:/Users/조현민/Documents/New%20project/backend/src/services/notificationService.js)
  사용자/관리자 알림 생성, dedupe 처리, 읽음 처리를 담당합니다.

- [backend/src/services/schedulerService.js](/C:/Users/조현민/Documents/New%20project/backend/src/services/schedulerService.js)
  `node-cron` 기반 반납 예정 알림과 연체 갱신 작업을 등록합니다.

- [backend/src/middleware/upload.js](/C:/Users/조현민/Documents/New%20project/backend/src/middleware/upload.js)
  학생증 캡처 이미지 업로드를 위한 `multer` 설정입니다.

### 모바일 앱

- [frontend/src/navigation/AppNavigator.js](/C:/Users/조현민/Documents/New%20project/frontend/src/navigation/AppNavigator.js)
  로그인 전, 사용자 앱, 관리자 앱을 완전히 다른 구조로 분기합니다.

- [frontend/src/context/AuthContext.js](/C:/Users/조현민/Documents/New%20project/frontend/src/context/AuthContext.js)
  토큰 저장, 로그인, 회원가입, `/auth/me` 동기화를 담당합니다.

- [frontend/src/screens/auth/SignupScreen.js](/C:/Users/조현민/Documents/New%20project/frontend/src/screens/auth/SignupScreen.js)
  학생증 이미지 업로드를 포함한 회원가입 화면입니다.

- [frontend/src/screens/user/EquipmentDetailScreen.js](/C:/Users/조현민/Documents/New%20project/frontend/src/screens/user/EquipmentDetailScreen.js)
  기자재 상태 확인, QR 표시, 대여/연장/반납 진입 버튼을 제공합니다.

- [frontend/src/screens/user/QRScannerScreen.js](/C:/Users/조현민/Documents/New%20project/frontend/src/screens/user/QRScannerScreen.js)
  `expo-camera` 를 이용한 QR 스캔과 코드 검증 흐름을 처리합니다.

- [frontend/src/screens/user/RentalCheckoutScreen.js](/C:/Users/조현민/Documents/New%20project/frontend/src/screens/user/RentalCheckoutScreen.js)
  반납 예정일 입력 후 대여 요청 또는 연장 요청을 제출합니다.

- [frontend/src/screens/admin/PendingUsersScreen.js](/C:/Users/조현민/Documents/New%20project/frontend/src/screens/admin/PendingUsersScreen.js)
  학생증 이미지 미리보기와 회원 승인/거절을 처리합니다.

- [frontend/src/screens/admin/RentalApprovalsScreen.js](/C:/Users/조현민/Documents/New%20project/frontend/src/screens/admin/RentalApprovalsScreen.js)
  대여 요청 승인/거절 목록 화면입니다.

- [frontend/src/screens/admin/ReturnApprovalsScreen.js](/C:/Users/조현민/Documents/New%20project/frontend/src/screens/admin/ReturnApprovalsScreen.js)
  반납 승인, 점검 필요, 수리 처리 화면입니다.

## 9. 환경 변수

### 백엔드

`backend/.env`

```env
PORT=4000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=1234
DB_NAME=smart_equipment_rental
JWT_SECRET=smart-rental-secret
JWT_EXPIRES_IN=8h
PASSWORD_SALT=campus-rental-salt
APP_TIMEZONE=Asia/Seoul
NOTIFICATION_CRON=0 * * * *
```

### 프론트엔드

`frontend/.env`

```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:4000/api
```

실제 휴대폰으로 테스트할 때는 `localhost` 대신 백엔드를 실행 중인 PC의 LAN IP로 바꿔야 합니다.  
예시: `EXPO_PUBLIC_API_BASE_URL=http://192.168.0.25:4000/api`

## 10. 실행 방법

### 1) MySQL 준비

1. MySQL 8.x 이상을 준비합니다.
2. 아래 순서로 스키마와 시드 데이터를 적용합니다.

```sql
SOURCE backend/sql/schema.sql;
SOURCE backend/sql/seed.sql;
```

`seed.sql` 은 `WITH RECURSIVE` 를 사용하므로 MySQL 8 기준을 권장합니다.

### 2) 백엔드 실행

```bash
cd backend
copy .env.example .env
npm install
npm run dev
```

기본 주소: `http://localhost:4000`

### 3) 모바일 앱 실행

```bash
cd frontend
copy .env.example .env
npm install
npx expo start
```

이후 아래 중 하나로 실행합니다.

- Expo Go 앱에서 QR 스캔
- Android 에뮬레이터
- iOS 시뮬레이터

### UI 렌더링 스모크 체크

```bash
cd frontend
npm run ui:check
```

이 스크립트는 주요 화면 렌더링, 사용자/관리자 네비게이션 분리, mock QR 스캔 성공/실패 흐름을 빠르게 점검합니다.

## 11. 테스트 계정

- 관리자: `admin01 / admin1234`
- 관리자: `admin02 / admin5678`
- 사용자: `20240001 / user1234`
- 사용자: `20240002 / user1234`
- 승인 대기: `20240003 / user1234`
- 승인 거절: `20240004 / user1234`

## 12. iOS / Android 테스트 포인트

### 공통

- 로그인 후 role 에 따라 다른 앱 구조로 이동하는지 확인
- 상태 배지가 한글로 정상 표시되는지 확인
- QR 스캔 후 상세 또는 대여 상세 화면으로 이동하는지 확인
- 존재하지 않는 QR 코드 스캔 시 오류 메시지가 표시되는지 확인

### iOS

- 카메라 권한 허용 여부 확인
- 사진 접근 권한 허용 여부 확인
- Safe Area 상단 여백과 하단 탭이 겹치지 않는지 확인

### Android

- 카메라 권한 허용 여부 확인
- 이미지 선택 권한 허용 여부 확인
- 물리 뒤로가기 시 스택 이동이 자연스러운지 확인

## 13. 추천 검증 시나리오

### 회원가입

1. 회원가입 화면에서 모든 필드를 입력합니다.
2. 학생증 이미지 없이 제출하면 오류가 나는지 확인합니다.
3. 가입 후 바로 로그인되지 않고 승인 대기 메시지가 뜨는지 확인합니다.

### 관리자 승인

1. 관리자 계정으로 로그인합니다.
2. 회원 승인 화면에서 학생증 이미지를 확인합니다.
3. 승인 또는 거절 후 목록에서 사라지는지 확인합니다.

### 대여 요청

1. 사용자 계정으로 로그인합니다.
2. 기자재 상세에서 `대여 신청 후 QR 인증` 을 누릅니다.
3. 같은 기자재 QR을 스캔합니다.
4. 대여 상세 화면으로 이동해 반납 예정일을 입력합니다.
5. 요청 후 관리자 승인 목록에 나타나는지 확인합니다.

### 반납 요청

1. 승인된 대여 건이 있는 사용자로 로그인합니다.
2. 상세 화면에서 `QR 인증 후 반납 요청` 을 누릅니다.
3. 같은 기자재 QR을 스캔합니다.
4. 상태가 `RETURN_PENDING` 으로 바뀌는지 확인합니다.
5. 관리자 반납 승인 화면에서 최종 처리하는지 확인합니다.

### 알림

1. 시드의 연체 데이터와 반납 예정 데이터를 확인합니다.
2. 사용자와 관리자 모두 알림 목록에서 해당 알림을 확인합니다.
3. 읽음 처리와 전체 읽음 처리가 되는지 확인합니다.

## 14. 구현상 참고 사항

- 현재 앱은 Expo 공통 코드 중심으로 작성되었습니다.
- QR 이미지는 서버가 기자재 코드 기준으로 렌더링하여 앱에 전달합니다.
- seed용 학생증 이미지 경로는 `backend/uploads/student-cards/` 를 사용합니다.
- 실제 배포 전에는 비밀번호 해시 정책, 파일 저장소, 푸시 알림, 감사 로그 확장 등을 강화하는 것이 좋습니다.

## 15. 이번 정리에서 확인한 사항

- 모바일 앱과 백엔드 API 경로를 일치시켰습니다.
- 회원가입 승인 흐름과 로그인 제한 로직을 맞췄습니다.
- QR에 URL이 아닌 기자재 코드가 들어가도록 정리했습니다.
- 반납이 자동 완료되지 않고 관리자 승인형 흐름으로 유지되도록 확인했습니다.
- 알림 스케줄러가 사용자와 관리자 모두에게 알림을 생성하도록 맞췄습니다.
