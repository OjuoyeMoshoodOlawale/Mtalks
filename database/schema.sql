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
  video_type     ENUM('drive','youtube') DEFAULT 'drive',
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
  delivery_mode ENUM('physical','online_meeting','whatsapp','hybrid') NOT NULL DEFAULT 'online_meeting',
  venue         VARCHAR(300),
  meeting_link  VARCHAR(500),
  whatsapp_link VARCHAR(500),
  event_date    DATETIME     NOT NULL,
  deadline      DATETIME     NOT NULL,
  currency      ENUM('NGN','USD') NOT NULL DEFAULT 'NGN',
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
  user_id     INT UNSIGNED  NULL,     -- NULL for guest checkouts
  guest_name  VARCHAR(100)  NULL,
  guest_email VARCHAR(150)  NULL,
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

CREATE TABLE bot_knowledge (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  topic      VARCHAR(150) NOT NULL,
  keywords   VARCHAR(500) NOT NULL,    -- comma-separated trigger words
  answer     TEXT         NOT NULL,
  is_active  TINYINT(1)   DEFAULT 1,
  created_at DATETIME     DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_active (is_active)
);

-- Muzzamil starter knowledge
INSERT INTO bot_knowledge (topic, keywords, answer) VALUES
('Greeting', 'hello,hi,salam,assalamu,hey,good morning,good afternoon,good evening',
 'Wa alaikum salam! 🌿 I''m Muzzamil, your Muhsinah Academy assistant. I can help you with courses, events, consultations, payments, and more. What would you like to know?'),
('Courses', 'course,courses,learn,lesson,class,study,enrol,enroll',
 'We offer self-paced online courses on marriage, relationships, and personal growth — some free, some paid. Browse them at the Courses page. Once enrolled, you get lifetime access and learn at your own pace!'),
('Events', 'event,events,summit,retreat,workshop,ticket,seminar',
 'We host live events like the Muhsinah Marriage Summit and Couples'' Retreats. Check the Events page for upcoming dates, packages, and early-bird prices. Your QR ticket is emailed instantly after payment.'),
('Consultation', 'consult,consultation,session,booking,book,appointment,coach,one on one,private',
 'You can book a private, confidential session with Coach Madinah Sanni from the Consultation page. Sessions are 60 minutes via video call. Both individual and couples sessions are available.'),
('Payment', 'pay,payment,paystack,card,transfer,price,cost,fee,naira,refund',
 'We accept all Nigerian cards and bank transfers via Paystack — fully secure. Paid courses come with a 7-day satisfaction guarantee. Event tickets are non-refundable but transferable up to 48 hours before the event.'),
('Certificates', 'certificate,cert,completion,award',
 'Complete 100% of a course''s lessons and you can claim a verified certificate of completion! Each certificate has a unique code anyone can verify on our website.'),
('Contact', 'contact,email,phone,whatsapp,reach,support,help,talk to human,human',
 'You can reach our team via the Contact page, or send a WhatsApp message using the button there. For private matters, email us and we''ll respond within 24 hours insha''Allah.'),
('About', 'about,who,madinah,sanni,founder,academy,muhsinah',
 'Muhsinah Academy was founded by Coach Madinah Sanni, a certified life and marriage coach with over 10 years of experience helping Muslim sisters and couples build stronger relationships. Learn more on our About page!');

CREATE TABLE gallery_images (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title         VARCHAR(200),
  drive_file_id VARCHAR(100) NOT NULL,    -- Google Drive image file ID
  category      VARCHAR(100) DEFAULT 'General',
  sort_order    INT DEFAULT 0,
  is_published  TINYINT(1) DEFAULT 1,
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_published (is_published, sort_order)
);

CREATE TABLE IF NOT EXISTS email_logs (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  to_email   VARCHAR(150) NOT NULL,
  subject    VARCHAR(200),
  type       VARCHAR(50),
  status     ENUM('sent','failed') DEFAULT 'sent',
  error      TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email (to_email),
  INDEX idx_status (status),
  INDEX idx_created (created_at)
);

/* ── Remote Sync Infrastructure ─────────────────────────────────────────── */
CREATE TABLE IF NOT EXISTS sync_settings (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  remote_host     VARCHAR(200) NOT NULL DEFAULT '',
  remote_port     SMALLINT UNSIGNED DEFAULT 3306,
  remote_user     VARCHAR(100) NOT NULL DEFAULT '',
  remote_password VARCHAR(200) NOT NULL DEFAULT '',
  remote_database VARCHAR(100) NOT NULL DEFAULT '',
  sync_interval   SMALLINT UNSIGNED DEFAULT 30,
  sync_enabled    TINYINT(1) DEFAULT 0,
  last_synced_at  DATETIME,
  last_sync_status ENUM('success','failed','never') DEFAULT 'never',
  last_sync_error TEXT,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sync_logs (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  started_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  finished_at   DATETIME,
  tables_synced SMALLINT DEFAULT 0,
  rows_synced   INT DEFAULT 0,
  rows_failed   INT DEFAULT 0,
  status        ENUM('running','success','failed','partial') DEFAULT 'running',
  error         TEXT,
  details       JSON
);
