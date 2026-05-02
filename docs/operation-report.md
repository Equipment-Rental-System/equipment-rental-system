# 작동 메커니즘 및 검증 보고서

## 1. 전체 구조

이 프로젝트는 React Native + Expo 프론트엔드, Node.js + Express 백엔드, MySQL 데이터베이스로 구성된다.

- 프론트엔드: `src` 폴더의 화면, 컴포넌트, API 서비스 코드
- 백엔드: `backend/server.js`, `backend/auth.js`
- 데이터베이스: `database/schema.sql`, `database/seed.sql`
- 이미지 리소스: `assets`

## 2. 로그인 흐름

1. 사용자가 앱 로그인 화면에서 학번 또는 관리자 아이디와 비밀번호를 입력한다.
2. 앱은 `POST /api/login`으로 `{ studentId, password }`를 전송한다.
3. 백엔드는 `users.student_id`로 사용자를 찾는다.
4. bcrypt로 비밀번호를 검증한다.
5. `approval_status`가 `APPROVED`가 아니면 로그인을 차단한다.
6. 성공 시 JWT token과 사용자 정보를 반환한다.
7. 앱은 `role=USER`면 사용자 화면, `role=ADMIN`이면 관리자 화면으로 분기한다.

## 3. 회원가입 흐름

1. 사용자는 학번, 이름, 이메일, 비밀번호, 학생증 이미지를 입력한다.
2. 앱은 `POST /api/signup`으로 multipart/form-data 요청을 보낸다.
3. 백엔드는 이미지를 `backend/uploads`에 저장한다.
4. 비밀번호는 bcrypt hash로 변환되어 DB에 저장된다.
5. 계정은 `PENDING` 상태로 저장된다.
6. 관리자가 승인하면 `APPROVED`, 거절하면 `REJECTED`가 된다.

## 4. 사용자 기자재 조회 흐름

1. 사용자가 로그인하면 앱은 카테고리별 기자재 API를 호출한다.
2. 호출 API는 `GET /api/get-aduino`, `GET /api/get-raspberryPi`, `GET /api/get-laptop`이다.
3. 백엔드는 `items` 테이블의 기자재 정보를 반환한다.
4. 앱은 카테고리, 상태, QR 코드값, 이미지 정보를 정규화해 화면에 표시한다.
5. 현재 스키마에는 설명/구성품 컬럼이 없으므로 앱은 기자재명과 QR 코드를 기반으로 보관 위치, 구성품, 설명을 보강해 표시한다.

## 5. QR 인증 및 대여 신청 흐름

1. 사용자는 기자재 목록에서 대여할 기자재를 선택한다.
2. 앱은 QR 스캔 화면을 연다.
3. QR 값은 URL이 아니라 `EQ-ARD-001` 같은 기자재 고유 코드다.
4. 앱은 `POST /api/qr-scan`으로 선택 기자재 ID와 스캔한 QR 값을 전송한다.
5. 백엔드는 선택 기자재의 `qr_code_value`와 스캔값을 비교한다.
6. 일치하면 앱은 대여 상세 화면으로 이동한다.
7. 반납 예정일과 요청 메모를 입력하고 `POST /api/rentals`로 대여 신청을 등록한다.

## 6. 마이페이지 흐름

1. 앱은 `GET /api/rentals`로 내 대여 내역을 조회한다.
2. 앱은 `GET /api/notification`으로 알림을 조회한다.
3. 알림 읽음 처리는 `PUT /api/notification/read/:id`를 호출한다.

## 7. 관리자 대시보드 흐름

1. 관리자 로그인 시 앱은 관리자 대시보드로 이동한다.
2. 대시보드는 `GET /api/admin/dashboard`, `GET /api/admin/pending-users`, `GET /api/admin/rentals`를 호출한다.
3. 승인 대기 유저 수, 대여 중 기자재 수, 최근 활동을 표시한다.

## 8. 관리자 회원 승인 흐름

1. 회원승인 탭은 `GET /api/admin/pending-users`를 호출한다.
2. 승인 버튼은 `PUT /api/admin/approve/:id`를 호출한다.
3. 거절 버튼은 `PUT /api/admin/reject/:id`를 호출한다.
4. 백엔드는 계정 상태를 변경하고 알림을 생성한다.

## 9. 관리자 기자재/대여/이슈 관리 흐름

1. 기자재 탭은 `GET /api/admin/items`로 기자재 목록을 가져온다.
2. 상태 변경은 `PUT /api/admin/update-item/:id`로 처리한다.
3. QR 확인은 `GET /api/admin/items/:id/qr`로 처리하며, 백엔드는 `qrcode.toDataURL()`로 QR 이미지를 생성한다.
4. 대여 탭은 `GET /api/admin/rentals`로 대여 현황을 가져온다.
5. 반납 처리는 `PUT /api/admin/return/:rentalId`로 처리한다.
6. 파손/분실/일부 분실은 `item_issue_log`에 기록된다.
7. 이슈 탭은 `GET /api/admin/issues`로 이슈 로그를 표시한다.

## 10. 발표용 seed 데이터

`schema.sql`은 테이블 구조만 만들고, 실제 계정/기자재/QR/샘플 대여 데이터는 `seed.sql`에 넣는다.

- 아두이노 1~5번 키트: `EQ-ARD-001` ~ `EQ-ARD-005`
- 라즈베리파이 1~4번 키트: `EQ-RPI-001` ~ `EQ-RPI-004`
- 맥북 1~2번 기기: `EQ-LAP-MAC-001` ~ `EQ-LAP-MAC-002`
- 갤럭시북 1~3번 기기: `EQ-LAP-GAL-001` ~ `EQ-LAP-GAL-003`

QR 값은 URL이 아니라 위와 같은 기자재 고유 코드만 저장한다.

## 11. 검증 기준

최종 검증 시 확인해야 하는 항목은 다음과 같다.

- 백엔드 서버 실행
- MySQL 연결
- 사용자 로그인
- 관리자 로그인
- 사용자 기자재 조회
- QR 인증 화면 이동
- QR 이미지 생성 API
- 대여 상세 화면 이동
- 관리자 대시보드 렌더링
- 회원승인 탭 렌더링
- 기자재 관리 탭 렌더링
- 대여/반납 탭 렌더링
- 이슈 로그 탭 렌더링
- Expo 번들 생성
- Android release APK 빌드

## 12. 알려진 환경 차이

- Expo Go로 실행할 때는 PC와 휴대폰이 같은 네트워크에 있어야 한다.
- Android Emulator에서 `127.0.0.1`은 에뮬레이터 내부를 뜻하므로 앱은 자동으로 `10.0.2.2:3000` 후보도 함께 시도한다.
- 팀원 MySQL 포트가 3306이면 `backend/.env`의 `DB_PORT`를 3306으로 바꿔야 한다.
