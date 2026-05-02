USE equipment_rental;

-- bcrypt hash memo
-- admin1234: $2a$10$nIFzvslYmgfKDwvIb6fL3.ItHUDrW55UEV3aN5vpgMTBs5.Qr2hNq
-- user1234 : $2a$10$KA8/aDFE.zFVJaz4DTkxXe5X2KLCS4C3kPe8Dilt1xEUK.IJ7o.Zq

INSERT INTO users
  (student_id, name, email, password, role, verification_image, approval_status, approved_at, created_at)
VALUES
  ('admin01', '컴퓨터공학과관리자A', 'admin@dongguk.local', '$2a$10$nIFzvslYmgfKDwvIb6fL3.ItHUDrW55UEV3aN5vpgMTBs5.Qr2hNq', 'ADMIN', 'admin_card.png', 'APPROVED', NOW(), NOW()),
  ('20240001', '컴퓨터공학과학생A', 'student01@dongguk.local', '$2a$10$KA8/aDFE.zFVJaz4DTkxXe5X2KLCS4C3kPe8Dilt1xEUK.IJ7o.Zq', 'USER', 'user_card.png', 'APPROVED', NOW(), NOW()),
  ('20240002', '컴퓨터공학과학생B', 'student02@dongguk.local', '$2a$10$KA8/aDFE.zFVJaz4DTkxXe5X2KLCS4C3kPe8Dilt1xEUK.IJ7o.Zq', 'USER', 'user2_card.png', 'APPROVED', NOW(), NOW()),
  ('20249999', '승인대기학생A', 'pending@dongguk.local', '$2a$10$KA8/aDFE.zFVJaz4DTkxXe5X2KLCS4C3kPe8Dilt1xEUK.IJ7o.Zq', 'USER', 'pending_card.png', 'PENDING', NULL, NOW())
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  email = VALUES(email),
  password = VALUES(password),
  role = VALUES(role),
  verification_image = VALUES(verification_image),
  approval_status = VALUES(approval_status),
  approved_at = VALUES(approved_at);

-- QR 값은 URL이 아니라 기자재 고유 코드만 사용한다.
INSERT INTO items
  (item_name, category, qr_code_value, status, created_at, updated_at)
VALUES
  ('아두이노 1번 키트', 'ARDUINO', 'EQ-ARD-001', 'AVAILABLE', NOW(), NOW()),
  ('아두이노 2번 키트', 'ARDUINO', 'EQ-ARD-002', 'AVAILABLE', NOW(), NOW()),
  ('아두이노 3번 키트', 'ARDUINO', 'EQ-ARD-003', 'RENTED', NOW(), NOW()),
  ('아두이노 4번 키트', 'ARDUINO', 'EQ-ARD-004', 'AVAILABLE', NOW(), NOW()),
  ('아두이노 5번 키트', 'ARDUINO', 'EQ-ARD-005', 'BROKEN', NOW(), NOW()),
  ('라즈베리파이 1번 키트', 'RASPBERRY_PI', 'EQ-RPI-001', 'AVAILABLE', NOW(), NOW()),
  ('라즈베리파이 2번 키트', 'RASPBERRY_PI', 'EQ-RPI-002', 'AVAILABLE', NOW(), NOW()),
  ('라즈베리파이 3번 키트', 'RASPBERRY_PI', 'EQ-RPI-003', 'RENTED', NOW(), NOW()),
  ('라즈베리파이 4번 키트', 'RASPBERRY_PI', 'EQ-RPI-004', 'PARTIAL_LOST', NOW(), NOW()),
  ('노트북 예비 1번 기기', 'LAPTOP', 'EQ-LAP-001', 'AVAILABLE', NOW(), NOW()),
  ('맥북 1번 기기', 'LAPTOP', 'EQ-LAP-MAC-001', 'AVAILABLE', NOW(), NOW()),
  ('맥북 2번 기기', 'LAPTOP', 'EQ-LAP-MAC-002', 'RENTED', NOW(), NOW()),
  ('갤럭시북 1번 기기', 'LAPTOP', 'EQ-LAP-GAL-001', 'AVAILABLE', NOW(), NOW()),
  ('갤럭시북 2번 기기', 'LAPTOP', 'EQ-LAP-GAL-002', 'AVAILABLE', NOW(), NOW()),
  ('갤럭시북 3번 기기', 'LAPTOP', 'EQ-LAP-GAL-003', 'AVAILABLE', NOW(), NOW())
ON DUPLICATE KEY UPDATE
  item_name = VALUES(item_name),
  category = VALUES(category),
  status = VALUES(status),
  updated_at = NOW();

INSERT INTO rentals (user_id, item_id, rented_at, due_at, returned_at, status)
SELECT u.user_id, i.item_id, DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_ADD(NOW(), INTERVAL 5 DAY), NULL, 'RENTED'
FROM users u
JOIN items i ON i.qr_code_value = 'EQ-ARD-003'
WHERE u.student_id = '20240001'
  AND NOT EXISTS (
    SELECT 1 FROM rentals r WHERE r.user_id = u.user_id AND r.item_id = i.item_id AND r.status = 'RENTED'
  );

INSERT INTO rentals (user_id, item_id, rented_at, due_at, returned_at, status)
SELECT u.user_id, i.item_id, DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_ADD(NOW(), INTERVAL 2 DAY), NULL, 'RENTED'
FROM users u
JOIN items i ON i.qr_code_value = 'EQ-LAP-MAC-002'
WHERE u.student_id = '20240002'
  AND NOT EXISTS (
    SELECT 1 FROM rentals r WHERE r.user_id = u.user_id AND r.item_id = i.item_id AND r.status = 'RENTED'
  );

INSERT INTO rentals (user_id, item_id, rented_at, due_at, returned_at, status)
SELECT u.user_id, i.item_id, DATE_SUB(NOW(), INTERVAL 7 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY), NULL, 'OVERDUE'
FROM users u
JOIN items i ON i.qr_code_value = 'EQ-RPI-003'
WHERE u.student_id = '20240001'
  AND NOT EXISTS (
    SELECT 1 FROM rentals r WHERE r.user_id = u.user_id AND r.item_id = i.item_id AND r.status = 'OVERDUE'
  );

INSERT INTO notifications
  (user_id, rental_id, type, message, is_read, created_at)
SELECT u.user_id, NULL, 'ACCOUNT_APPROVED', '계정이 승인되었습니다. 이제 로그인할 수 있습니다.', FALSE, NOW()
FROM users u
WHERE u.student_id = '20240001'
  AND NOT EXISTS (
    SELECT 1
    FROM notifications n
    WHERE n.user_id = u.user_id
      AND n.type = 'ACCOUNT_APPROVED'
      AND n.message = '계정이 승인되었습니다. 이제 로그인할 수 있습니다.'
  );

INSERT INTO notifications
  (user_id, rental_id, type, message, is_read, created_at)
SELECT u.user_id, r.rental_id, 'OVERDUE', '라즈베리파이 3번 키트가 연체 상태입니다. 학과 사무실에 반납해주세요.', FALSE, NOW()
FROM users u
JOIN rentals r ON r.user_id = u.user_id
JOIN items i ON r.item_id = i.item_id
WHERE u.student_id = '20240001'
  AND i.qr_code_value = 'EQ-RPI-003'
  AND NOT EXISTS (
    SELECT 1 FROM notifications n WHERE n.user_id = u.user_id AND n.rental_id = r.rental_id AND n.type = 'OVERDUE'
  );
