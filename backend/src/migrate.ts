import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';

const dbPath = path.join(__dirname, '../data/scenario.db');
const db = new Database(dbPath);

console.log('🔄 Running migration: Add columns to asset_library table');

try {
  // Check if type column exists
  const tableInfo = db.pragma("table_info(asset_library)") as any[];
  const hasTypeColumn = tableInfo.some((col: any) => col.name === 'type');

  if (!hasTypeColumn) {
    console.log('Adding type column...');
    db.exec('ALTER TABLE asset_library ADD COLUMN type TEXT DEFAULT \'primitive\'');

    console.log('Adding file_path column...');
    db.exec('ALTER TABLE asset_library ADD COLUMN file_path TEXT');

    console.log('Adding file_format column...');
    db.exec('ALTER TABLE asset_library ADD COLUMN file_format TEXT');

    console.log('Adding created_at column...');
    db.exec('ALTER TABLE asset_library ADD COLUMN created_at DATETIME');

    console.log('Updating existing records...');
    db.exec('UPDATE asset_library SET type = \'primitive\' WHERE type IS NULL');

    console.log('✅ Migration completed successfully!');
  } else {
    console.log('✅ Migration already applied, skipping.');
  }
} catch (error) {
  console.error('❌ Migration failed:', error);
  process.exit(1);
} finally {
  db.close();
}
