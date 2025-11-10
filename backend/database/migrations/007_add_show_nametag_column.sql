-- Migration: Add show_nametag column to scene_objects and background_objects
-- Date: 2025-11-10
-- Purpose: Add nametag visibility toggle for objects (show/hide object name labels in 3D viewer)

-- Add show_nametag column to scene_objects (default 1 = show nametag)
ALTER TABLE scene_objects ADD COLUMN show_nametag INTEGER DEFAULT 1;

-- Add show_nametag column to background_objects (default 1 = show nametag)
ALTER TABLE background_objects ADD COLUMN show_nametag INTEGER DEFAULT 1;

-- Update existing rows to ensure nametags are shown by default
UPDATE scene_objects SET show_nametag = 1 WHERE show_nametag IS NULL;
UPDATE background_objects SET show_nametag = 1 WHERE show_nametag IS NULL;
