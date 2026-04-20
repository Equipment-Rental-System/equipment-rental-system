# 스마트 학과 기자재 대여 관리기

학과 사무실에서 관리하는 기자재를 모바일 앱에서 조회하고, QR 인증을 거쳐 대여/연장/반납 요청까지 처리하는 프로젝트입니다.

- 프론트엔드: React Native + Expo
- 백엔드: Node.js + Express
- 데이터베이스: MySQL
- 핵심 기능: 회원가입, 관리자 승인, 로그인, QR 스캔, 대여/연장/반납, 관리자 승인, 알림 스케줄러

## 루트 폴더 구조

최종 저장소 루트에는 아래 항목만 두는 구성을 기준으로 정리했습니다.

```text
backend
frontend
.gitignore
README.md
start_app.cmd
```

## 상세 폴더 구조

```text
backend/
  scripts/              # Windows 실행 및 검증 스크립트
  sql/                  # schema.sql, seed.sql
  src/                  # Express API 소스
  uploads/
    equipment-images/   # 기자재 사진 업로드 폴더
    qr-codes/           # 사전 생성된 기자재 QR 이미지
    student-cards/      # 학생증 업로드 이미지
  .env.example
  mysql-local.ini
  package.json

frontend/
  android/              # Expo Android 네이티브 프로젝트
  scripts/              # UI 검증 스크립트 등
  src/                  # 화면, 컴포넌트, API 클라이언트
  .env.example
  App.js
  app.json
  package.json
```

## 프로젝트 흐름 요약

### 사용자 흐름

1. 회원가입 시 이름, 학번, 학과, 비밀번호, 학생증 이미지를 제출합니다.
2. 계정은 `PENDING` 상태로 저장됩니다.
3. 관리자가 승인하면 로그인할 수 있습니다.
4. 사용자는 기자재 목록과 상태를 확인합니다.
5. 대여는 기자재 상세에서 버튼을 누른 뒤 QR 스캔을 통과해야 진행됩니다.
6. 연장 요청과 반납 요청도 앱에서 처리합니다.
7. 반납 완료는 자동이 아니라 관리자 실물 확인 후 처리됩니다.

### 관리자 흐름

1. 회원가입 승인 대기 목록을 확인합니다.
2. 승인 또는 거절로 계정 상태를 변경합니다.
3. 기자재 등록, 수정, 삭제, 상태 변경을 수행합니다.
4. 대여 요청 승인/거절, 연장 승인/거절, 반납 승인/점검 필요/수리 처리까지 담당합니다.

## 로그인 계정

로그인 입력란은 학생 계정과 관리자 계정을 모두 받도록 구성되어 있습니다.

- 입력란 라벨: `학번 또는 관리자 아이디`
- 테스트 관리자: `admin01 / admin1234`
- 테스트 사용자: `20240001 / user1234`

## QR 구조

- 기자재 고유 코드 예시: `EQ-LAP-001`, `EQ-ARD-001`, `EQ-RPI-001`
- QR 값에는 URL이 아니라 기자재 고유 코드만 들어갑니다.
- 앱은 QR을 생성하지 않고 스캔 및 검증만 담당합니다.
- 사전 생성된 QR 이미지는 `backend/uploads/qr-codes`에 보관됩니다.

## 방법 1: start_app.cmd로 실행

저장소 루트에서 `start_app.cmd`를 더블클릭하거나 PowerShell에서 실행하면 됩니다.

```powershell
.\start_app.cmd
```

이 런처는 내부적으로 아래를 순서대로 확인합니다.

- Android SDK / Gradle 환경 변수 설정
- 로컬 MySQL 준비 상태 확인
- 백엔드 실행
- Expo Metro 실행
- Android 에뮬레이터 또는 연결 기기 확인
- `adb reverse` 설정
- 앱 실행 및 기본 검증

## 방법 2: 수동 실행

### 1. MySQL 준비

MySQL 8 기준으로 아래 순서로 진행합니다.

1. `backend/.env.example`을 복사해 `backend/.env`를 만듭니다.
2. 데이터베이스를 생성합니다.
3. `backend/sql/schema.sql`을 적용합니다.
4. `backend/sql/seed.sql`을 적용합니다.

예시:

```sql
CREATE DATABASE smart_equipment_rental CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

그 다음 MySQL 클라이언트에서 아래 파일을 순서대로 실행합니다.

- `backend/sql/schema.sql`
- `backend/sql/seed.sql`

### 2. backend 실행

```powershell
cd backend
npm install
npm start
```

또는 전용 스크립트:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-backend.ps1
```

### 3. frontend 실행

```powershell
cd frontend
npm install
npx expo start --dev-client --clear --host localhost
```

### 4. Android 앱 실행

```powershell
cd backend
powershell -ExecutionPolicy Bypass -File .\scripts\start-android.ps1 -AvdName "Pixel_7_API_35"
```

### 5. 개발 환경 검증

```powershell
cd backend
powershell -ExecutionPolicy Bypass -File .\scripts\verify-dev-env.ps1
```

## 환경변수 파일

- 백엔드: `backend/.env.example` -> `backend/.env`
- 프론트엔드: `frontend/.env.example` -> `frontend/.env`

백엔드 예시:

```env
PORT=4000
DB_HOST=127.0.0.1
DB_PORT=3307
DB_USER=root
DB_PASSWORD=
DB_NAME=smart_equipment_rental
JWT_SECRET=smart-rental-secret
JWT_EXPIRES_IN=8h
PASSWORD_SALT=campus-rental-salt
APP_TIMEZONE=Asia/Seoul
NOTIFICATION_CRON=0 * * * *
```

프론트엔드 예시는 `frontend/.env.example`을 참고해 같은 위치에 `frontend/.env`로 생성하면 됩니다.

## 업로드 파일과 정적 자산

- 기자재 사진: `backend/uploads/equipment-images`
- QR 이미지: `backend/uploads/qr-codes`
- 학생증 이미지: `backend/uploads/student-cards`

시연용 샘플 데이터와 QR 이미지는 저장소에 포함해 두는 구성을 권장합니다.

## 시연 전 체크리스트

- Node.js와 npm이 설치되어 있는지
- MySQL 8이 설치되어 있는지
- Android Studio와 Android SDK가 설치되어 있는지
- Android 에뮬레이터가 켜져 있는지
- `backend/.env`, `frontend/.env`가 작성되어 있는지
- 포트 `4000`, `8081`이 다른 프로세스와 충돌하지 않는지

## Android / iOS 참고

- 현재 자동 실행 스크립트는 Windows + Android 에뮬레이터 기준으로 구성되어 있습니다.
- 앱 코드는 React Native + Expo 공통 코드 기준이라 iOS에서도 구조상 동작하도록 작성되어 있습니다.
- 다만 자동 실행 스크립트는 Android 위주이므로, iOS는 Expo 기준으로 별도 실행 확인이 필요합니다.

## Git에 올리지 말아야 할 항목

아래 항목은 저장소에 포함하지 않는 것을 권장합니다.

- `node_modules`
- `.expo`
- `backend/.mysql-runtime`
- `backend/mysql-data`
- 로그 파일
- 캐시 파일
- 개인용 `.env`
- 임시 스크린샷, 임시 XML, 임시 검증 산출물

## 자주 보는 실행 스크립트

- 전체 자동 실행: `backend/scripts/start-all.ps1`
- 백엔드만 실행: `backend/scripts/start-backend.ps1`
- Metro만 실행: `backend/scripts/start-metro.ps1`
- Android 앱 실행: `backend/scripts/start-android.ps1`
- 개발 환경 검증: `backend/scripts/verify-dev-env.ps1`
