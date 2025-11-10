-- Migration: Add speaker_name and order_index columns to dialogues table
-- Date: 2025-11-10

-- Add speaker_name column if not exists
ALTER TABLE dialogues ADD COLUMN speaker_name TEXT;

-- Add order_index column if not exists
ALTER TABLE dialogues ADD COLUMN order_index INTEGER NOT NULL DEFAULT 0;
