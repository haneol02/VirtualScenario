-- Migration: Add type, file_path, file_format, created_at to asset_library table

-- Check if columns exist and add them if missing
-- SQLite doesn't support ALTER TABLE ADD COLUMN IF NOT EXISTS, so we use a workaround

-- Add type column
ALTER TABLE asset_library ADD COLUMN type TEXT DEFAULT 'primitive';

-- Add file_path column
ALTER TABLE asset_library ADD COLUMN file_path TEXT;

-- Add file_format column
ALTER TABLE asset_library ADD COLUMN file_format TEXT;

-- Add created_at column
ALTER TABLE asset_library ADD COLUMN created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Update existing records to have type = 'primitive'
UPDATE asset_library SET type = 'primitive' WHERE type IS NULL;
