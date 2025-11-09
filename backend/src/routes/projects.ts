import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseManager } from '../database';

export function createProjectsRouter(db: DatabaseManager) {
  const router = Router();

  // GET /api/projects - 모든 프로젝트 가져오기
  router.get('/', (req, res) => {
    try {
      const projects = db.getProjects();
      res.json(projects);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/projects/:id - 프로젝트 상세
  router.get('/:id', (req, res) => {
    try {
      const project = db.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }
      res.json(project);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // POST /api/projects - 프로젝트 생성
  router.post('/', (req, res) => {
    try {
      const id = uuidv4();
      const { title, description, version = '1.0' } = req.body;

      if (!title) {
        return res.status(400).json({ error: 'Title is required' });
      }

      db.createProject({ id, title, description, version });
      const project = db.getProject(id);
      res.status(201).json(project);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // PUT /api/projects/:id - 프로젝트 수정
  router.put('/:id', (req, res) => {
    try {
      const { title, description, version } = req.body;
      db.updateProject(req.params.id, { title, description, version });
      const project = db.getProject(req.params.id);
      res.json(project);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // DELETE /api/projects/:id - 프로젝트 삭제 (소프트 삭제)
  router.delete('/:id', (req, res) => {
    try {
      db.deleteProject(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/projects/:id/scenes - 프로젝트의 씬 목록
  router.get('/:id/scenes', (req, res) => {
    try {
      const scenes = db.getScenes(req.params.id);
      res.json(scenes);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // POST /api/projects/:id/scenes - 씬 생성
  router.post('/:id/scenes', (req, res) => {
    try {
      const id = uuidv4();
      const { title, description, participantCount, order } = req.body;

      if (!title) {
        return res.status(400).json({ error: 'Title is required' });
      }

      db.createScene({
        id,
        projectId: req.params.id,
        title,
        description,
        participantCount,
        order: order || 1,
      });

      const scene = db.getScene(id);
      res.status(201).json(scene);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/projects/:id/export - JSON Export
  router.get('/:id/export', (req, res) => {
    try {
      const data = db.exportProject(req.params.id);
      if (!data) {
        return res.status(404).json({ error: 'Project not found' });
      }
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}
