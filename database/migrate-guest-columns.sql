-- Migration: add guest checkout columns
-- Run once on existing databases, then re-seed
ALTER TABLE payments
  MODIFY COLUMN user_id INT UNSIGNED NULL,
  ADD COLUMN IF NOT EXISTS guest_name  VARCHAR(100) NULL AFTER user_id,
  ADD COLUMN IF NOT EXISTS guest_email VARCHAR(150) NULL AFTER guest_name;

ALTER TABLE event_registrations
  MODIFY COLUMN user_id INT UNSIGNED NULL,
  ADD COLUMN IF NOT EXISTS guest_name  VARCHAR(100) NULL AFTER user_id,
  ADD COLUMN IF NOT EXISTS guest_email VARCHAR(150) NULL AFTER guest_name;

-- Migration: add transcript + supplementary content to lessons
ALTER TABLE lessons
  ADD COLUMN IF NOT EXISTS transcript         LONGTEXT     NULL AFTER content,
  ADD COLUMN IF NOT EXISTS supplementary_url   VARCHAR(500) NULL AFTER transcript,
  ADD COLUMN IF NOT EXISTS supplementary_label VARCHAR(100) NULL AFTER supplementary_url;
