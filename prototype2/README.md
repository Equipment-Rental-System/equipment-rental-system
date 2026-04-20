# 스마트 학과 기자재 대여 관리기

컴퓨터공학과 사무실에서 관리하는 기자재를 모바일 앱에서 조회하고, QR 인증을 거쳐 대여/연장/반납 요청까지 처리할 수 있도록 만든 프로젝트입니다.  
프론트엔드는 React Native + Expo, 백엔드는 Node.js + Express, 데이터베이스는 MySQL을 사용합니다.

## 프로젝트 개요

- 사용자 기능: 회원가입, 로그인, 기자재 조회, QR 스캔, 대여 요청, 연장 요청, 반납 요청, 알림 확인
- 관리자 기능: 회원가입 승인/거절, 기자재 CRUD, 대여 승인/거절, 연장 승인/거절, 반납 상태 처리, 현황 조회
- QR 구조: QR에는 URL이 아니라 기자재 고유 코드가 들어가며, 앱은 QR 스캔과 검증만 담당합니다.

## 루트 폴더 구조

최종 프로젝트 루트에는 아래 5개만 보이도록 정리되어 있습니다.

```text
backend
frontend
.gitignore
README.md
start_app.cmd
```

## 폴더 구조 설명

```text
backend/
  scripts/              # Windows 실행/검증 스크립트
  sql/                  # schema.sql, seed.sql
  src/                  # Express API 소스
  uploads/              # 학생증/기자재 이미지/QR 이미지 저장
  .env.example
  package.json

frontend/
  android/              # Expo Android 네이티브 프로젝트
  public/
  scripts/
  src/                  # React Native 화면/컴포넌트
  .env.example
  App.js
  app.json
  package.json
```

## 방법 1: start_app 실행

루트에서 `start_app.cmd`를 더블클릭하거나 아래처럼 실행하면 됩니다.

```powershell
cd "C:\Users\조현민\Documents\New project"
.\start_app.cmd
```

`start_app.cmd`는 내부적으로 `backend\scripts\start-all.ps1`를 호출하며 아래를 순서대로 처리합니다.

- Android SDK / Gradle 환경변수 점검
- 프로젝트 전용 MySQL `127.0.0.1:3307` 확인 및 기동
- 백엔드 서버 실행
- Expo Metro 실행
- Android 에뮬레이터 연결 또는 실행
- `adb reverse` 설정
- 앱 실행 및 기본 검증

참고:

- 관리자 권한은 필요하지 않습니다.
- 첫 화면이 붙기까지 5~20초 정도 걸릴 수 있습니다.

## 방법 2: 수동 실행

`start_app.cmd`가 동작하지 않을 때는 아래 순서로 직접 실행할 수 있습니다.

### 1. MySQL 준비

이 프로젝트는 일반 로컬 MySQL `3306`과 별도로 프로젝트 전용 MySQL `3307`을 사용합니다.  
프로젝트 전용 런타임 데이터와 로그는 실행 시 `C:\gradle-cache\smart-rental-backend` 아래에 자동 구성됩니다.

DB를 처음 적용해야 하면:

```powershell
cd "C:\Users\조현민\Documents\New project\backend"
Get-Content -Raw -Encoding UTF8 .\sql\schema.sql | & "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" --default-character-set=utf8mb4 --protocol=TCP -h 127.0.0.1 -P 3307 -u root
Get-Content -Raw -Encoding UTF8 .\sql\seed.sql | & "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" --default-character-set=utf8mb4 --protocol=TCP -h 127.0.0.1 -P 3307 -u root smart_equipment_rental
```

### 2. backend 실행

```powershell
cd "C:\Users\조현민\Documents\New project\backend"
& "C:\Program Files\nodejs\npm.cmd" install
& "C:\Program Files\nodejs\npm.cmd" start
```

