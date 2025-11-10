import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';

export class DatabaseManager {
  private db: Database.Database;
  private dbPath: string;

  constructor(dbPath?: string) {
    // Use provided path or default to ./data/scenario.db
    this.dbPath = dbPath || path.join(__dirname, '../data/scenario.db');

    // Ensure data directory exists
    const dataDir = path.dirname(this.dbPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    this.db = new Database(this.dbPath);
    this.db.pragma('foreign_keys = ON');
    this.initialize();
  }

  private initialize() {
    const schemaPath = path.join(__dirname, '../database/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    this.db.exec(schema);

    // Run migrations
    this.runMigrations();

    console.log('✅ Database initialized at:', this.dbPath);
  }

  private runMigrations() {
    const migrationsDir = path.join(__dirname, '../database/migrations');
    if (!fs.existsSync(migrationsDir)) {
      return;
    }

    // Check if order_index column exists in scene_objects
    const sceneObjectsInfo = this.db.pragma('table_info(scene_objects)') as any[];
    const hasOrderIndex = sceneObjectsInfo.some((col: any) => col.name === 'order_index');

    if (!hasOrderIndex) {
      console.log('Running migration: add_order_fields...');
      try {
        this.db.exec('ALTER TABLE scene_objects ADD COLUMN order_index INTEGER DEFAULT 0');
        console.log('✅ Migration completed: order_index field added to scene_objects');
      } catch (error) {
        console.error('Migration error:', error);
      }
    }

    // Check if speaker_name and order_index columns exist in dialogues
    const dialoguesInfo = this.db.pragma('table_info(dialogues)') as any[];
    const hasSpeakerName = dialoguesInfo.some((col: any) => col.name === 'speaker_name');
    const hasDialogueOrderIndex = dialoguesInfo.some((col: any) => col.name === 'order_index');

    if (!hasSpeakerName || !hasDialogueOrderIndex) {
      console.log('Running migration: add_dialogue_columns...');
      try {
        if (!hasSpeakerName) {
          this.db.exec('ALTER TABLE dialogues ADD COLUMN speaker_name TEXT');
        }
        if (!hasDialogueOrderIndex) {
          this.db.exec('ALTER TABLE dialogues ADD COLUMN order_index INTEGER NOT NULL DEFAULT 0');
        }
        console.log('✅ Migration completed: speaker_name and order_index fields added to dialogues');
      } catch (error) {
        console.error('Migration error:', error);
      }
    }

    // 에셋 클린업 로직 제거 - 업로드한 모델들이 서버 재시작 시 삭제되는 문제 해결

    // Check if visible column exists in scene_objects and background_objects
    const sceneObjectsInfoForVisible = this.db.pragma('table_info(scene_objects)') as any[];
    const hasVisibleInSceneObjects = sceneObjectsInfoForVisible.some((col: any) => col.name === 'visible');

    const backgroundObjectsInfoForVisible = this.db.pragma('table_info(background_objects)') as any[];
    const hasVisibleInBackgroundObjects = backgroundObjectsInfoForVisible.some((col: any) => col.name === 'visible');

    if (!hasVisibleInSceneObjects || !hasVisibleInBackgroundObjects) {
      console.log('Running migration: add_visible_column...');
      try {
        if (!hasVisibleInSceneObjects) {
          this.db.exec('ALTER TABLE scene_objects ADD COLUMN visible INTEGER DEFAULT 1');
          this.db.exec('UPDATE scene_objects SET visible = 1 WHERE visible IS NULL');
        }
        if (!hasVisibleInBackgroundObjects) {
          this.db.exec('ALTER TABLE background_objects ADD COLUMN visible INTEGER DEFAULT 1');
          this.db.exec('UPDATE background_objects SET visible = 1 WHERE visible IS NULL');
        }
        console.log('✅ Migration completed: visible field added to scene_objects and background_objects');
      } catch (error) {
        console.error('Migration error:', error);
      }
    }

    // Check if locked column exists in scene_objects and background_objects
    const sceneObjectsInfoForLocked = this.db.pragma('table_info(scene_objects)') as any[];
    const hasLockedInSceneObjects = sceneObjectsInfoForLocked.some((col: any) => col.name === 'locked');

    const backgroundObjectsInfoForLocked = this.db.pragma('table_info(background_objects)') as any[];
    const hasLockedInBackgroundObjects = backgroundObjectsInfoForLocked.some((col: any) => col.name === 'locked');

    if (!hasLockedInSceneObjects || !hasLockedInBackgroundObjects) {
      console.log('Running migration: add_locked_column...');
      try {
        if (!hasLockedInSceneObjects) {
          this.db.exec('ALTER TABLE scene_objects ADD COLUMN locked INTEGER DEFAULT 0');
          this.db.exec('UPDATE scene_objects SET locked = 0 WHERE locked IS NULL');
        }
        if (!hasLockedInBackgroundObjects) {
          this.db.exec('ALTER TABLE background_objects ADD COLUMN locked INTEGER DEFAULT 0');
          this.db.exec('UPDATE background_objects SET locked = 0 WHERE locked IS NULL');
        }
        console.log('✅ Migration completed: locked field added to scene_objects and background_objects');
      } catch (error) {
        console.error('Migration error:', error);
      }
    }

    // Check if grid_size column exists in background_maps
    const backgroundMapsInfo = this.db.pragma('table_info(background_maps)') as any[];
    const hasGridSize = backgroundMapsInfo.some((col: any) => col.name === 'grid_size');

    if (!hasGridSize) {
      console.log('Running migration: add_grid_size_column...');
      try {
        this.db.exec('ALTER TABLE background_maps ADD COLUMN grid_size TEXT DEFAULT \'{"width": 20, "depth": 20}\'');
        this.db.exec('UPDATE background_maps SET grid_size = \'{"width": 20, "depth": 20}\' WHERE grid_size IS NULL');
        console.log('✅ Migration completed: grid_size field added to background_maps');
      } catch (error) {
        console.error('Migration error:', error);
      }
    }
  }

  // Projects
  getProjects() {
    return this.db
      .prepare('SELECT * FROM projects WHERE is_deleted = 0 ORDER BY updated_at DESC')
      .all();
  }

  getProject(id: string) {
    return this.db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
  }

  createProject(data: { id: string; title: string; description?: string; version: string }) {
    const stmt = this.db.prepare(`
      INSERT INTO projects (id, title, description, version)
      VALUES (?, ?, ?, ?)
    `);
    return stmt.run(data.id, data.title, data.description || null, data.version);
  }

  updateProject(id: string, data: { title?: string; description?: string; version?: string }) {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.title !== undefined) {
      fields.push('title = ?');
      values.push(data.title);
    }
    if (data.description !== undefined) {
      fields.push('description = ?');
      values.push(data.description);
    }
    if (data.version !== undefined) {
      fields.push('version = ?');
      values.push(data.version);
    }

    if (fields.length === 0) return;

    values.push(id);
    const sql = `UPDATE projects SET ${fields.join(', ')} WHERE id = ?`;
    return this.db.prepare(sql).run(...values);
  }

  deleteProject(id: string) {
    const stmt = this.db.prepare('UPDATE projects SET is_deleted = 1 WHERE id = ?');
    return stmt.run(id);
  }

  // Scenes
  getScenes(projectId: string) {
    return this.db
      .prepare('SELECT * FROM scenes WHERE project_id = ? ORDER BY order_index')
      .all(projectId);
  }

  getScene(id: string) {
    return this.db.prepare('SELECT * FROM scenes WHERE id = ?').get(id);
  }

  createScene(data: any) {
    const stmt = this.db.prepare(`
      INSERT INTO scenes (id, project_id, order_index, title, description, participant_count)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(
      data.id,
      data.projectId,
      data.order,
      data.title,
      data.description || null,
      data.participantCount || null
    );
  }

  updateScene(id: string, data: any) {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.title !== undefined) {
      fields.push('title = ?');
      values.push(data.title);
    }
    if (data.description !== undefined) {
      fields.push('description = ?');
      values.push(data.description);
    }
    if (data.participantCount !== undefined) {
      fields.push('participant_count = ?');
      values.push(data.participantCount);
    }
    if (data.backgroundMapId !== undefined) {
      fields.push('background_map_id = ?');
      values.push(data.backgroundMapId);
    }

    if (fields.length === 0) return;

    values.push(id);
    const sql = `UPDATE scenes SET ${fields.join(', ')} WHERE id = ?`;
    return this.db.prepare(sql).run(...values);
  }

  deleteScene(id: string) {
    const stmt = this.db.prepare('DELETE FROM scenes WHERE id = ?');
    return stmt.run(id);
  }

  // Scene Objects
  getSceneObjects(sceneId: string) {
    return this.db.prepare('SELECT * FROM scene_objects WHERE scene_id = ? ORDER BY order_index ASC').all(sceneId);
  }

  getSceneObject(id: string) {
    return this.db.prepare('SELECT * FROM scene_objects WHERE id = ?').get(id);
  }

  createSceneObject(data: any) {
    // Get max order_index for this scene
    const maxOrder: any = this.db.prepare(
      'SELECT COALESCE(MAX(order_index), -1) as max_order FROM scene_objects WHERE scene_id = ?'
    ).get(data.sceneId);
    const orderIndex = maxOrder.max_order + 1;

    const stmt = this.db.prepare(`
      INSERT INTO scene_objects (
        id, scene_id, type, name, model_id, color,
        position_x, position_y, position_z,
        rotation_x, rotation_y, rotation_z,
        scale_x, scale_y, scale_z,
        path_data, metadata, order_index
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(
      data.id,
      data.sceneId,
      data.type,
      data.name,
      data.assetId || null,
      data.color || '#6b7280',
      data.transform.position[0], data.transform.position[1], data.transform.position[2],
      data.transform.rotation[0], data.transform.rotation[1], data.transform.rotation[2],
      data.transform.scale[0], data.transform.scale[1], data.transform.scale[2],
      data.pathData ? JSON.stringify(data.pathData) : null,
      data.metadata ? JSON.stringify(data.metadata) : null,
      orderIndex
    );
  }

  updateSceneObject(id: string, data: any) {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) {
      fields.push('name = ?');
      values.push(data.name);
    }
    if (data.modelId !== undefined) {
      fields.push('model_id = ?');
      values.push(data.modelId || null);
    }
    if (data.color !== undefined) {
      fields.push('color = ?');
      values.push(data.color);
    }
    if (data.showNametag !== undefined) {
      fields.push('show_nametag = ?');
      values.push(data.showNametag ? 1 : 0);
    }
    if (data.visible !== undefined) {
      fields.push('visible = ?');
      values.push(data.visible ? 1 : 0);
    }
    if (data.locked !== undefined) {
      fields.push('locked = ?');
      values.push(data.locked ? 1 : 0);
    }
    if (data.transform !== undefined) {
      if (data.transform.position) {
        fields.push('position_x = ?', 'position_y = ?', 'position_z = ?');
        values.push(data.transform.position[0], data.transform.position[1], data.transform.position[2]);
      }
      if (data.transform.rotation) {
        fields.push('rotation_x = ?', 'rotation_y = ?', 'rotation_z = ?');
        values.push(data.transform.rotation[0], data.transform.rotation[1], data.transform.rotation[2]);
      }
      if (data.transform.scale) {
        fields.push('scale_x = ?', 'scale_y = ?', 'scale_z = ?');
        values.push(data.transform.scale[0], data.transform.scale[1], data.transform.scale[2]);
      }
    }
    if (data.pathData !== undefined) {
      fields.push('path_data = ?');
      values.push(data.pathData ? JSON.stringify(data.pathData) : null);
    }
    if (data.metadata !== undefined) {
      fields.push('metadata = ?');
      values.push(data.metadata ? JSON.stringify(data.metadata) : null);
    }

    if (fields.length === 0) return;

    values.push(id);
    const sql = `UPDATE scene_objects SET ${fields.join(', ')} WHERE id = ?`;
    return this.db.prepare(sql).run(...values);
  }

  deleteSceneObject(id: string) {
    const stmt = this.db.prepare('DELETE FROM scene_objects WHERE id = ?');
    return stmt.run(id);
  }

  // Dialogues
  getDialogues(sceneId: string) {
    return this.db
      .prepare('SELECT * FROM dialogues WHERE scene_id = ? ORDER BY order_index ASC, start_time ASC')
      .all(sceneId);
  }

  getDialogue(id: string) {
    return this.db.prepare('SELECT * FROM dialogues WHERE id = ?').get(id);
  }

  createDialogue(data: any) {
    // Get max order_index for this scene
    const maxOrder: any = this.db.prepare(
      'SELECT COALESCE(MAX(order_index), -1) as max_order FROM dialogues WHERE scene_id = ?'
    ).get(data.sceneId);
    const orderIndex = maxOrder.max_order + 1;

    const stmt = this.db.prepare(`
      INSERT INTO dialogues (id, scene_id, object_id, speaker_name, text, start_time, duration, audio_path, order_index)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(
      data.id,
      data.sceneId,
      data.objectId || null,
      data.speakerName || null,
      data.text,
      data.startTime,
      data.duration,
      data.audioPath || null,
      orderIndex
    );
  }

  updateDialogue(id: string, data: any) {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.objectId !== undefined) {
      fields.push('object_id = ?');
      values.push(data.objectId);
    }
    if (data.speakerName !== undefined) {
      fields.push('speaker_name = ?');
      values.push(data.speakerName);
    }
    if (data.text !== undefined) {
      fields.push('text = ?');
      values.push(data.text);
    }
    if (data.startTime !== undefined) {
      fields.push('start_time = ?');
      values.push(data.startTime);
    }
    if (data.duration !== undefined) {
      fields.push('duration = ?');
      values.push(data.duration);
    }
    if (data.audioPath !== undefined) {
      fields.push('audio_path = ?');
      values.push(data.audioPath);
    }

    if (fields.length === 0) return;

    values.push(id);
    const sql = `UPDATE dialogues SET ${fields.join(', ')} WHERE id = ?`;
    return this.db.prepare(sql).run(...values);
  }

  deleteDialogue(id: string) {
    const stmt = this.db.prepare('DELETE FROM dialogues WHERE id = ?');
    return stmt.run(id);
  }

  // Reorder Scene Objects
  reorderSceneObjects(sceneId: string, orderedIds: string[]) {
    const stmt = this.db.prepare('UPDATE scene_objects SET order_index = ? WHERE id = ?');
    const updateMany = this.db.transaction((ids: string[]) => {
      ids.forEach((id, index) => {
        stmt.run(index, id);
      });
    });
    updateMany(orderedIds);
  }

  // Reorder Dialogues
  reorderDialogues(sceneId: string, orderedIds: string[]) {
    const stmt = this.db.prepare('UPDATE dialogues SET order_index = ? WHERE id = ?');
    const updateMany = this.db.transaction((ids: string[]) => {
      ids.forEach((id, index) => {
        stmt.run(index, id);
      });
    });
    updateMany(orderedIds);
  }

  // Background Maps
  getBackgroundMaps() {
    return this.db.prepare('SELECT * FROM background_maps ORDER BY name').all();
  }

  getBackgroundMap(id: string) {
    return this.db.prepare('SELECT * FROM background_maps WHERE id = ?').get(id);
  }

  createBackgroundMap(data: any) {
    const stmt = this.db.prepare(`
      INSERT INTO background_maps (id, name, description, icon, background_image_path, grid_size)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(
      data.id,
      data.name,
      data.description || null,
      data.icon || null,
      data.backgroundImagePath || null,
      data.gridSize || '{"width": 20, "depth": 20}'
    );
  }

  updateBackgroundMap(id: string, data: any) {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) {
      fields.push('name = ?');
      values.push(data.name);
    }
    if (data.description !== undefined) {
      fields.push('description = ?');
      values.push(data.description);
    }
    if (data.icon !== undefined) {
      fields.push('icon = ?');
      values.push(data.icon);
    }
    if (data.backgroundImagePath !== undefined) {
      fields.push('background_image_path = ?');
      values.push(data.backgroundImagePath);
    }
    if (data.gridSize !== undefined) {
      fields.push('grid_size = ?');
      values.push(data.gridSize);
    }

    if (fields.length === 0) return;

    values.push(id);
    const sql = `UPDATE background_maps SET ${fields.join(', ')} WHERE id = ?`;
    return this.db.prepare(sql).run(...values);
  }

  deleteBackgroundMap(id: string) {
    const stmt = this.db.prepare('DELETE FROM background_maps WHERE id = ?');
    return stmt.run(id);
  }

  // Background Objects
  getBackgroundObjects(mapId: string) {
    return this.db
      .prepare('SELECT * FROM background_objects WHERE background_map_id = ?')
      .all(mapId);
  }

  getBackgroundObject(id: string) {
    return this.db.prepare('SELECT * FROM background_objects WHERE id = ?').get(id);
  }

  createBackgroundObject(data: any) {
    const stmt = this.db.prepare(`
      INSERT INTO background_objects (
        id, background_map_id, name, type, model_id, color,
        position_x, position_y, position_z,
        rotation_x, rotation_y, rotation_z,
        scale_x, scale_y, scale_z, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(
      data.id,
      data.backgroundMapId,
      data.name,
      data.type,
      data.modelId || null,
      data.color || '#6b7280',
      data.positionX || 0,
      data.positionY || 0,
      data.positionZ || 0,
      data.rotationX || 0,
      data.rotationY || 0,
      data.rotationZ || 0,
      data.scaleX || 1,
      data.scaleY || 1,
      data.scaleZ || 1,
      data.metadata ? JSON.stringify(data.metadata) : null
    );
  }

  updateBackgroundObject(id: string, data: any) {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) {
      fields.push('name = ?');
      values.push(data.name);
    }
    if (data.type !== undefined) {
      fields.push('type = ?');
      values.push(data.type);
    }
    if (data.modelId !== undefined) {
      fields.push('model_id = ?');
      values.push(data.modelId);
    }
    if (data.color !== undefined) {
      fields.push('color = ?');
      values.push(data.color);
    }
    if (data.showNametag !== undefined) {
      fields.push('show_nametag = ?');
      values.push(data.showNametag ? 1 : 0);
    }
    if (data.visible !== undefined) {
      fields.push('visible = ?');
      values.push(data.visible ? 1 : 0);
    }
    if (data.locked !== undefined) {
      fields.push('locked = ?');
      values.push(data.locked ? 1 : 0);
    }

    // Handle transform data (can be nested object or direct fields)
    const transform = data.transform || data;
    if (transform.position !== undefined) {
      fields.push('position_x = ?', 'position_y = ?', 'position_z = ?');
      values.push(transform.position[0], transform.position[1], transform.position[2]);
    }
    if (transform.rotation !== undefined) {
      fields.push('rotation_x = ?', 'rotation_y = ?', 'rotation_z = ?');
      values.push(transform.rotation[0], transform.rotation[1], transform.rotation[2]);
    }
    if (transform.scale !== undefined) {
      fields.push('scale_x = ?', 'scale_y = ?', 'scale_z = ?');
      values.push(transform.scale[0], transform.scale[1], transform.scale[2]);
    }

    if (data.metadata !== undefined) {
      fields.push('metadata = ?');
      values.push(data.metadata ? JSON.stringify(data.metadata) : null);
    }

    if (fields.length === 0) return;

    values.push(id);
    const sql = `UPDATE background_objects SET ${fields.join(', ')} WHERE id = ?`;
    return this.db.prepare(sql).run(...values);
  }

  deleteBackgroundObject(id: string) {
    const stmt = this.db.prepare('DELETE FROM background_objects WHERE id = ?');
    return stmt.run(id);
  }

  // Asset Library
  getAssetLibrary() {
    return this.db.prepare('SELECT * FROM asset_library ORDER BY category, name').all();
  }

  // Export - Full project with all relations
  exportProject(projectId: string) {
    const project: any = this.getProject(projectId);
    if (!project) return null;

    const scenes = this.getScenes(projectId).map((scene: any) => {
      const objects = this.getSceneObjects(scene.id).map((obj: any) => ({
        id: obj.id,
        type: obj.type,
        name: obj.name,
        modelId: obj.model_id,
        position: [obj.position_x, obj.position_y, obj.position_z],
        rotation: [obj.rotation_x, obj.rotation_y, obj.rotation_z],
        scale: [obj.scale_x, obj.scale_y, obj.scale_z],
        path: obj.path_data ? JSON.parse(obj.path_data) : null,
        metadata: obj.metadata ? JSON.parse(obj.metadata) : null,
      }));

      const dialogues = this.getDialogues(scene.id).map((dlg: any) => ({
        id: dlg.id,
        characterId: dlg.object_id,
        text: dlg.text,
        startTime: dlg.start_time,
        duration: dlg.duration,
        audioUrl: dlg.audio_path,
      }));

      return {
        id: scene.id,
        order: scene.order_index,
        title: scene.title,
        description: scene.description,
        participantCount: scene.participant_count,
        objects,
        dialogues,
      };
    });

    return {
      projectInfo: {
        id: project.id,
        title: project.title,
        version: project.version,
        createdAt: project.created_at,
      },
      scenes,
    };
  }

  // Asset Library
  getAllAssets() {
    return this.db.prepare('SELECT * FROM asset_library ORDER BY category, name').all();
  }

  getAsset(id: string) {
    return this.db.prepare('SELECT * FROM asset_library WHERE id = ?').get(id);
  }

  getAssetsByCategory(category: string) {
    return this.db.prepare('SELECT * FROM asset_library WHERE category = ? ORDER BY name').all(category);
  }

  createAsset(data: {
    name: string;
    category: string;
    type?: string;
    file_path?: string;
    file_format?: string;
    text_content?: string;
    text_font_size?: number;
    text_color?: string;
    metadata?: string;
  }) {
    const id = `asset_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const stmt = this.db.prepare(`
      INSERT INTO asset_library (id, name, category, type, file_path, file_format, text_content, text_font_size, text_color, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      id,
      data.name,
      data.category,
      data.type || 'primitive',
      data.file_path || null,
      data.file_format || null,
      data.text_content || null,
      data.text_font_size || 1.0,
      data.text_color || '#ffffff',
      data.metadata || null
    );
    return this.db.prepare('SELECT * FROM asset_library WHERE id = ?').get(id);
  }

  updateAsset(id: string, data: {
    name?: string;
    category?: string;
  }) {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined && data.name !== null) {
      fields.push('name = ?');
      values.push(data.name);
    }
    if (data.category !== undefined && data.category !== null) {
      fields.push('category = ?');
      values.push(data.category);
    }

    // If no fields to update, just return the current asset
    if (fields.length === 0) {
      return this.db.prepare('SELECT * FROM asset_library WHERE id = ?').get(id);
    }

    values.push(id);

    const sql = `UPDATE asset_library SET ${fields.join(', ')} WHERE id = ?`;
    const stmt = this.db.prepare(sql);
    stmt.run(...values);
    return this.db.prepare('SELECT * FROM asset_library WHERE id = ?').get(id);
  }

  deleteAsset(id: string) {
    const stmt = this.db.prepare('DELETE FROM asset_library WHERE id = ?');
    return stmt.run(id);
  }

  close() {
    this.db.close();
  }
}
