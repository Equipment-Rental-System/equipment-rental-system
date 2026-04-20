SET NAMES utf8mb4;

CREATE DATABASE IF NOT EXISTS smart_equipment_rental
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE smart_equipment_rental;

DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS inspection_logs;
DROP TABLE IF EXISTS admin_action_logs;
DROP TABLE IF EXISTS rentals;
DROP TABLE IF EXISTS equipments;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  student_id VARCHAR(30) NOT NULL UNIQUE,
  department VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  student_card_image_path VARCHAR(255) NOT NULL,
  role ENUM('ADMIN', 'USER') NOT NULL DEFAULT 'USER',
  account_status ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
  approved_at TIMESTAMP NULL DEFAULT NULL,
  approved_by INT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_users_approved_by FOREIGN KEY (approved_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE equipments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  category VARCHAR(60) NOT NULL,
  code VARCHAR(60) NOT NULL UNIQUE,
  qr_value VARCHAR(120) NOT NULL UNIQUE,
  qr_image_path VARCHAR(255) NULL,
  image_path VARCHAR(255) NULL,
  status ENUM(
    'AVAILABLE',
    'RENTAL_PENDING',
    'RENTED',
    'RETURN_PENDING',
    'INSPECTION_REQUIRED',
    'REPAIR',
    'OVERDUE'
  ) NOT NULL DEFAULT 'AVAILABLE',
  location VARCHAR(120) DEFAULT '',
  components TEXT,
  description TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE rentals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  equipment_id INT NOT NULL,
  request_date TIMESTAMP NULL DEFAULT NULL,
  approval_date TIMESTAMP NULL DEFAULT NULL,
  rent_date TIMESTAMP NULL DEFAULT NULL,
  due_date DATE NULL,
  requested_due_date DATE NULL,
  extension_request_date TIMESTAMP NULL DEFAULT NULL,
  extension_approval_date TIMESTAMP NULL DEFAULT NULL,
  return_request_date TIMESTAMP NULL DEFAULT NULL,
  return_approved_date TIMESTAMP NULL DEFAULT NULL,
  status ENUM(
    'REQUESTED',
    'APPROVED',
    'REJECTED',
    'EXTENSION_REQUESTED',
    'EXTENSION_APPROVED',
    'EXTENSION_REJECTED',
    'RETURN_PENDING',
    'RETURNED',
    'OVERDUE'
  ) NOT NULL DEFAULT 'REQUESTED',
  note TEXT,
  admin_note TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_rentals_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_rentals_equipment FOREIGN KEY (equipment_id) REFERENCES equipments(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  rental_id INT NULL,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(120) NOT NULL,
  message TEXT NOT NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  dedupe_key VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_notifications_rental FOREIGN KEY (rental_id) REFERENCES rentals(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE inspection_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  rental_id INT NOT NULL,
  equipment_id INT NOT NULL,
  admin_id INT NOT NULL,
  action VARCHAR(50) NOT NULL,
  note TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_logs_rental FOREIGN KEY (rental_id) REFERENCES rentals(id),
  CONSTRAINT fk_logs_equipment FOREIGN KEY (equipment_id) REFERENCES equipments(id),
  CONSTRAINT fk_logs_admin FOREIGN KEY (admin_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE admin_action_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  admin_id INT NOT NULL,
  rental_id INT NULL,
  equipment_id INT NULL,
  action VARCHAR(60) NOT NULL,
  note TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_admin_actions_admin FOREIGN KEY (admin_id) REFERENCES users(id),
  CONSTRAINT fk_admin_actions_rental FOREIGN KEY (rental_id) REFERENCES rentals(id),
  CONSTRAINT fk_admin_actions_equipment FOREIGN KEY (equipment_id) REFERENCES equipments(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
