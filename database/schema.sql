-- MTalks Platform Database Schema
-- MySQL 8.0+ | Created June 2026
-- Run: mysql -u root -p mtalks_db < schema.sql

CREATE DATABASE IF NOT EXISTS mtalks_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE mtalks_db;

CREATE TABLE users (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(120)  NOT NULL,
  email       VARCHAR(180)  NOT NULL UNIQUE,
  password    VARCHAR(255)  NOT NULL,
  role        ENUM('admin','student') DEFAULT 'student',
  is_verified TINYINT(1)    DEFAULT 0,
  is_active   TINYINT(1)    DEFAULT 1,
  avatar      VARCHAR(300),
  created_at  DATETIME      DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE otp_tokens (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id    INT UNSIGNED NOT NULL,
  token      VARCHAR(10)  NOT NULL,
  type       ENUM('verify_email','reset_password') NOT NULL,
  expires_at DATETIME     NOT NULL,
  used       TINYINT(1)   DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE courses (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title        VARCHAR(200) NOT NULL,
  slug         VARCHAR(220) NOT NULL UNIQUE,
  description  TEXT,
  thumbnail    VARCHAR(300),
  price        DECIMAL(10,2) DEFAULT 0.00,
  is_free      TINYINT(1)    DEFAULT 0,
  is_published TINYINT(1)    DEFAULT 0,
  created_at   DATETIME      DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE modules (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  course_id   INT UNSIGNED NOT NULL,
  title       VARCHAR(200) NOT NULL,
  description TEXT,
  sort_order  SMALLINT     DEFAULT 0,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

CREATE TABLE lessons (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  module_id      INT UNSIGNED NOT NULL,
  title          VARCHAR(200) NOT NULL,
  drive_file_id  VARCHAR(100),
  content        LONGTEXT,
  duration_min   SMALLINT    DEFAULT 0,
  sort_order     SMALLINT    DEFAULT 0,
  FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
);

CREATE TABLE evaluations (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  module_id   INT UNSIGNED NOT NULL,
  title       VARCHAR(200) NOT NULL,
  pass_score  TINYINT      DEFAULT 70,
  FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
);

CREATE TABLE eval_questions (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  evaluation_id  INT UNSIGNED NOT NULL,
  question       TEXT         NOT NULL,
  options        JSON         NOT NULL,
  correct_index  TINYINT      NOT NULL,
  FOREIGN KEY (evaluation_id) REFERENCES evaluations(id) ON DELETE CASCADE
);

CREATE TABLE enrollments (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     INT UNSIGNED NOT NULL,
  course_id   INT UNSIGNED NOT NULL,
  payment_id  INT UNSIGNED,
  enrolled_at DATETIME     DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_enroll (user_id, course_id),
  FOREIGN KEY (user_id)   REFERENCES users(id)   ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

CREATE TABLE lesson_progress (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id      INT UNSIGNED NOT NULL,
  lesson_id    INT UNSIGNED NOT NULL,
  completed_at DATETIME     DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_progress (user_id, lesson_id),
  FOREIGN KEY (user_id)   REFERENCES users(id)   ON DELETE CASCADE,
  FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
);

CREATE TABLE eval_attempts (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id       INT UNSIGNED NOT NULL,
  evaluation_id INT UNSIGNED NOT NULL,
  score         TINYINT      NOT NULL,
  passed        TINYINT(1)   NOT NULL,
  attempted_at  DATETIME     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)       REFERENCES users(id)       ON DELETE CASCADE,
  FOREIGN KEY (evaluation_id) REFERENCES evaluations(id) ON DELETE CASCADE
);

CREATE TABLE events (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title         VARCHAR(200) NOT NULL,
  slug          VARCHAR(220) NOT NULL UNIQUE,
  description   TEXT,
  banner        VARCHAR(300),
  type          ENUM('online','offline') DEFAULT 'online',
  venue         VARCHAR(300),
  meeting_link  VARCHAR(500),
  whatsapp_link VARCHAR(500),
  event_date    DATETIME     NOT NULL,
  deadline      DATETIME     NOT NULL,
  is_published  TINYINT(1)   DEFAULT 0,
  created_at    DATETIME     DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE event_packages (
  id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  event_id             INT UNSIGNED  NOT NULL,
  name                 VARCHAR(100)  NOT NULL,
  description          TEXT,
  price                DECIMAL(10,2) NOT NULL,
  early_bird_price     DECIMAL(10,2),
  early_bird_deadline  DATETIME,
  capacity             SMALLINT      DEFAULT 100,
  perks                JSON,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

CREATE TABLE event_registrations (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id        INT UNSIGNED NOT NULL,
  event_id       INT UNSIGNED NOT NULL,
  package_id     INT UNSIGNED NOT NULL,
  payment_id     INT UNSIGNED,
  ticket_code    VARCHAR(64)  NOT NULL UNIQUE,
  attended_at    DATETIME,
  registered_at  DATETIME     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)    REFERENCES users(id)           ON DELETE CASCADE,
  FOREIGN KEY (event_id)   REFERENCES events(id)          ON DELETE CASCADE,
  FOREIGN KEY (package_id) REFERENCES event_packages(id)  ON DELETE CASCADE
);

CREATE TABLE payments (
  id          INT UNSIGNED  AUTO_INCREMENT PRIMARY KEY,
  user_id     INT UNSIGNED  NOT NULL,
  type        ENUM('course','event') NOT NULL,
  item_id     INT UNSIGNED  NOT NULL,
  amount      DECIMAL(10,2) NOT NULL,
  reference   VARCHAR(100)  NOT NULL UNIQUE,
  status      ENUM('pending','success','failed','refunded') DEFAULT 'pending',
  metadata    JSON,
  paid_at     DATETIME,
  created_at  DATETIME      DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE team_members (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(120) NOT NULL,
  role         VARCHAR(100),
  bio          TEXT,
  photo        VARCHAR(300),
  social_links JSON,
  sort_order   SMALLINT     DEFAULT 0,
  is_active    TINYINT(1)   DEFAULT 1
);

CREATE TABLE testimonials (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  client_name   VARCHAR(120) NOT NULL,
  client_photo  VARCHAR(300),
  content       TEXT         NOT NULL,
  rating        TINYINT      DEFAULT 5,
  source        VARCHAR(50)  DEFAULT 'manual',
  is_published  TINYINT(1)   DEFAULT 0,
  created_at    DATETIME     DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE faqs (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  question     TEXT         NOT NULL,
  answer       TEXT         NOT NULL,
  category     VARCHAR(80)  DEFAULT 'General',
  sort_order   SMALLINT     DEFAULT 0,
  is_published TINYINT(1)   DEFAULT 1
);

CREATE TABLE settings (
  `key`       VARCHAR(80) PRIMARY KEY,
  `value`     TEXT,
  updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE error_logs (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  route      VARCHAR(200),
  message    TEXT,
  stack      LONGTEXT,
  user_id    INT UNSIGNED,
  created_at DATETIME     DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_created (created_at)
);

CREATE TABLE contacts (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  email      VARCHAR(150) NOT NULL,
  subject    VARCHAR(200) NOT NULL,
  message    TEXT NOT NULL,
  is_read    TINYINT(1) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_read (is_read),
  INDEX idx_created (created_at)
);

-- Default settings seed
INSERT INTO settings (`key`, `value`) VALUES
  ('site_name',     'Muhsinah Academy'),
  ('site_tagline',  'Helping Muslim Sisters and Couples Build Stronger, Healthier, and Lasting Relationships.'),
  ('site_email',    'madeenahsanni@gmail.com'),
  ('whatsapp_number', '2348039632700'),
  ('calendly_url',  'https://calendly.com/madeenahsanni'),
  ('instagram_url', ''),
  ('facebook_url',  ''),
  ('twitter_url',   ''),
  ('youtube_url',   '');

CREATE TABLE certificates (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     INT UNSIGNED NOT NULL,
  course_id   INT UNSIGNED NOT NULL,
  cert_code   VARCHAR(20)  NOT NULL UNIQUE,
  issued_at   DATETIME     DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_cert (user_id, course_id),
  FOREIGN KEY (user_id)   REFERENCES users(id)   ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);
