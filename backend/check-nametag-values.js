const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'scenario.db');
const db = new Database(dbPath);

console.log('=== Scene Objects ===');
const sceneObjects = db.prepare('SELECT id, name, show_nametag FROM scene_objects').all();
sceneObjects.forEach(obj => {
  console.log(`ID: ${obj.id}, Name: ${obj.name}, show_nametag: ${obj.show_nametag}`);
});

console.log('\n=== Background Objects ===');
const bgObjects = db.prepare('SELECT id, name, show_nametag FROM background_objects').all();
bgObjects.forEach(obj => {
  console.log(`ID: ${obj.id}, Name: ${obj.name}, show_nametag: ${obj.show_nametag}`);
});

db.close();
