USE equipment_rental;

INSERT INTO users
  (student_id, name, email, password, role, verification_image, approval_status, approved_at, created_at)
VALUES
  ('admin01', 'Admin User', 'admin@equip.local', '$2a$10$nIFzvslYmgfKDwvIb6fL3.ItHUDrW55UEV3aN5vpgMTBs5.Qr2hNq', 'ADMIN', 'admin_card.png', 'APPROVED', NOW(), NOW()),
  ('20240001', 'Student User', 'user@equip.local', '$2a$10$KA8/aDFE.zFVJaz4DTkxXe5X2KLCS4C3kPe8Dilt1xEUK.IJ7o.Zq', 'USER', 'user_card.png', 'APPROVED', NOW(), NOW()),
  ('20249999', 'Pending User', 'pending@equip.local', '$2a$10$KA8/aDFE.zFVJaz4DTkxXe5X2KLCS4C3kPe8Dilt1xEUK.IJ7o.Zq', 'USER', 'pending_card.png', 'PENDING', NULL, NOW())
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  email = VALUES(email),
  password = VALUES(password),
  role = VALUES(role),
  verification_image = VALUES(verification_image),
  approval_status = VALUES(approval_status),
  approved_at = VALUES(approved_at);

INSERT INTO items
  (item_name, category, qr_code_value, status, created_at, updated_at)
VALUES
  ('Arduino Kit', 'ARDUINO', 'EQ-ARD-001', 'AVAILABLE', NOW(), NOW()),
  ('Raspberry Pi Kit', 'RASPBERRY_PI', 'EQ-RPI-001', 'AVAILABLE', NOW(), NOW()),
  ('Laptop', 'LAPTOP', 'EQ-LAP-001', 'AVAILABLE', NOW(), NOW())
ON DUPLICATE KEY UPDATE
  item_name = VALUES(item_name),
  category = VALUES(category),
  status = VALUES(status),
  updated_at = NOW();

INSERT INTO notifications
  (user_id, rental_id, type, message, is_read, created_at)
SELECT u.user_id, NULL, 'ACCOUNT_APPROVED', 'Your account has been approved. You can now sign in.', FALSE, NOW()
FROM users u
WHERE u.student_id = '20240001'
  AND NOT EXISTS (
    SELECT 1
    FROM notifications n
    WHERE n.user_id = u.user_id
      AND n.type = 'ACCOUNT_APPROVED'
      AND n.message = 'Your account has been approved. You can now sign in.'
  );
