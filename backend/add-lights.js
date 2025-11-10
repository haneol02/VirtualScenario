const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'scenario.db');
const db = new Database(dbPath);

console.log('Adding light assets to database...');

const insertStmt = db.prepare(`
  INSERT OR IGNORE INTO asset_library (id, category, name, type, thumbnail_path, metadata)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const lights = [
  ['light_directional', 'light', '태양광', 'light', null, JSON.stringify({
    description: '방향성 조명 (태양)',
    lightType: 'directional',
    intensity: 1.0
  })],
  ['light_point', 'light', '전구', 'light', null, JSON.stringify({
    description: '점 조명',
    lightType: 'point',
    intensity: 1.0,
    distance: 10
  })],
  ['light_spot', 'light', '스포트라이트', 'light', null, JSON.stringify({
    description: '원뿔 조명',
    lightType: 'spot',
    intensity: 1.0,
    angle: 0.5,
    distance: 10
  })],
  ['light_ambient', 'light', '전역 조명', 'light', null, JSON.stringify({
    description: '전체를 밝게',
    lightType: 'ambient',
    intensity: 0.5
  })]
];

for (const light of lights) {
  const result = insertStmt.run(...light);
  console.log(`Inserted ${light[2]} (${light[0]}): ${result.changes} rows`);
}

// Verify
const allLights = db.prepare('SELECT * FROM asset_library WHERE category = ?').all('light');
console.log('\nAll lights in database:');
console.log(allLights);

db.close();
console.log('\nDone!');
