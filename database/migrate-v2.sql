-- Migration v2 — run once on existing databases
-- Adds: contacts, certificates, bot_knowledge, gallery_images tables + video_type column

ALTER TABLE lessons ADD COLUMN IF NOT EXISTS video_type ENUM('drive','youtube') DEFAULT 'drive' AFTER drive_file_id;

CREATE TABLE IF NOT EXISTS contacts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL, email VARCHAR(150) NOT NULL,
  subject VARCHAR(200) NOT NULL, message TEXT NOT NULL,
  is_read TINYINT(1) DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS certificates (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL, course_id INT UNSIGNED NOT NULL,
  cert_code VARCHAR(20) NOT NULL UNIQUE, issued_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_cert (user_id, course_id)
);

CREATE TABLE IF NOT EXISTS bot_knowledge (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  topic VARCHAR(150) NOT NULL, keywords VARCHAR(500) NOT NULL,
  answer TEXT NOT NULL, is_active TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS gallery_images (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200), drive_file_id VARCHAR(100) NOT NULL,
  category VARCHAR(100) DEFAULT 'General', sort_order INT DEFAULT 0,
  is_published TINYINT(1) DEFAULT 1, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
