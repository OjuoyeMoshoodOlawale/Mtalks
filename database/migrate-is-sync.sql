-- ============================================================
-- Migration: add is_sync column to every data table
-- Run ONCE in cPanel phpMyAdmin → SQL tab
-- is_sync = 0 (pending sync), 1 (synced to remote DB)
-- ============================================================

-- Core user / auth tables
ALTER TABLE users              ADD COLUMN IF NOT EXISTS is_sync TINYINT(1) DEFAULT 0 AFTER updated_at;
ALTER TABLE otp_tokens         ADD COLUMN IF NOT EXISTS is_sync TINYINT(1) DEFAULT 0;

-- Course tables
ALTER TABLE courses            ADD COLUMN IF NOT EXISTS is_sync TINYINT(1) DEFAULT 0 AFTER updated_at;
ALTER TABLE modules            ADD COLUMN IF NOT EXISTS is_sync TINYINT(1) DEFAULT 0;
ALTER TABLE lessons            ADD COLUMN IF NOT EXISTS is_sync TINYINT(1) DEFAULT 0;
ALTER TABLE enrollments        ADD COLUMN IF NOT EXISTS is_sync TINYINT(1) DEFAULT 0;
ALTER TABLE lesson_progress    ADD COLUMN IF NOT EXISTS is_sync TINYINT(1) DEFAULT 0;
ALTER TABLE evaluations        ADD COLUMN IF NOT EXISTS is_sync TINYINT(1) DEFAULT 0;
ALTER TABLE eval_questions     ADD COLUMN IF NOT EXISTS is_sync TINYINT(1) DEFAULT 0;
ALTER TABLE eval_attempts      ADD COLUMN IF NOT EXISTS is_sync TINYINT(1) DEFAULT 0;

-- Event tables
ALTER TABLE events             ADD COLUMN IF NOT EXISTS is_sync TINYINT(1) DEFAULT 0 AFTER updated_at;
ALTER TABLE event_packages     ADD COLUMN IF NOT EXISTS is_sync TINYINT(1) DEFAULT 0;
ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS is_sync TINYINT(1) DEFAULT 0;

-- Payments & comms
ALTER TABLE payments           ADD COLUMN IF NOT EXISTS is_sync TINYINT(1) DEFAULT 0;
ALTER TABLE contacts           ADD COLUMN IF NOT EXISTS is_sync TINYINT(1) DEFAULT 0;
ALTER TABLE certificates       ADD COLUMN IF NOT EXISTS is_sync TINYINT(1) DEFAULT 0;
ALTER TABLE email_logs         ADD COLUMN IF NOT EXISTS is_sync TINYINT(1) DEFAULT 0;
ALTER TABLE error_logs         ADD COLUMN IF NOT EXISTS is_sync TINYINT(1) DEFAULT 0;

-- Content tables
ALTER TABLE team_members       ADD COLUMN IF NOT EXISTS is_sync TINYINT(1) DEFAULT 0;
ALTER TABLE testimonials       ADD COLUMN IF NOT EXISTS is_sync TINYINT(1) DEFAULT 0;
ALTER TABLE faqs               ADD COLUMN IF NOT EXISTS is_sync TINYINT(1) DEFAULT 0;
ALTER TABLE settings           ADD COLUMN IF NOT EXISTS is_sync TINYINT(1) DEFAULT 0;
ALTER TABLE gallery_images     ADD COLUMN IF NOT EXISTS is_sync TINYINT(1) DEFAULT 0;
ALTER TABLE bot_knowledge      ADD COLUMN IF NOT EXISTS is_sync TINYINT(1) DEFAULT 0;

-- Sync infrastructure tables
CREATE TABLE IF NOT EXISTS sync_settings (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  remote_host     VARCHAR(200) NOT NULL DEFAULT '',
  remote_port     SMALLINT UNSIGNED DEFAULT 3306,
  remote_user     VARCHAR(100) NOT NULL DEFAULT '',
  remote_password VARCHAR(200) NOT NULL DEFAULT '',
  remote_database VARCHAR(100) NOT NULL DEFAULT '',
  sync_interval   SMALLINT UNSIGNED DEFAULT 30   COMMENT 'minutes between syncs',
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

-- Insert default sync settings row if not present
INSERT IGNORE INTO sync_settings (id) VALUES (1);

-- Add indexes to speed up is_sync queries
ALTER TABLE users              ADD INDEX IF NOT EXISTS idx_sync (is_sync);
ALTER TABLE enrollments        ADD INDEX IF NOT EXISTS idx_sync (is_sync);
ALTER TABLE event_registrations ADD INDEX IF NOT EXISTS idx_sync (is_sync);
ALTER TABLE payments           ADD INDEX IF NOT EXISTS idx_sync (is_sync);
ALTER TABLE email_logs         ADD INDEX IF NOT EXISTS idx_sync (is_sync);
