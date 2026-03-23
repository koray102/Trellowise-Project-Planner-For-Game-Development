-- GameDev Sync (GDS) Supabase Schema

-- 1. Users Table (Simulated or Real)
CREATE TABLE public.users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  avatar_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'offline',
  roles TEXT[] DEFAULT '{}',
  is_admin BOOLEAN DEFAULT false
);

-- 2. Occupied Items Table (For locking Scenes/Prefabs/Scripts)
CREATE TABLE public.occupied_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'Scene', 'Script', 'Prefab'
  locked_by TEXT REFERENCES public.users(id),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tasks Table (Kanban Board)
CREATE TABLE public.tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL, -- 'todo', 'progress', 'done', 'debt'
  assigned_to TEXT REFERENCES public.users(id),
  sort_order INTEGER DEFAULT 0, -- For persistent Kanban column ordering
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Migration for existing databases:
-- ALTER TABLE public.tasks ADD COLUMN sort_order INTEGER DEFAULT 0;

-- 4. Events Table (Calendar)
CREATE TABLE public.events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  date BIGINT NOT NULL,
  type TEXT NOT NULL
);

-- 5. Announcements Table
CREATE TABLE public.announcements (
  id TEXT PRIMARY KEY,
  text TEXT NOT NULL,
  user_id TEXT REFERENCES public.users(id),
  created_at BIGINT NOT NULL
);
  
-- 6. Config Table (For site-wide settings like password)
CREATE TABLE public.config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Enable Row Level Security (RLS) - Optional for internal tools but good practice
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.occupied_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Allow read/write/delete access to everyone (since this is an internal dashboard without strict auth for now)
CREATE POLICY "Allow anonymous read" ON public.users FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update" ON public.users FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete" ON public.users FOR DELETE USING (true);

CREATE POLICY "Allow anonymous read" ON public.occupied_items FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert" ON public.occupied_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update" ON public.occupied_items FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete" ON public.occupied_items FOR DELETE USING (true);

CREATE POLICY "Allow anonymous read" ON public.tasks FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert" ON public.tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update" ON public.tasks FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete" ON public.tasks FOR DELETE USING (true);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anonymous read" ON public.events FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert" ON public.events FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update" ON public.events FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete" ON public.events FOR DELETE USING (true);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anonymous read" ON public.announcements FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert" ON public.announcements FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update" ON public.announcements FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete" ON public.announcements FOR DELETE USING (true);

ALTER TABLE public.config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anonymous read" ON public.config FOR SELECT USING (true);
CREATE POLICY "Allow anonymous update" ON public.config FOR UPDATE USING (true);

-- Insert Mock Data
INSERT INTO public.users (id, name, avatar_url, status, roles, is_admin) VALUES 
('1', 'Koray (Lead)', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Koray', 'online', ARRAY['Lead'], true),
('2', 'Sam (Art)', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sam', 'online', ARRAY['Art'], false),
('3', 'Jordan (Code)', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jordan', 'away', ARRAY['Code'], false),
('4', 'Alex (Design)', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex', 'offline', ARRAY['Design'], false);

INSERT INTO public.occupied_items (id, name, type, locked_by) VALUES
('1', 'MainMenu.unity', 'Scene', '1'),
('2', 'PlayerController.cs', 'Script', '3'),
('3', 'Level1.unity', 'Scene', NULL),
('4', 'EnemyAI.prefab', 'Prefab', NULL),
('5', 'GameManager.cs', 'Script', NULL);

INSERT INTO public.tasks (id, title, status, assigned_to) VALUES
('t1', 'Fix jumping physics bug', 'progress', '3'),
('t2', 'Design Level 2 layout', 'todo', '4'),
('t3', 'Create main character animations', 'progress', '2'),
('t4', 'Implement audio manager', 'done', '1'),
('t5', 'Refactor UI code (Technical Debt)', 'debt', '1');

-- Default Password (GDS2026)
INSERT INTO public.config (key, value) VALUES ('site_password', 'GDS2026');

-- 7. Auto-delete old announcements trigger (older than 10 days)
CREATE OR REPLACE FUNCTION delete_old_announcements()
RETURNS trigger AS $$
BEGIN
  -- Delete rows where created_at is older than 10 days
  -- created_at is stored in milliseconds
  DELETE FROM public.announcements
  WHERE created_at < (EXTRACT(EPOCH FROM NOW() - INTERVAL '10 days') * 1000);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cleanup_announcements
AFTER INSERT ON public.announcements
FOR EACH STATEMENT
EXECUTE FUNCTION delete_old_announcements();
