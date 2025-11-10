-- Migration: Add locked column to scene_objects and background_objects
-- Date: 2025-11-10
-- Purpose: Add lock toggle for objects (locked objects cannot be selected in 3D viewer)

-- Add locked column to scene_objects (default 0 = unlocked)
ALTER TABLE scene_objects ADD COLUMN locked INTEGER DEFAULT 0;

-- Add locked column to background_objects (default 0 = unlocked)
ALTER TABLE background_objects ADD COLUMN locked INTEGER DEFAULT 0;

-- Update existing rows to ensure they are unlocked by default
UPDATE scene_objects SET locked = 0 WHERE locked IS NULL;
UPDATE background_objects SET locked = 0 WHERE locked IS NULL;
