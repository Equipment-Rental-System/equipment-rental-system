# 스마트 학과 기자재 대여 관리기

React Native + Expo 프론트엔드와 Node.js + Express + MySQL 백엔드를 사용하는 학과 기자재 대여 관리 앱입니다.
`node_modules`, `.env`, 빌드 캐시, 임시 캡처본은 제외되어 있습니다.

## 폴더 구조

```text

  android/            # Android 네이티브 프로젝트 소스
  assets/             # 앱 이미지 자산
  backend/            # Express 백엔드
    uploads/          # 업로드 폴더(.gitkeep만 포함)
    .env.example      # 백엔드 환경변수 예시
    auth.js
    server.js
  database/           # MySQL schema.sql, seed.sql
  docs/               # 동작 메모 / 보고서 초안
  scripts/            # 로컬 실행 보조 스크립트
  src/                # React Native 화면 / 컴포넌트 / API 코드
  .gitignore
  App.js
  app.json
  babel.config.js
  index.js
  metro.config.js
  package.json
  package-lock.json
  README.md
  start_app.cmd
```


## 실행 전 준비

### 1. 백엔드 환경변수 설정

`backend/.env.example`을 복사해서 `backend/.env` 파일을 만든 뒤 값을 맞춰주세요.

예시:

```env
PORT=3000
DB_HOST=127.0.0.1
DB_PORT=3307
DB_USER=root
DB_PASSWORD=
DB_NAME=equipment_rental
JWT_SECRET=change-this-secret
```

### 2. MySQL DB 적용

```powershell
mysql --default-character-set=utf8mb4 -u root < database\schema.sql
mysql --default-character-set=utf8mb4 -u root equipment_rental < database\seed.sql
```

## 실행 방법

### 방법 1. 수동 실행

백엔드 실행:

```powershell
cd backend
npm install
npm start
```

프론트엔드 실행:

```powershell
cd ..
npm install
npx expo start
```

### 방법 2. Windows 통합 실행

아래 파일은 Windows 로컬 환경에서 한 번에 실행할 때 사용합니다.

```powershell
.\start_app.cmd
```

주의:

- 이 스크립트는 현재 PC의 MySQL, Android SDK, Emulator 경로가 맞아야 정상 동작합니다.
- 다른 팀원 PC에서는 경로가 다르면 직접 실행 방식으로 돌리는 것이 더 안전합니다.

## 팀원 실행 검증 시 환경별 설정

팀원마다 테스트 환경이 다르면 세팅해야 하는 항목이 조금씩 다릅니다.

핵심 수정 파일:

- `src/constants/appConstants.js`

기본 예시:

```js
const API_BASES = [
  "http://10.0.2.2:3000/api",
  "http://127.0.0.1:3000/api",
];
```

### 1. Android Emulator에서 실행하는 경우

사용 주소:

```js
"http://10.0.2.2:3000/api"
```

설명:

- `10.0.2.2`는 Android Emulator 내부에서 내 PC의 `localhost`를 가리키는 특수 주소입니다.
- Android Studio 에뮬레이터를 쓰는 팀원은 이 값을 우선 사용하면 됩니다.

### 2. 같은 PC에서만 로컬 테스트하는 경우

사용 주소:

```js
"http://127.0.0.1:3000/api"
```

설명:

- 백엔드와 프론트가 같은 컴퓨터에서 실행될 때 사용하는 주소입니다.
- 에뮬레이터가 아니라 브라우저/같은 머신 기준 테스트일 때 적합합니다.

### 3. 실제 안드로이드 폰 + Expo Go로 테스트하는 경우

사용 주소:

```js
"http://내PC내부IP:3000/api"
```

예시:

```js
const API_BASES = [
  "http://192.168.0.15:3000/api",
];
```

필수 조건:

- 휴대폰과 백엔드가 켜진 PC가 같은 와이파이에 연결되어 있어야 합니다.
- PC 방화벽에서 3000 포트를 막고 있으면 연결되지 않을 수 있습니다.

PC 내부 IP 확인:

```powershell
ipconfig
```

### 4. 아이폰 + Expo Go로 테스트하는 경우

아이폰도 실제 폰 테스트이므로 주소 설정은 안드로이드 실기기와 동일합니다.

사용 주소:

```js
"http://내PC내부IP:3000/api"
```

주의:

- `127.0.0.1`을 쓰면 아이폰 자기 자신을 가리키기 때문에 백엔드에 연결되지 않습니다.
- 아이폰과 PC가 같은 와이파이에 있어야 합니다.
- `android` 폴더가 없어도 Expo Go 실행 자체는 가능하지만, 현재 저장소에는 안드로이드 네이티브 소스도 함께 포함되어 있습니다.

### 5. Android Studio / 네이티브 실행까지 확인하려는 경우

필요한 것:

