-- Migration: Add sort_order columns for ordering objects and dialogues
-- Created: 2025-11-09

-- Add sort_order to scene_objects table
ALTER TABLE scene_objects ADD COLUMN sort_order INTEGER DEFAULT 0;

-- Add sort_order to dialogues table
ALTER TABLE dialogues ADD COLUMN sort_order INTEGER DEFAULT 0;

-- Update existing records with incremental order based on created_at
UPDATE scene_objects
SET sort_order = (
  SELECT COUNT(*)
  FROM scene_objects AS so2
  WHERE so2.scene_id = scene_objects.scene_id
    AND so2.created_at <= scene_objects.created_at
);

UPDATE dialogues
SET sort_order = (
  SELECT COUNT(*)
  FROM dialogues AS d2
  WHERE d2.scene_id = dialogues.scene_id
    AND d2.start_time <= dialogues.start_time
);
