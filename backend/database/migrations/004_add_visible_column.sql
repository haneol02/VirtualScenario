-- Migration: Add visible column to scene_objects and background_objects
-- Date: 2025-11-10
-- Purpose: Add visibility toggle for objects (show/hide in 3D viewer and simulator)

-- Add visible column to scene_objects (default 1 = visible)
ALTER TABLE scene_objects ADD COLUMN visible INTEGER DEFAULT 1;

-- Add visible column to background_objects (default 1 = visible)
ALTER TABLE background_objects ADD COLUMN visible INTEGER DEFAULT 1;

-- Update existing rows to ensure they are visible by default
UPDATE scene_objects SET visible = 1 WHERE visible IS NULL;
UPDATE background_objects SET visible = 1 WHERE visible IS NULL;
