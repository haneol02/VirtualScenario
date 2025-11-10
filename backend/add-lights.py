#!/usr/bin/env python3
import sqlite3
import json

db_path = 'data/scenario.db'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print('Adding light assets to database...')

lights = [
    ('light_directional', 'light', '태양광', None, json.dumps({
        'description': '방향성 조명 (태양)',
        'lightType': 'directional',
        'intensity': 1.0
    })),
    ('light_point', 'light', '전구', None, json.dumps({
        'description': '점 조명',
        'lightType': 'point',
        'intensity': 1.0,
        'distance': 10
    })),
    ('light_spot', 'light', '스포트라이트', None, json.dumps({
        'description': '원뿔 조명',
        'lightType': 'spot',
        'intensity': 1.0,
        'angle': 0.5,
        'distance': 10
    })),
    ('light_ambient', 'light', '전역 조명', None, json.dumps({
        'description': '전체를 밝게',
        'lightType': 'ambient',
        'intensity': 0.5
    }))
]

for light in lights:
    try:
        cursor.execute('''
            INSERT OR IGNORE INTO asset_library (id, category, name, thumbnail_path, metadata)
            VALUES (?, ?, ?, ?, ?)
        ''', light)
        print(f'Inserted {light[2]} ({light[0]})')
    except Exception as e:
        print(f'Error inserting {light[2]}: {e}')

conn.commit()

# Verify
cursor.execute('SELECT * FROM asset_library WHERE category = ?', ('light',))
all_lights = cursor.fetchall()
print('\nAll lights in database:')
for light in all_lights:
    print(f'  - {light}')

conn.close()
print('\nDone!')
