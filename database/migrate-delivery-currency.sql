-- Migration: add delivery_mode and currency to events + event_packages
-- Run once on your MySQL database

ALTER TABLE events
  ADD COLUMN delivery_mode ENUM('physical','online_meeting','whatsapp','hybrid')
      NOT NULL DEFAULT 'online_meeting' AFTER type,
  ADD COLUMN currency ENUM('NGN','USD')
      NOT NULL DEFAULT 'NGN' AFTER deadline;

-- Migrate existing data: derive delivery_mode from old type + link presence
UPDATE events SET delivery_mode =
  CASE
    WHEN type = 'offline'                                        THEN 'physical'
    WHEN type = 'online' AND whatsapp_link IS NOT NULL
         AND (meeting_link IS NULL OR meeting_link = '')         THEN 'whatsapp'
    ELSE 'online_meeting'
  END;

-- currency label on event_packages price (display only — prices stored in DECIMAL)
ALTER TABLE event_packages
  ADD COLUMN sort_order SMALLINT DEFAULT 0 AFTER perks;