- `android` 폴더 유지
- Android Studio 설치
- SDK / emulator 설정

이 경우에는:

- 에뮬레이터 테스트: `10.0.2.2`
- 실기기 테스트: `내PC내부IP`

를 구분해서 써야 합니다.

### 6. 배포 서버로 연결하는 경우

사용 주소:

```js
"https://배포도메인/api"
```

예시:

```js
const API_BASES = [
  "https://your-server-domain.com/api",
];
```

## 환경별 빠른 체크리스트

### Android Emulator를 쓰는 경우

1. MySQL 실행
2. `schema.sql`, `seed.sql` 적용
3. `backend/.env` 생성
4. `backend`에서 `npm install`, `npm start`
5. 루트에서 `npm install`, `npx expo start`
6. `src/constants/appConstants.js`에 `10.0.2.2` 사용

### 아이폰 Expo Go를 쓰는 경우

1. MySQL 실행
2. `schema.sql`, `seed.sql` 적용
3. `backend/.env` 생성
4. `backend`에서 `npm install`, `npm start`
5. 루트에서 `npm install`, `npx expo start`
6. `src/constants/appConstants.js`에 `내PC내부IP` 사용
7. 아이폰과 PC를 같은 와이파이에 연결

### 안드로이드 실기기 Expo Go를 쓰는 경우

1. MySQL 실행
2. `schema.sql`, `seed.sql` 적용
3. `backend/.env` 생성
4. `backend`에서 `npm install`, `npm start`
5. 루트에서 `npm install`, `npx expo start`
6. `src/constants/appConstants.js`에 `내PC내부IP` 사용
7. 휴대폰과 PC를 같은 와이파이에 연결

## 테스트 계정

`database/seed.sql` 기준:

```text
관리자: admin01 / admin1234
사용자: 20240001 / user1234
승인대기: 20249999 / user1234
```

## 어플리케이션 동작 메커니즘

### 사용자 관점 메커니즘

#### 1. 회원가입

1. 사용자가 이름, 학번, 이메일, 비밀번호, 학생증 이미지를 입력합니다.
2. 프론트엔드는 `src/services/api.js`의 `signupAgainstBackend()`를 통해 `POST /api/signup` 요청을 `multipart/form-data`로 보냅니다.
3. 백엔드 `backend/server.js`는 `multer`로 학생증 이미지를 `backend/uploads`에 저장합니다.
4. 비밀번호는 해시 처리 후 `users` 테이블에 저장됩니다.
5. 가입 직후 계정 상태는 `PENDING`이며, 관리자가 승인해야 로그인할 수 있습니다.

#### 2. 로그인

1. 사용자가 로그인 화면에서 학번 또는 관리자 아이디와 비밀번호를 입력합니다.
2. 프론트엔드는 `loginAgainstBackend()`를 통해 `POST /api/login` 요청을 보냅니다.
3. 백엔드는 `users` 테이블에서 `student_id` 기준으로 사용자를 조회합니다.
4. 비밀번호는 bcrypt 비교로 검증하고, 승인 상태가 `APPROVED`인지 확인합니다.
5. 성공하면 JWT 토큰과 사용자 역할(`USER` / `ADMIN`)을 응답합니다.
6. 프론트엔드는 이 토큰을 저장하고, 역할에 따라 사용자 화면 또는 관리자 화면으로 분기합니다.

#### 3. 기자재 목록 조회

1. 사용자가 홈 또는 기자재 목록 화면에 들어가면 프론트엔드는 `fetchEquipments()`를 호출합니다.
2. 이 함수는 백엔드의 카테고리별 기자재 조회 API를 순차적으로 시도합니다.
   - `GET /api/get-aduino`
   - `GET /api/get-raspberryPi`
   - `GET /api/get-laptop`
3. 백엔드는 `items` 테이블에서 카테고리별 데이터를 조회합니다.
4. 프론트는 받은 데이터를 하나의 리스트로 합친 뒤 카드 UI로 표시합니다.

#### 4. QR 인증

1. 사용자가 기자재를 선택하고 QR 스캔 화면으로 이동합니다.
2. 스캔된 QR 값은 `verifyQrScan()`을 통해 백엔드로 전달됩니다.
3. 프론트는 먼저 `POST /api/qr-scan`을 시도하고, 필요하면 QR 조회용 GET 라우트도 순차적으로 시도합니다.
4. 백엔드는 `items.qr_code_value`와 스캔값을 비교합니다.
5. 일치하는 기자재가 있으면 해당 기자재 정보를 반환하고, 프론트는 대여 상세 화면으로 이동시킵니다.

#### 5. 대여 요청

