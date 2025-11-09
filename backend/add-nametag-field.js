const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'scenario.db');
const db = new Database(dbPath);

// Add show_nametag column to scene_objects
db.exec(`
  ALTER TABLE scene_objects ADD COLUMN show_nametag INTEGER DEFAULT 1;
`);

// Add show_nametag column to background_objects
db.exec(`
  ALTER TABLE background_objects ADD COLUMN show_nametag INTEGER DEFAULT 1;
`);

console.log('✅ Added show_nametag column to scene_objects and background_objects');

db.close();
