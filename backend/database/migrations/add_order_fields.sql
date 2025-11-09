-- Add order_index field to scene_objects and dialogues tables
-- Migration: 2025-11-08 - Add layer ordering support

-- Add order_index to scene_objects
ALTER TABLE scene_objects ADD COLUMN order_index INTEGER DEFAULT 0;

-- Add order_index to dialogues
ALTER TABLE dialogues ADD COLUMN order_index INTEGER DEFAULT 0;

-- Add speaker_name to dialogues (if not exists - safe to run multiple times)
-- ALTER TABLE dialogues ADD COLUMN speaker_name TEXT;
