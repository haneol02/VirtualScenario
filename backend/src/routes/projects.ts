import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseManager } from '../database';
import * as XLSX from 'xlsx';

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

  // POST /api/projects/:id/duplicate - 프로젝트 복제
  router.post('/:id/duplicate', (req, res) => {
    try {
      const { title } = req.body;
      const newProject = db.duplicateProject(req.params.id, title);
      res.status(201).json(newProject);
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

  // GET /api/projects/:id/export-excel - Excel Export (시간축 기반)
  router.get('/:id/export-excel', (req, res) => {
    try {
      const exportData = db.exportProject(req.params.id);
      if (!exportData) {
        return res.status(404).json({ error: 'Project not found' });
      }

      // 시간축 기반 타임라인 생성
      const timelineRows: any[] = [];

      exportData.scenes.forEach((scene: any, sceneIdx: number) => {
        const sceneTitle = scene.title || '제목 없음';

        // 씬 구분 헤더 추가
        timelineRows.push({
          '시간': `=== 씬 ${sceneIdx + 1} ===`,
          '씬': sceneTitle,
          '오브젝트': '',
          '동작': '',
          '대화/자막': '',
          '발화자': ''
        });

        // 키프레임이 있는 오브젝트의 동작 추출 (오브젝트당 한 번만)
        const objectActions: any[] = [];
        scene.objects.forEach((obj: any) => {
          if (obj.path && obj.path.length > 1) {
            // 키프레임이 2개 이상이면 이동/회전/스케일 변화가 있음
            // 첫 번째 이동 시작 시간만 기록 (두 번째 키프레임의 시간)
            const firstMoveTime = obj.path[1].time;
            objectActions.push({
              time: firstMoveTime,
              objectName: obj.name,
              action: '이동'
            });
          }
        });

        // 대화/자막 추출
        const dialogues = scene.dialogues || [];

        // 시간별로 동작 그룹화 (같은 시간의 오브젝트 이동을 하나로 합치기)
        const actionsByTime = new Map<number, string[]>();
        objectActions.forEach(action => {
          if (!actionsByTime.has(action.time)) {
            actionsByTime.set(action.time, []);
          }
          actionsByTime.get(action.time)!.push(action.objectName);
        });

        // 모든 이벤트(동작 + 대화)를 시간순으로 정렬
        const events: any[] = [];

        // 그룹화된 동작 추가
        actionsByTime.forEach((objectNames, time) => {
          events.push({
            time: time,
            type: 'action',
            objectName: objectNames.join(', '), // 쉼표로 구분하여 합침
            action: '이동',
            dialogue: '-',
            speaker: '-'
          });
        });

        dialogues.forEach((dialogue: any) => {
          // 우선순위: speaker_name > 연결된 오브젝트 이름 > '-'
          let speakerName = '-';
          if (dialogue.speakerName) {
            speakerName = dialogue.speakerName;
          } else if (dialogue.characterId) {
            const speakerObj = scene.objects.find((o: any) => o.id === dialogue.characterId);
            if (speakerObj) {
              speakerName = speakerObj.name;
            }
          }

          events.push({
            time: dialogue.startTime,
            type: 'dialogue',
            objectName: '-',
            action: '-',
            dialogue: dialogue.text || '-',
            speaker: speakerName
          });
        });

        // 시간순 정렬
        events.sort((a, b) => a.time - b.time);

        // 이벤트가 없는 빈 씬 처리
        if (events.length === 0) {
          timelineRows.push({
            '시간': '-',
            '씬': '',
            '오브젝트': '(이벤트 없음)',
            '동작': '-',
            '대화/자막': '-',
            '발화자': '-'
          });
        } else {
          // 타임라인 행 추가
          events.forEach((event) => {
            const minutes = Math.floor(event.time / 60);
            const seconds = event.time % 60;
            const timeStr = `${String(minutes).padStart(2, '0')}:${seconds.toFixed(1).padStart(4, '0')}`;

            timelineRows.push({
              '시간': timeStr,
              '씬': '',
              '오브젝트': event.objectName,
              '동작': event.action,
              '대화/자막': event.dialogue,
              '발화자': event.speaker
            });
          });
        }

        // 씬 사이에 빈 줄 추가 (구분선)
        timelineRows.push({
          '시간': '',
          '씬': '',
          '오브젝트': '',
          '동작': '',
          '대화/자막': '',
          '발화자': ''
        });
      });

      // 엑셀 워크북 생성
      const wb = XLSX.utils.book_new();

      // 1. 프로젝트 정보 시트
      const projectInfoData = [
        { 항목: '프로젝트 제목', 내용: exportData.projectInfo.title },
        { 항목: '버전', 내용: exportData.projectInfo.version },
        { 항목: '씬 개수', 내용: exportData.scenes.length },
        { 항목: '생성일', 내용: new Date(exportData.projectInfo.createdAt).toLocaleString('ko-KR') }
      ];
      const projectInfoSheet = XLSX.utils.json_to_sheet(projectInfoData);

      // 프로젝트 정보 시트도 컬럼 너비 자동 조정
      projectInfoSheet['!cols'] = [
        { wch: 15 },  // 항목
        { wch: Math.max(30, ...projectInfoData.map(row => String(row.내용).length + 2)) }  // 내용
      ];

      XLSX.utils.book_append_sheet(wb, projectInfoSheet, '프로젝트 정보');

      // 2. 시간축 타임라인 시트
      const timelineSheet = XLSX.utils.json_to_sheet(timelineRows);

      // 컬럼 너비 설정
      timelineSheet['!cols'] = [
        { wch: 12 },  // 시간
        { wch: 25 },  // 씬
        { wch: 30 },  // 오브젝트
        { wch: 10 },  // 동작
        { wch: 50 },  // 대화/자막
        { wch: 15 }   // 발화자
      ];

      XLSX.utils.book_append_sheet(wb, timelineSheet, '시나리오 타임라인');

      // 엑셀 파일 버퍼 생성
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      // 파일명 생성 (프로젝트 제목 + 날짜)
      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `${exportData.projectInfo.title}_${dateStr}.xlsx`;

      // 응답 헤더 설정
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

      res.send(buffer);
    } catch (error: any) {
      console.error('Excel export error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}
