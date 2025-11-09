# Supabase 프로젝트 설정 가이드

## 1. Supabase 프로젝트 생성

1. [https://supabase.com](https://supabase.com)에 접속하여 로그인
2. "New Project" 클릭
3. 프로젝트 정보 입력:
   - **Name**: `virtual-scenario`
   - **Database Password**: 강력한 비밀번호 생성 (저장 필수!)
   - **Region**: Northeast Asia (Seoul) - `ap-northeast-2`
   - **Pricing Plan**: Free

## 2. 데이터베이스 스키마 생성

Supabase Dashboard → SQL Editor에서 다음 SQL을 실행하세요:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (Supabase Auth 사용하므로 별도 생성 불필요)

-- Projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  version TEXT NOT NULL DEFAULT '1.0',
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

-- Scenes table
CREATE TABLE scenes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  "order" INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  duration INTEGER NOT NULL DEFAULT 30, -- seconds
  participant_count INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Scene objects table
CREATE TABLE scene_objects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scene_id UUID NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'person', 'train', 'facility', 'equipment', 'sign'
  name TEXT NOT NULL,
  model_id TEXT NOT NULL,
  position JSONB NOT NULL DEFAULT '{"x": 0, "y": 0, "z": 0}',
  rotation JSONB NOT NULL DEFAULT '{"x": 0, "y": 0, "z": 0}',
  scale JSONB NOT NULL DEFAULT '{"x": 1, "y": 1, "z": 1}',
  path_data JSONB, -- array of {position, time}
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Dialogues table
CREATE TABLE dialogues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scene_id UUID NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
  object_id UUID REFERENCES scene_objects(id) ON DELETE SET NULL,
  text TEXT NOT NULL,
  start_time FLOAT NOT NULL,
  duration FLOAT NOT NULL,
  audio_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Asset library table
CREATE TABLE asset_library (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL, -- 'person', 'train', 'facility', 'equipment', 'sign'
  name TEXT NOT NULL,
  thumbnail_url TEXT,
  model_url TEXT, -- Unity용
  three_js_model_url TEXT, -- Web용
  metadata JSONB
);

-- Indexes for performance
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_scenes_project_id ON scenes(project_id);
CREATE INDEX idx_scene_objects_scene_id ON scene_objects(scene_id);
CREATE INDEX idx_dialogues_scene_id ON dialogues(scene_id);
CREATE INDEX idx_asset_library_category ON asset_library(category);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to projects table
CREATE TRIGGER update_projects_updated_at
BEFORE UPDATE ON projects
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

## 3. Row Level Security (RLS) 설정

```sql
-- Enable RLS on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE scene_objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE dialogues ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_library ENABLE ROW LEVEL SECURITY;

-- Projects policies
CREATE POLICY "Users can view their own projects"
ON projects FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own projects"
ON projects FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects"
ON projects FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects"
ON projects FOR DELETE
USING (auth.uid() = user_id);

-- Scenes policies
CREATE POLICY "Users can view scenes from their projects"
ON scenes FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = scenes.project_id
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create scenes in their projects"
ON scenes FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = scenes.project_id
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update scenes in their projects"
ON scenes FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = scenes.project_id
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete scenes from their projects"
ON scenes FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = scenes.project_id
    AND projects.user_id = auth.uid()
  )
);

-- Scene objects policies (similar pattern)
CREATE POLICY "Users can view objects from their scenes"
ON scene_objects FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM scenes
    JOIN projects ON scenes.project_id = projects.id
    WHERE scenes.id = scene_objects.scene_id
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create objects in their scenes"
ON scene_objects FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM scenes
    JOIN projects ON scenes.project_id = projects.id
    WHERE scenes.id = scene_objects.scene_id
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update objects in their scenes"
ON scene_objects FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM scenes
    JOIN projects ON scenes.project_id = projects.id
    WHERE scenes.id = scene_objects.scene_id
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete objects from their scenes"
ON scene_objects FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM scenes
    JOIN projects ON scenes.project_id = projects.id
    WHERE scenes.id = scene_objects.scene_id
    AND projects.user_id = auth.uid()
  )
);

-- Dialogues policies (same pattern)
CREATE POLICY "Users can view dialogues from their scenes"
ON dialogues FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM scenes
    JOIN projects ON scenes.project_id = projects.id
    WHERE scenes.id = dialogues.scene_id
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create dialogues in their scenes"
ON dialogues FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM scenes
    JOIN projects ON scenes.project_id = projects.id
    WHERE scenes.id = dialogues.scene_id
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update dialogues in their scenes"
ON dialogues FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM scenes
    JOIN projects ON scenes.project_id = projects.id
    WHERE scenes.id = dialogues.scene_id
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete dialogues from their scenes"
ON dialogues FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM scenes
    JOIN projects ON scenes.project_id = projects.id
    WHERE scenes.id = dialogues.scene_id
    AND projects.user_id = auth.uid()
  )
);

-- Asset library is public (read-only)
CREATE POLICY "Anyone can view asset library"
ON asset_library FOR SELECT
TO authenticated
USING (TRUE);
```

## 4. 샘플 데이터 추가 (Asset Library)

```sql
-- Sample assets for testing
INSERT INTO asset_library (id, category, name, thumbnail_url, metadata) VALUES
  ('person_passenger', 'person', '승객', '/assets/thumbs/person_passenger.png', '{"description": "일반 승객"}'),
  ('person_staff', 'person', '역무원', '/assets/thumbs/person_staff.png', '{"description": "코레일 직원"}'),
  ('person_child', 'person', '어린이', '/assets/thumbs/person_child.png', '{"description": "어린이 승객"}'),
  ('train_ktx', 'train', 'KTX', '/assets/thumbs/train_ktx.png', '{"description": "고속열차"}'),
  ('facility_platform', 'facility', '플랫폼', '/assets/thumbs/platform.png', '{"description": "승강장"}'),
  ('facility_bench', 'facility', '의자', '/assets/thumbs/bench.png', '{"description": "대기 의자"}'),
  ('sign_safety', 'sign', '안전선 표지판', '/assets/thumbs/sign_safety.png', '{"description": "안전선 안내"}');
```

## 5. Storage 버킷 생성

Supabase Dashboard → Storage에서 다음 버킷을 생성하세요:

### 5.1 `project-thumbnails` 버킷
- **Public**: Yes
- **File size limit**: 5MB
- **Allowed MIME types**: `image/png`, `image/jpeg`, `image/webp`

### 5.2 `asset-models` 버킷
- **Public**: Yes
- **File size limit**: 50MB
- **Allowed MIME types**: `model/gltf-binary`, `application/octet-stream`

### 5.3 `audio-files` 버킷
- **Public**: Yes
- **File size limit**: 10MB
- **Allowed MIME types**: `audio/mpeg`, `audio/wav`, `audio/mp3`

## 6. 환경 변수 설정

1. Supabase Dashboard → Settings → API에서 다음 정보 확인:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **Anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

2. `web-editor/.env.local` 파일 생성:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

## 7. Authentication 설정

Supabase Dashboard → Authentication → Providers:

### 7.1 Email Provider 활성화
- **Enable Email provider**: ON
- **Confirm email**: OFF (개발 중에는 비활성화)

### 7.2 Site URL 설정
- **Site URL**: `http://localhost:3000` (개발)
- **Redirect URLs**: `http://localhost:3000/auth/callback`

프로덕션 배포 시:
- **Site URL**: `https://your-domain.com`
- **Redirect URLs**: `https://your-domain.com/auth/callback`

## 8. 연결 테스트

`web-editor/lib/supabase.ts` 파일이 생성되면 다음 명령으로 테스트:

```bash
cd web-editor
npm run dev
```

브라우저에서 `http://localhost:3000` 접속 후 회원가입/로그인 테스트

## 9. 유용한 SQL 쿼리

### 모든 프로젝트와 씬 조회
```sql
SELECT
  p.id,
  p.title,
  p.version,
  COUNT(s.id) as scene_count
FROM projects p
LEFT JOIN scenes s ON p.id = s.project_id
WHERE p.user_id = auth.uid()
GROUP BY p.id, p.title, p.version;
```

### 특정 프로젝트의 전체 데이터 조회
```sql
SELECT
  p.*,
  json_agg(
    json_build_object(
      'id', s.id,
      'title', s.title,
      'objects', (
        SELECT json_agg(so.*)
        FROM scene_objects so
        WHERE so.scene_id = s.id
      ),
      'dialogues', (
        SELECT json_agg(d.*)
        FROM dialogues d
        WHERE d.scene_id = s.id
      )
    ) ORDER BY s.order
  ) as scenes
FROM projects p
LEFT JOIN scenes s ON p.id = s.project_id
WHERE p.id = 'project-uuid-here'
GROUP BY p.id;
```

## 트러블슈팅

### RLS 정책이 작동하지 않을 때
1. Supabase Dashboard → Authentication에서 사용자가 로그인되어 있는지 확인
2. SQL Editor에서 `SELECT auth.uid();` 실행하여 현재 사용자 ID 확인
3. RLS가 활성화되어 있는지 확인: `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';`

### Storage 업로드 실패
1. 버킷이 Public으로 설정되어 있는지 확인
2. MIME type이 허용 목록에 있는지 확인
3. 파일 크기 제한 확인

---

설정이 완료되었습니다! 다음 단계로 진행하세요.