또는 실행 스크립트만 отдельно 쓰려면:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-backend.ps1
```

### 3. frontend 실행

```powershell
cd "C:\Users\조현민\Documents\New project\frontend"
& "C:\Program Files\nodejs\npm.cmd" install
& "C:\Program Files\nodejs\npx.cmd" expo start --dev-client --clear --host localhost
```

### 4. Android 앱 실행

```powershell
cd "C:\Users\조현민\Documents\New project\backend"
powershell -ExecutionPolicy Bypass -File .\scripts\start-android.ps1 -AvdName "Pixel_7_API_35"
```

### 5. 전체 상태 점검

```powershell
cd "C:\Users\조현민\Documents\New project\backend"
powershell -ExecutionPolicy Bypass -File .\scripts\verify-dev-env.ps1
```

## 환경변수 파일 위치

- 백엔드: `backend/.env.example` -> `backend/.env`
- 프론트엔드: `frontend/.env.example` -> `frontend/.env`

백엔드 기본값 예시:

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

프론트엔드 환경변수는 `frontend/.env.example`을 복사해 `frontend/.env`로 만들고 사용합니다.

## QR 관련 구조 설명

- 기자재별 고유 코드 예시: `EQ-LAP-001`, `EQ-ARD-001`, `EQ-RPI-001`
- QR 값은 URL이 아니라 기자재 고유 코드입니다.
- 앱은 QR 생성이 아니라 QR 스캔과 검증만 담당합니다.
- QR 이미지 파일은 `backend/uploads/qr-codes`에 저장됩니다.
- 기자재 이미지 파일은 `backend/uploads/equipment-images`에 저장됩니다.
- 학생증 업로드 파일은 `backend/uploads/student-cards`에 저장됩니다.

## 회원가입 / 승인 / 로그인 흐름

1. 사용자가 회원가입 화면에서 이름, 학번, 학과, 비밀번호, 학생증 이미지를 제출합니다.
2. 계정은 `PENDING` 상태로 저장됩니다.
3. 관리자가 승인하면 `APPROVED`, 거절하면 `REJECTED` 상태가 됩니다.
4. 승인된 계정만 로그인할 수 있습니다.
5. 로그인 화면의 첫 입력란은 `학번 또는 관리자 아이디`를 받도록 구성되어 있어 학생 계정과 관리자 계정 모두 같은 화면에서 로그인할 수 있습니다.

테스트 계정:

- 관리자: `admin01 / admin1234`
- 사용자: `20240001 / user1234`

## 시연 전 확인사항

- Android Studio / Android SDK 설치 여부
- Node.js 설치 여부
- MySQL 8 설치 여부
- 에뮬레이터가 켜져 있거나 연결 가능한 Android 기기가 있는지
- `backend/.env`, `frontend/.env`가 필요한 값으로 설정되어 있는지
- `127.0.0.1:4000`과 `127.0.0.1:8081` 포트가 다른 프로세스와 충돌하지 않는지

## Git에 올리지 말아야 할 파일

- `backend/node_modules`, `frontend/node_modules`
- `frontend/.expo`, 빌드/캐시 산출물
- 로그 파일, 임시 XML/PNG/JSON 산출물
- 업로드 테스트 중 생성된 불필요한 스크린샷/중간 파일
- `.env` 실파일

## Android / iOS 주의사항

- 현재 실행 자동화는 Windows + Android 에뮬레이터 기준으로 정리되어 있습니다.
- PowerShell에서는 `npm`, `npx`보다 `npm.cmd`, `npx.cmd`를 쓰는 편이 안정적입니다.
- Android에서 `Cannot connect to Metro`, `Unable to load script`가 뜨면 보통 Metro 또는 `adb reverse` 문제입니다.
- Android 에뮬레이터에서 한글 입력을 쓰려면 Gboard에 한국어가 추가되어 있어야 합니다.
- iOS는 Expo / React Native 공통 코드 기준으로 작성되어 있지만, 최종 자동 실행 스크립트는 Android 중심입니다.

## 실행 참고 경로

- 전체 자동 실행: `backend/scripts/start-all.ps1`
- 백엔드만 실행: `backend/scripts/start-backend.ps1`
- Metro만 실행: `backend/scripts/start-metro.ps1`
- Android 앱 실행: `backend/scripts/start-android.ps1`
- 상태 검증: `backend/scripts/verify-dev-env.ps1`
