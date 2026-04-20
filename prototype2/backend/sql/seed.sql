USE smart_equipment_rental;
SET NAMES utf8mb4;

INSERT INTO users
  (id, name, student_id, department, password_hash, student_card_image_path, role, account_status, approved_at, approved_by)
VALUES
  (1, '학과 관리자', 'admin01', '컴퓨터공학과', 'ab46f5bf3b09e8f65726206ac34ba0486c7755bd0e582351aebbd83444a5f2f9', 'uploads/student-cards/admin01.png', 'ADMIN', 'APPROVED', CURRENT_TIMESTAMP, NULL);

INSERT INTO users
  (id, name, student_id, department, password_hash, student_card_image_path, role, account_status, approved_at, approved_by)
VALUES
  (2, '부관리자', 'admin02', '컴퓨터공학과', 'ac95b63be56486f20648cb651672a5bd27b75db48fa8e1a610912c84a875a7ba', 'uploads/student-cards/admin02.png', 'ADMIN', 'APPROVED', CURRENT_TIMESTAMP, 1),
  (3, '김학생', '20240001', '컴퓨터공학과', 'c026167c95cb5d1711c9eb6408d70c71e6de5de8ee2cd377873f0f9e26877cf2', 'uploads/student-cards/20240001.png', 'USER', 'APPROVED', CURRENT_TIMESTAMP, 1),
  (4, '이학생', '20240002', '전자공학과', 'c026167c95cb5d1711c9eb6408d70c71e6de5de8ee2cd377873f0f9e26877cf2', 'uploads/student-cards/20240002.png', 'USER', 'APPROVED', CURRENT_TIMESTAMP, 1),
  (5, '박대기', '20240003', '컴퓨터공학과', 'c026167c95cb5d1711c9eb6408d70c71e6de5de8ee2cd377873f0f9e26877cf2', 'uploads/student-cards/20240003.png', 'USER', 'PENDING', NULL, NULL),
  (6, '최거절', '20240004', '산업공학과', 'c026167c95cb5d1711c9eb6408d70c71e6de5de8ee2cd377873f0f9e26877cf2', 'uploads/student-cards/20240004.png', 'USER', 'REJECTED', NULL, 1);

INSERT INTO equipments
  (name, category, code, qr_value, qr_image_path, status, location, components, description)
WITH RECURSIVE seq AS (
  SELECT 1 AS n
  UNION ALL
  SELECT n + 1 FROM seq WHERE n < 10
)
SELECT
  CONCAT('실습용 노트북 ', LPAD(n, 2, '0')),
  '노트북',
  CONCAT('EQ-LAP-', LPAD(n, 3, '0')),
  CONCAT('EQ-LAP-', LPAD(n, 3, '0')),
  NULL,
  'AVAILABLE',
  '학과 사무실 A구역',
  '["노트북 본체","충전기","가방"]',
  '캡스톤 및 수업 대여용 노트북'
FROM seq;

INSERT INTO equipments
  (name, category, code, qr_value, qr_image_path, status, location, components, description)
WITH RECURSIVE seq AS (
  SELECT 1 AS n
  UNION ALL
  SELECT n + 1 FROM seq WHERE n < 20
)
SELECT
  CONCAT('Arduino Kit ', LPAD(n, 2, '0')),
  '아두이노',
  CONCAT('EQ-ARD-', LPAD(n, 3, '0')),
  CONCAT('EQ-ARD-', LPAD(n, 3, '0')),
  NULL,
  'AVAILABLE',
  '실습실 기자재함 B구역',
  '["Arduino Uno","USB 케이블","브레드보드","점퍼선"]',
  '임베디드 실습용 아두이노 세트'
FROM seq;

INSERT INTO equipments
  (name, category, code, qr_value, qr_image_path, status, location, components, description)
WITH RECURSIVE seq AS (
  SELECT 1 AS n
  UNION ALL
  SELECT n + 1 FROM seq WHERE n < 20
)
SELECT
  CONCAT('Raspberry Pi Kit ', LPAD(n, 2, '0')),
  '라즈베리파이',
  CONCAT('EQ-RPI-', LPAD(n, 3, '0')),
  CONCAT('EQ-RPI-', LPAD(n, 3, '0')),
  NULL,
  'AVAILABLE',
  '학과 창고 C구역',
  '["Raspberry Pi 본체","전원 어댑터","HDMI 케이블","SD 카드"]',
  'IoT 및 네트워크 실습용 라즈베리파이 세트'
FROM seq;

INSERT INTO rentals
  (id, user_id, equipment_id, request_date, approval_date, rent_date, due_date, requested_due_date, extension_request_date, extension_approval_date, return_request_date, return_approved_date, status, note, admin_note)
VALUES
  (1, 3, 1, '2026-04-14 09:00:00', NULL, NULL, '2026-04-21', NULL, NULL, NULL, NULL, NULL, 'REQUESTED', '캡스톤 수업 발표 준비', NULL),
  (2, 4, 2, '2026-04-10 10:00:00', '2026-04-10 11:00:00', '2026-04-10 11:00:00', '2026-04-17', NULL, NULL, NULL, NULL, NULL, 'APPROVED', '프로젝트 개발용', '관리자 승인 완료'),
  (3, 3, 3, '2026-04-08 14:00:00', '2026-04-08 14:30:00', '2026-04-08 14:30:00', '2026-04-16', '2026-04-23', '2026-04-13 09:10:00', NULL, NULL, NULL, 'EXTENSION_REQUESTED', '연장 필요', '연장 요청 대기'),
  (4, 4, 4, '2026-04-07 09:20:00', '2026-04-07 10:00:00', '2026-04-07 10:00:00', '2026-04-15', NULL, NULL, NULL, '2026-04-14 17:20:00', NULL, 'RETURN_PENDING', '반납 요청 완료', NULL),
  (5, 3, 5, '2026-04-01 13:00:00', '2026-04-01 14:00:00', '2026-04-01 14:00:00', '2026-04-10', NULL, NULL, NULL, NULL, NULL, 'OVERDUE', '아직 반납 전', '연체 상태');

UPDATE equipments SET status = 'RENTAL_PENDING' WHERE id = 1;
UPDATE equipments SET status = 'RENTED' WHERE id IN (2, 3);
UPDATE equipments SET status = 'RETURN_PENDING' WHERE id = 4;
UPDATE equipments SET status = 'OVERDUE' WHERE id = 5;

INSERT INTO notifications
  (user_id, rental_id, type, title, message, is_read, dedupe_key)
VALUES
  (3, 1, 'APPROVAL', '회원 승인 완료', '관리자 승인이 완료되어 로그인할 수 있습니다.', 0, 'seed-approval-3'),
  (1, 1, 'RENTAL_REQUEST', '새 대여 요청', '김학생 사용자가 실습용 노트북 01 대여를 요청했습니다.', 0, 'seed-rental-request-admin1'),
  (2, 1, 'RENTAL_REQUEST', '새 대여 요청', '김학생 사용자가 실습용 노트북 01 대여를 요청했습니다.', 0, 'seed-rental-request-admin2'),
  (4, 2, 'DUE_3_DAYS', '반납 3일 전 알림', '실습용 노트북 02 기자재 반납 예정일이 3일 남았습니다.', 0, 'seed-due-user4'),
  (1, 5, 'OVERDUE', '연체 기자재 발생', '김학생 사용자의 실습용 노트북 05 기자재가 연체 상태입니다.', 0, 'seed-overdue-admin1');
