import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseManager } from '../database';

export function createScenesRouter(db: DatabaseManager) {
  const router = Router();

  // GET /api/scenes/:id - 씬 상세
  router.get('/:id', (req, res) => {
    try {
      const scene = db.getScene(req.params.id);
      if (!scene) {
        return res.status(404).json({ error: 'Scene not found' });
      }
      res.json(scene);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // PUT /api/scenes/:id - 씬 수정
  router.put('/:id', (req, res) => {
    try {
      const { title, description, duration, participantCount, backgroundMapId } = req.body;
      db.updateScene(req.params.id, { title, description, duration, participantCount, backgroundMapId });
      const scene = db.getScene(req.params.id);
      res.json(scene);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // DELETE /api/scenes/:id - 씬 삭제
  router.delete('/:id', (req, res) => {
    try {
      db.deleteScene(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/scenes/:id/objects - 씬의 오브젝트 목록
  router.get('/:id/objects', (req, res) => {
    try {
      const objects = db.getSceneObjects(req.params.id);
      res.json(objects);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // POST /api/scenes/:id/objects - 씬에 오브젝트 추가
  router.post('/:id/objects', (req, res) => {
    try {
      const sceneId = req.params.id;
      const { type, name, assetId, model_id, color, metadata } = req.body;

      const objectId = uuidv4();
      const transform = req.body.transform || {
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1]
      };

      db.createSceneObject({
        id: objectId,
        sceneId,
        type,
        name,
        assetId: model_id || assetId,  // model_id를 우선 사용, fallback으로 assetId
        color: color || '#6b7280',
        transform,
        pathData: null,
        metadata
      });

      const object = db.getSceneObject(objectId);
      res.json(object);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // PUT /api/scenes/:sceneId/objects/:id - 오브젝트 수정
  router.put('/:sceneId/objects/:id', (req, res) => {
    try {
      const { name, modelId, color, showNametag, transform, pathData, metadata } = req.body;
      db.updateSceneObject(req.params.id, { name, modelId, color, showNametag, transform, pathData, metadata });
      const object = db.getSceneObject(req.params.id);
      res.json(object);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // DELETE /api/scenes/:sceneId/objects/:id - 오브젝트 삭제
  router.delete('/:sceneId/objects/:id', (req, res) => {
    try {
      db.deleteSceneObject(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/scenes/:id/dialogues - 씬의 대화 목록
  router.get('/:id/dialogues', (req, res) => {
    try {
      const dialogues = db.getDialogues(req.params.id);
      res.json(dialogues);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // POST /api/scenes/:id/dialogues - 씬에 대화 추가
  router.post('/:id/dialogues', (req, res) => {
    try {
      const sceneId = req.params.id;
      const { objectId, speakerName, text, startTime, duration, audioPath } = req.body;

      const dialogueId = uuidv4();

      db.createDialogue({
        id: dialogueId,
        sceneId,
        objectId: objectId || null,
        speakerName: speakerName || null,
        text,
        startTime: startTime || 0,
        duration: duration || 3,
        audioPath: audioPath || null
      });

      const dialogue = db.getDialogue(dialogueId);
      res.json(dialogue);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // PUT /api/scenes/:sceneId/dialogues/:id - 대화 수정
  router.put('/:sceneId/dialogues/:id', (req, res) => {
    try {
      const { objectId, speakerName, text, startTime, duration, audioPath } = req.body;
      db.updateDialogue(req.params.id, { objectId, speakerName, text, startTime, duration, audioPath });
      const dialogue = db.getDialogue(req.params.id);
      res.json(dialogue);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // DELETE /api/scenes/:sceneId/dialogues/:id - 대화 삭제
  router.delete('/:sceneId/dialogues/:id', (req, res) => {
    try {
      db.deleteDialogue(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // POST /api/scenes/:id/objects/reorder - 오브젝트 순서 변경
  router.post('/:id/objects/reorder', (req, res) => {
    try {
      const { orderedIds } = req.body;
      db.reorderSceneObjects(req.params.id, orderedIds);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // POST /api/scenes/:id/dialogues/reorder - 대화 순서 변경
  router.post('/:id/dialogues/reorder', (req, res) => {
    try {
      const { orderedIds } = req.body;
      db.reorderDialogues(req.params.id, orderedIds);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}
