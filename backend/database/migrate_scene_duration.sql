-- Migration: Add duration column to scenes table
-- This allows each scene to have its own duration instead of sharing a global value

ALTER TABLE scenes ADD COLUMN duration REAL NOT NULL DEFAULT 30.0;
