import Database from 'better-sqlite3';
import * as path from 'path';

const dbPath = path.join(__dirname, '../data/scenario.db');
const db = new Database(dbPath);

console.log('🔄 Running migration: Add text/image support to asset_library table');

try {
  // Check if text_content column exists
  const tableInfo = db.pragma("table_info(asset_library)") as any[];
  const hasTextContent = tableInfo.some((col: any) => col.name === 'text_content');

  if (!hasTextContent) {
    console.log('Adding text_content column...');
    db.exec('ALTER TABLE asset_library ADD COLUMN text_content TEXT');

    console.log('Adding text_font_size column...');
    db.exec('ALTER TABLE asset_library ADD COLUMN text_font_size REAL DEFAULT 1.0');

    console.log('Adding text_color column...');
    db.exec('ALTER TABLE asset_library ADD COLUMN text_color TEXT DEFAULT \'#ffffff\'');

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
