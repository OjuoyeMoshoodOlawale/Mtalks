-- ============================================================
-- Migration: add delivery_mode + currency to events table
-- Run ONCE on cPanel via phpMyAdmin → SQL tab
-- ============================================================

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS delivery_mode ENUM('physical','online_meeting','whatsapp','hybrid')
      NOT NULL DEFAULT 'online_meeting' AFTER type,
  ADD COLUMN IF NOT EXISTS currency ENUM('NGN','USD')
      NOT NULL DEFAULT 'NGN' AFTER deadline;

-- Migrate delivery_mode from old type field
UPDATE events SET delivery_mode =
  CASE
    WHEN type = 'offline'                                             THEN 'physical'
    WHEN type = 'online' AND whatsapp_link IS NOT NULL
         AND (meeting_link IS NULL OR meeting_link = '')             THEN 'whatsapp'
    ELSE 'online_meeting'
  END
WHERE delivery_mode = 'online_meeting';

-- Ensure sort_order exists on event_packages
ALTER TABLE event_packages
  ADD COLUMN IF NOT EXISTS sort_order SMALLINT DEFAULT 0 AFTER perks;

-- Ensure email_logs table exists
CREATE TABLE IF NOT EXISTS email_logs (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  to_email   VARCHAR(150) NOT NULL,
  subject    VARCHAR(200),
  type       VARCHAR(50),
  status     ENUM('sent','failed') DEFAULT 'sent',
  error      TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email   (to_email),
  INDEX idx_status  (status),
  INDEX idx_created (created_at)
);
