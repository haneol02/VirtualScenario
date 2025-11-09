import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseManager } from '../database';

export function createBackgroundMapsRouter(db: DatabaseManager) {
  const router = Router();

  // GET /api/background-maps - 배경 맵 목록
  router.get('/', (req, res) => {
    try {
      const maps = db.getBackgroundMaps();
      res.json(maps);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/background-maps/:id - 배경 맵 상세
  router.get('/:id', (req, res) => {
    try {
      const map = db.getBackgroundMap(req.params.id);
      if (!map) {
        return res.status(404).json({ error: 'Background map not found' });
      }
      res.json(map);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // POST /api/background-maps - 배경 맵 생성
  router.post('/', (req, res) => {
    try {
      const { name, description, icon, backgroundImagePath } = req.body;
      const id = uuidv4();
      db.createBackgroundMap({ id, name, description, icon, backgroundImagePath });
      const map = db.getBackgroundMap(id);
      res.status(201).json(map);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // PUT /api/background-maps/:id - 배경 맵 수정
  router.put('/:id', (req, res) => {
    try {
      const { name, description, icon, backgroundImagePath } = req.body;
      db.updateBackgroundMap(req.params.id, { name, description, icon, backgroundImagePath });
      const map = db.getBackgroundMap(req.params.id);
      res.json(map);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // DELETE /api/background-maps/:id - 배경 맵 삭제
  router.delete('/:id', (req, res) => {
    try {
      db.deleteBackgroundMap(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/background-maps/:id/objects - 배경 맵의 오브젝트 목록
  router.get('/:id/objects', (req, res) => {
    try {
      const objects = db.getBackgroundObjects(req.params.id);
      res.json(objects);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // POST /api/background-maps/:id/objects - 오브젝트 추가
  router.post('/:id/objects', (req, res) => {
    try {
      const { name, type, modelId, color, positionX, positionY, positionZ, rotationX, rotationY, rotationZ, scaleX, scaleY, scaleZ, metadata } = req.body;
      const id = uuidv4();
      const backgroundMapId = req.params.id;

      db.createBackgroundObject({
        id,
        backgroundMapId,
        name,
        type,
        modelId,
        color: color || '#6b7280',
        positionX: positionX ?? 0,
        positionY: positionY ?? 0,
        positionZ: positionZ ?? 0,
        rotationX: rotationX ?? 0,
        rotationY: rotationY ?? 0,
        rotationZ: rotationZ ?? 0,
        scaleX: scaleX ?? 1,
        scaleY: scaleY ?? 1,
        scaleZ: scaleZ ?? 1,
        metadata
      });

      const obj = db.getBackgroundObject(id);
      res.status(201).json(obj);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // PUT /api/background-objects/:id - 오브젝트 수정
  router.put('/objects/:id', (req, res) => {
    try {
      const { name, type, modelId, color, showNametag, transform, metadata } = req.body;
      db.updateBackgroundObject(req.params.id, { name, type, modelId, color, showNametag, transform, metadata });
      const obj = db.getBackgroundObject(req.params.id);
      res.json(obj);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // DELETE /api/background-objects/:id - 오브젝트 삭제
  router.delete('/objects/:id', (req, res) => {
    try {
      db.deleteBackgroundObject(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}