1. 사용자가 반납 예정일과 요청 메모를 입력하고 대여 요청 버튼을 누릅니다.
2. 프론트엔드는 `createRentalRequest()`를 통해 `POST /api/rentals` 요청을 보냅니다.
3. 요청 바디에는 기자재 ID, 반납 예정일, 메모가 포함됩니다.
4. 백엔드는 현재 기자재 상태를 확인합니다.
5. 대여 가능한 경우 `rentals` 테이블에 새 대여 요청을 저장하고, 필요 상태를 업데이트합니다.
6. 프론트는 성공 메시지를 띄우고 내 대여 내역에서 확인할 수 있게 합니다.

#### 6. 내 대여 내역 조회

1. 사용자가 마이페이지 또는 대여 내역 화면에 들어갑니다.
2. 프론트엔드는 `fetchRentals()`를 통해 `GET /api/rentals` 요청을 보냅니다.
3. 백엔드는 로그인한 사용자의 대여 기록을 `rentals` 테이블에서 조회합니다.
4. 프론트는 상태, 반납 예정일, 기자재명 등을 정리해서 표시합니다.

#### 7. 알림 조회 및 읽음 처리

1. 사용자가 알림 목록을 열면 프론트엔드는 `fetchNotifications()`를 호출합니다.
2. 이 함수는 `GET /api/notification` 요청으로 알림 데이터를 받아옵니다.
3. 백엔드는 `notifications` 테이블에서 현재 사용자 알림을 조회합니다.
4. 사용자가 알림을 읽으면 프론트는 `markNotificationRead()`를 통해 `PUT /api/notification/read/:id` 요청을 보냅니다.
5. 백엔드는 해당 알림의 `is_read` 값을 갱신합니다.

### 관리자 관점 메커니즘

#### 1. 관리자 로그인

1. 관리자는 로그인 화면에서 관리자 계정으로 로그인합니다.
2. 로그인 과정 자체는 사용자와 동일하게 `POST /api/login`을 사용합니다.
3. 차이는 백엔드가 반환한 `role` 값이 `ADMIN`이라는 점입니다.
4. 프론트는 이 역할 값을 보고 관리자 전용 화면으로 이동시킵니다.

#### 2. 회원가입 승인 / 거절

1. 관리자는 대기 사용자 목록을 `GET /api/admin/pending-users` 또는 관련 관리자 API로 조회합니다.
2. 승인 시 `PUT /api/admin/approve/:id`, 거절 시 `PUT /api/admin/reject/:id` 요청이 발생합니다.
3. 백엔드는 `users` 테이블의 `approval_status`를 갱신합니다.
4. 승인된 사용자는 이후 정상 로그인 가능 상태가 됩니다.

#### 3. 관리자 대시보드 조회

1. 관리자 화면 진입 시 프론트는 `fetchAdminDashboard()`를 호출합니다.
2. 백엔드는 `GET /api/admin/dashboard`로 대기 회원 수, 기자재 수, 최근 활동 등의 요약 데이터를 반환합니다.
3. 프론트는 이를 카드 형태로 표시합니다.

#### 4. 기자재 관리

1. 관리자는 기자재 목록을 `GET /api/admin/items`로 조회합니다.
2. 기자재 수정 시 프론트는 `updateAdminItem()`을 통해 `PUT /api/admin/update-item/:id` 요청을 보냅니다.
3. 백엔드는 `items` 테이블의 이름, 상태, QR 코드, 설명 등 값을 갱신합니다.
4. 관리자 화면은 수정된 값을 다시 불러와 목록과 상세에 반영합니다.

#### 5. 대여 현황 / 반납 처리

1. 관리자는 대여 현황을 `GET /api/admin/rentals`로 조회합니다.
2. 반납 처리 시 프론트는 `completeAdminReturn()`을 통해 `PUT /api/admin/return/:rentalId` 요청을 보냅니다.
3. 백엔드는 `rentals` 상태를 변경하고, 정상 반납이면 `items.status`를 `AVAILABLE`로 되돌립니다.
4. 파손 또는 분실 이슈가 있으면 `item_issue_log`에 기록하고 상태를 같이 반영합니다.

#### 6. 이슈 로그 조회

1. 관리자는 `GET /api/admin/issues`로 파손, 분실, 부분 분실 이슈 기록을 조회합니다.
2. 백엔드는 `item_issue_log`와 관련 기자재 정보를 묶어서 반환합니다.
3. 프론트는 이를 이슈 관리 섹션에 표시합니다.

### 전체 연결 구조 요약

- 프론트엔드: `src/screens/*`, `src/services/api.js`
- API 주소 관리: `src/constants/appConstants.js`
- 백엔드 라우트: `backend/server.js`
- 인증 미들웨어: `backend/auth.js`
- 사용자 데이터: `users` 테이블
- 기자재 데이터: `items` 테이블
- 대여 데이터: `rentals` 테이블
- 알림 데이터: `notifications` 테이블
- 이슈 로그 데이터: `item_issue_log` 테이블


