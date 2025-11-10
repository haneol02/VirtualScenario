#!/usr/bin/env python3
import sqlite3

db_path = 'data/scenario.db'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print('Adding duration column to scenes table...')

try:
    # Check if duration column already exists
    cursor.execute("PRAGMA table_info(scenes)")
    columns = [col[1] for col in cursor.fetchall()]

    if 'duration' in columns:
        print('Duration column already exists!')
    else:
        # Add duration column with default value 30.0
        cursor.execute('ALTER TABLE scenes ADD COLUMN duration REAL NOT NULL DEFAULT 30.0')
        conn.commit()
        print('Duration column added successfully!')

    # Verify
    cursor.execute("PRAGMA table_info(scenes)")
    print('\nScenes table columns:')
    for col in cursor.fetchall():
        print(f'  - {col[1]} ({col[2]})')

except Exception as e:
    print(f'Error: {e}')
    conn.rollback()

conn.close()
print('\nDone!')
