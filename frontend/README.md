# 스마트 학과 기자재 대여 관리기

React Native + Expo 프론트엔드와 Node.js + Express + MySQL 백엔드를 사용하는 기자재 대여 MVP입니다.

## 사용자 테스트 폴더 구조

```text
/
  assets/              # 앱 이미지 리소스
  src/                 # 사용자 앱 화면/서비스 코드
  backend/             # Express 백엔드
  database/            # MySQL schema.sql, seed.sql
  App.js
  app.json
  package.json
  README.md
```

## 실행 순서

1. MySQL을 실행하고 `database/schema.sql`, `database/seed.sql`을 순서대로 적용합니다.
2. `backend/.env.example`을 `backend/.env`로 복사한 뒤 DB 정보를 맞춥니다.
3. 백엔드를 실행합니다.

```powershell
cd backend
npm install
npm start
```

4. 프론트엔드를 실행합니다.

```powershell
cd ..
npm install
npx expo start --android --localhost
```


## 테스트 계정

seed 기준 사용자 계정:

```text
학번: 20240001
비밀번호: user1234
```

## 사용자 기능 흐름

- 로그인 후 기자재 홈/목록을 조회합니다.
- 기자재 대여 탭에서 기자재를 선택하고 QR 인증 화면으로 이동합니다.
- 실물 QR이 없을 때는 테스트용 QR 인증 버튼으로 선택 기자재 코드를 검증할 수 있습니다.
- 인증 성공 후 대여 신청 상세 화면에서 반납 예정일과 요청 메모를 확인하고 대여 신청을 등록합니다.
- 마이페이지에서 내 대여 내역과 알림을 확인합니다.


