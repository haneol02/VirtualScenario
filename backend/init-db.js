// Initialize database with new schema
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'scenario.db');
const schemaPath = path.join(__dirname, 'database', 'schema.sql');

// Ensure data directory exists
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Read schema
const schema = fs.readFileSync(schemaPath, 'utf8');

// Create database
const db = new Database(dbPath);

// Execute schema
db.exec(schema);

console.log('✅ Database initialized successfully!');
console.log(`📁 Location: ${dbPath}`);

// Verify tables
const tables = db.prepare(`
  SELECT name FROM sqlite_master
  WHERE type='table'
  ORDER BY name
`).all();

console.log('\n📊 Created tables:');
tables.forEach(t => console.log(`  - ${t.name}`));

// Verify background maps
const maps = db.prepare('SELECT * FROM background_maps').all();
console.log('\n🗺️  Background maps:');
maps.forEach(m => console.log(`  ${m.icon} ${m.name}`));

// Verify primitives
const primitives = db.prepare(`SELECT * FROM asset_library WHERE category='primitive'`).all();
console.log('\n🔷 3D Primitives:');
primitives.forEach(p => console.log(`  - ${p.name} (${p.id})`));

db.close();
