-- Migration: Add grid_size column to background_maps
-- Date: 2025-11-10
-- Purpose: Allow custom grid size configuration per background map

-- Add grid_size column to background_maps (default '{"width": 20, "depth": 20}')
ALTER TABLE background_maps ADD COLUMN grid_size TEXT DEFAULT '{"width": 20, "depth": 20}';

-- Update existing rows to have default grid size
UPDATE background_maps SET grid_size = '{"width": 20, "depth": 20}' WHERE grid_size IS NULL;
