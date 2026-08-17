-- =========================================================================
-- DEV PARTNER NEXUS - SCHEMA COMPLETO
-- Cole este script inteiro no SQL Editor do Supabase Dashboard
-- https://supabase.com/dashboard/project/jviuvxbndhvjowcxvuzc/sql/new
-- =========================================================================

-- =========================================================================
-- ENUMS
-- =========================================================================
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'developer', 'client');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.plan_tier AS ENUM ('basic', 'starter', 'pro', 'enterprise');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.client_status AS ENUM ('active', 'inactive', 'suspended');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.project_status AS ENUM ('planning', 'active', 'paused', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.task_status AS ENUM (
    'new', 'in_analysis', 'awaiting_approval', 'in_development',
    'in_testing', 'awaiting_client', 'completed', 'cancelled', 'paused'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.task_priority AS ENUM ('low', 'normal', 'high', 'urgent');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.invoice_status AS ENUM ('draft', 'open', 'paid', 'overdue', 'cancelled');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.notification_type AS ENUM (
    'task_created', 'task_updated', 'task_comment', 'task_status_changed',
    'deadline_near', 'hours_low', 'mention', 'system'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- =========================================================================
-- SHARED FUNCTIONS
-- =========================================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- =========================================================================
-- PROFILES (mirrors auth.users)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  position TEXT,
  phone TEXT,
  preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS trg_profiles_updated ON public.profiles;
CREATE TRIGGER trg_profiles_updated
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================================
-- USER ROLES
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- =========================================================================
-- HELPER FUNCTIONS
-- =========================================================================
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin', 'manager', 'developer')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_manager(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin', 'manager')
  );
$$;

-- =========================================================================
-- PLANS
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  tier plan_tier NOT NULL,
  monthly_hours NUMERIC(10,2) NOT NULL DEFAULT 0,
  monthly_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  sla_hours INTEGER NOT NULL DEFAULT 24,
  max_projects INTEGER NOT NULL DEFAULT 1,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.plans TO authenticated;
GRANT ALL ON public.plans TO service_role;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
DROP TRIGGER IF EXISTS trg_plans_updated ON public.plans;
CREATE TRIGGER trg_plans_updated BEFORE UPDATE ON public.plans
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================================
-- CLIENTS
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  whatsapp TEXT,
  cnpj TEXT,
  plan_id UUID REFERENCES public.plans(id) ON DELETE SET NULL,
  monthly_hours NUMERIC(10,2) NOT NULL DEFAULT 0,
  monthly_value NUMERIC(12,2) NOT NULL DEFAULT 0,
  status client_status NOT NULL DEFAULT 'active',
  logo_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clients TO authenticated;
GRANT ALL ON public.clients TO service_role;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
DROP TRIGGER IF EXISTS trg_clients_updated ON public.clients;
CREATE TRIGGER trg_clients_updated BEFORE UPDATE ON public.clients
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================================
-- CLIENT MEMBERS
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.client_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (client_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_client_members_user ON public.client_members(user_id);
CREATE INDEX IF NOT EXISTS idx_client_members_client ON public.client_members(client_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_members TO authenticated;
GRANT ALL ON public.client_members TO service_role;
ALTER TABLE public.client_members ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_client_member(_user_id UUID, _client_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.client_members
    WHERE user_id = _user_id AND client_id = _client_id
  );
$$;

-- =========================================================================
-- CATEGORIES
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT '#6366f1',
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- =========================================================================
-- PROJECTS
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT NOT NULL DEFAULT '#3b82f6',
  status project_status NOT NULL DEFAULT 'active',
  deadline DATE,
  tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_projects_client ON public.projects(client_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT ALL ON public.projects TO service_role;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
DROP TRIGGER IF EXISTS trg_projects_updated ON public.projects;
CREATE TRIGGER trg_projects_updated BEFORE UPDATE ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_project_members_user ON public.project_members(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_members TO authenticated;
GRANT ALL ON public.project_members TO service_role;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

-- =========================================================================
-- TASKS
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  priority task_priority NOT NULL DEFAULT 'normal',
  status task_status NOT NULL DEFAULT 'new',
  assignee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  delivery_date TIMESTAMPTZ,
  estimated_hours NUMERIC(10,2),
  spent_seconds BIGINT NOT NULL DEFAULT 0,
  board_position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tasks_client ON public.tasks(client_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON public.tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO authenticated;
GRANT ALL ON public.tasks TO service_role;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
DROP TRIGGER IF EXISTS trg_tasks_updated ON public.tasks;
CREATE TRIGGER trg_tasks_updated BEFORE UPDATE ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.can_access_task(_user_id UUID, _task_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.is_staff(_user_id) OR EXISTS (
    SELECT 1 FROM public.tasks t
    JOIN public.client_members cm ON cm.client_id = t.client_id
    WHERE t.id = _task_id AND cm.user_id = _user_id
  );
$$;

-- =========================================================================
-- TASK SUBTABLES
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.task_checklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_done BOOLEAN NOT NULL DEFAULT false,
  position INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_checklist_task ON public.task_checklist(task_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.task_checklist TO authenticated;
GRANT ALL ON public.task_checklist TO service_role;
ALTER TABLE public.task_checklist ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  mentions UUID[] NOT NULL DEFAULT ARRAY[]::UUID[],
  is_internal BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_comments_task ON public.task_comments(task_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.task_comments TO authenticated;
GRANT ALL ON public.task_comments TO service_role;
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;
DROP TRIGGER IF EXISTS trg_comments_updated ON public.task_comments;
CREATE TRIGGER trg_comments_updated BEFORE UPDATE ON public.task_comments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.task_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  uploader_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT,
  size_bytes BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_attachments_task ON public.task_attachments(task_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.task_attachments TO authenticated;
GRANT ALL ON public.task_attachments TO service_role;
ALTER TABLE public.task_attachments ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.task_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  from_value JSONB,
  to_value JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_history_task ON public.task_history(task_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.task_history TO authenticated;
GRANT ALL ON public.task_history TO service_role;
ALTER TABLE public.task_history ENABLE ROW LEVEL SECURITY;

-- =========================================================================
-- TIMER SESSIONS
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.timer_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  seconds INTEGER NOT NULL DEFAULT 0,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_timer_task ON public.timer_sessions(task_id);
CREATE INDEX IF NOT EXISTS idx_timer_user ON public.timer_sessions(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.timer_sessions TO authenticated;
GRANT ALL ON public.timer_sessions TO service_role;
ALTER TABLE public.timer_sessions ENABLE ROW LEVEL SECURITY;

-- =========================================================================
-- NOTIFICATIONS
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, read_at);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- =========================================================================
-- INVOICES
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  hours_contracted NUMERIC(10,2) NOT NULL DEFAULT 0,
  hours_used NUMERIC(10,2) NOT NULL DEFAULT 0,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  status invoice_status NOT NULL DEFAULT 'draft',
  due_date DATE,
  paid_at TIMESTAMPTZ,
  external_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_invoices_client ON public.invoices(client_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoices TO authenticated;
GRANT ALL ON public.invoices TO service_role;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
DROP TRIGGER IF EXISTS trg_invoices_updated ON public.invoices;
CREATE TRIGGER trg_invoices_updated BEFORE UPDATE ON public.invoices
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================================
-- ACTIVITY LOGS
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  action TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_logs_created ON public.activity_logs(created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.activity_logs TO authenticated;
GRANT ALL ON public.activity_logs TO service_role;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- =========================================================================
-- RLS POLICIES
-- =========================================================================

-- profiles
DROP POLICY IF EXISTS "profiles_select_own_or_staff" ON public.profiles;
CREATE POLICY "profiles_select_own_or_staff" ON public.profiles FOR SELECT TO authenticated
USING (id = auth.uid() OR public.is_staff(auth.uid()));
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated
USING (id = auth.uid()) WITH CHECK (id = auth.uid());
DROP POLICY IF EXISTS "profiles_admin_all" ON public.profiles;
CREATE POLICY "profiles_admin_all" ON public.profiles FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- user_roles
DROP POLICY IF EXISTS "roles_select_own_or_staff" ON public.user_roles;
CREATE POLICY "roles_select_own_or_staff" ON public.user_roles FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.is_staff(auth.uid()));
DROP POLICY IF EXISTS "roles_admin_manage" ON public.user_roles;
CREATE POLICY "roles_admin_manage" ON public.user_roles FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- plans
DROP POLICY IF EXISTS "plans_read_all_auth" ON public.plans;
CREATE POLICY "plans_read_all_auth" ON public.plans FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "plans_admin_manage" ON public.plans;
CREATE POLICY "plans_admin_manage" ON public.plans FOR ALL TO authenticated
USING (public.is_admin_or_manager(auth.uid())) WITH CHECK (public.is_admin_or_manager(auth.uid()));

-- categories
DROP POLICY IF EXISTS "categories_read_all_auth" ON public.categories;
CREATE POLICY "categories_read_all_auth" ON public.categories FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "categories_admin_manage" ON public.categories;
CREATE POLICY "categories_admin_manage" ON public.categories FOR ALL TO authenticated
USING (public.is_admin_or_manager(auth.uid())) WITH CHECK (public.is_admin_or_manager(auth.uid()));

-- clients
DROP POLICY IF EXISTS "clients_staff_all" ON public.clients;
CREATE POLICY "clients_staff_all" ON public.clients FOR ALL TO authenticated
USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
DROP POLICY IF EXISTS "clients_member_read" ON public.clients;
CREATE POLICY "clients_member_read" ON public.clients FOR SELECT TO authenticated
USING (public.is_client_member(auth.uid(), id));

-- client_members
DROP POLICY IF EXISTS "client_members_staff_manage" ON public.client_members;
CREATE POLICY "client_members_staff_manage" ON public.client_members FOR ALL TO authenticated
USING (public.is_admin_or_manager(auth.uid())) WITH CHECK (public.is_admin_or_manager(auth.uid()));
DROP POLICY IF EXISTS "client_members_read_own" ON public.client_members;
CREATE POLICY "client_members_read_own" ON public.client_members FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.is_staff(auth.uid()));

-- projects
DROP POLICY IF EXISTS "projects_staff_all" ON public.projects;
CREATE POLICY "projects_staff_all" ON public.projects FOR ALL TO authenticated
USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
DROP POLICY IF EXISTS "projects_client_read" ON public.projects;
CREATE POLICY "projects_client_read" ON public.projects FOR SELECT TO authenticated
USING (public.is_client_member(auth.uid(), client_id));

-- project_members
DROP POLICY IF EXISTS "project_members_staff_all" ON public.project_members;
CREATE POLICY "project_members_staff_all" ON public.project_members FOR ALL TO authenticated
USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
DROP POLICY IF EXISTS "project_members_read_own" ON public.project_members;
CREATE POLICY "project_members_read_own" ON public.project_members FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- tasks
DROP POLICY IF EXISTS "tasks_staff_all" ON public.tasks;
CREATE POLICY "tasks_staff_all" ON public.tasks FOR ALL TO authenticated
USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
DROP POLICY IF EXISTS "tasks_client_read" ON public.tasks;
CREATE POLICY "tasks_client_read" ON public.tasks FOR SELECT TO authenticated
USING (public.is_client_member(auth.uid(), client_id));
DROP POLICY IF EXISTS "tasks_client_insert" ON public.tasks;
CREATE POLICY "tasks_client_insert" ON public.tasks FOR INSERT TO authenticated
WITH CHECK (public.is_client_member(auth.uid(), client_id) AND created_by = auth.uid());

-- task_checklist
DROP POLICY IF EXISTS "checklist_access" ON public.task_checklist;
CREATE POLICY "checklist_access" ON public.task_checklist FOR SELECT TO authenticated
USING (public.can_access_task(auth.uid(), task_id));
DROP POLICY IF EXISTS "checklist_staff_manage" ON public.task_checklist;
CREATE POLICY "checklist_staff_manage" ON public.task_checklist FOR ALL TO authenticated
USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- task_comments
DROP POLICY IF EXISTS "comments_access_read" ON public.task_comments;
CREATE POLICY "comments_access_read" ON public.task_comments FOR SELECT TO authenticated
USING (public.can_access_task(auth.uid(), task_id) AND (NOT is_internal OR public.is_staff(auth.uid())));
DROP POLICY IF EXISTS "comments_insert_if_access" ON public.task_comments;
CREATE POLICY "comments_insert_if_access" ON public.task_comments FOR INSERT TO authenticated
WITH CHECK (public.can_access_task(auth.uid(), task_id) AND author_id = auth.uid());
DROP POLICY IF EXISTS "comments_update_own" ON public.task_comments;
CREATE POLICY "comments_update_own" ON public.task_comments FOR UPDATE TO authenticated
USING (author_id = auth.uid()) WITH CHECK (author_id = auth.uid());
DROP POLICY IF EXISTS "comments_delete_own_or_staff" ON public.task_comments;
CREATE POLICY "comments_delete_own_or_staff" ON public.task_comments FOR DELETE TO authenticated
USING (author_id = auth.uid() OR public.is_staff(auth.uid()));

-- task_attachments
DROP POLICY IF EXISTS "attachments_access_read" ON public.task_attachments;
CREATE POLICY "attachments_access_read" ON public.task_attachments FOR SELECT TO authenticated
USING (public.can_access_task(auth.uid(), task_id));
DROP POLICY IF EXISTS "attachments_insert_if_access" ON public.task_attachments;
CREATE POLICY "attachments_insert_if_access" ON public.task_attachments FOR INSERT TO authenticated
WITH CHECK (public.can_access_task(auth.uid(), task_id) AND uploader_id = auth.uid());
DROP POLICY IF EXISTS "attachments_delete_own_or_staff" ON public.task_attachments;
CREATE POLICY "attachments_delete_own_or_staff" ON public.task_attachments FOR DELETE TO authenticated
USING (uploader_id = auth.uid() OR public.is_staff(auth.uid()));

-- task_history
DROP POLICY IF EXISTS "history_access_read" ON public.task_history;
CREATE POLICY "history_access_read" ON public.task_history FOR SELECT TO authenticated
USING (public.can_access_task(auth.uid(), task_id));
DROP POLICY IF EXISTS "history_staff_insert" ON public.task_history;
CREATE POLICY "history_staff_insert" ON public.task_history FOR INSERT TO authenticated
WITH CHECK (public.is_staff(auth.uid()));

-- timer_sessions
DROP POLICY IF EXISTS "timer_staff_all" ON public.timer_sessions;
CREATE POLICY "timer_staff_all" ON public.timer_sessions FOR ALL TO authenticated
USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
DROP POLICY IF EXISTS "timer_own_read" ON public.timer_sessions;
CREATE POLICY "timer_own_read" ON public.timer_sessions FOR SELECT TO authenticated
USING (user_id = auth.uid());
DROP POLICY IF EXISTS "timer_own_write" ON public.timer_sessions;
CREATE POLICY "timer_own_write" ON public.timer_sessions FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() AND public.is_staff(auth.uid()));
DROP POLICY IF EXISTS "timer_own_update" ON public.timer_sessions;
CREATE POLICY "timer_own_update" ON public.timer_sessions FOR UPDATE TO authenticated
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- notifications
DROP POLICY IF EXISTS "notifications_own" ON public.notifications;
CREATE POLICY "notifications_own" ON public.notifications FOR SELECT TO authenticated
USING (user_id = auth.uid());
DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
CREATE POLICY "notifications_update_own" ON public.notifications FOR UPDATE TO authenticated
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "notifications_staff_insert" ON public.notifications;
CREATE POLICY "notifications_staff_insert" ON public.notifications FOR INSERT TO authenticated
WITH CHECK (public.is_staff(auth.uid()));
DROP POLICY IF EXISTS "notifications_admin_all" ON public.notifications;
CREATE POLICY "notifications_admin_all" ON public.notifications FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- invoices
DROP POLICY IF EXISTS "invoices_staff_all" ON public.invoices;
CREATE POLICY "invoices_staff_all" ON public.invoices FOR ALL TO authenticated
USING (public.is_admin_or_manager(auth.uid())) WITH CHECK (public.is_admin_or_manager(auth.uid()));
DROP POLICY IF EXISTS "invoices_client_read" ON public.invoices;
CREATE POLICY "invoices_client_read" ON public.invoices FOR SELECT TO authenticated
USING (public.is_client_member(auth.uid(), client_id));

-- activity_logs
DROP POLICY IF EXISTS "logs_staff_read" ON public.activity_logs;
CREATE POLICY "logs_staff_read" ON public.activity_logs FOR SELECT TO authenticated
USING (public.is_staff(auth.uid()));
DROP POLICY IF EXISTS "logs_authenticated_insert" ON public.activity_logs;
CREATE POLICY "logs_authenticated_insert" ON public.activity_logs FOR INSERT TO authenticated
WITH CHECK (actor_id = auth.uid() OR actor_id IS NULL);

-- =========================================================================
-- REVOKE + GRANT FUNCTION PERMISSIONS
-- =========================================================================
REVOKE ALL ON FUNCTION public.has_role(UUID, app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_staff(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_admin_or_manager(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_client_member(UUID, UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.can_access_task(UUID, UUID) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.has_role(UUID, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_staff(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_or_manager(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_client_member(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_task(UUID, UUID) TO authenticated;

-- =========================================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- =========================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================================================
-- NOTIFICATION TRIGGERS
-- =========================================================================
CREATE OR REPLACE FUNCTION public.notify_task_audience(
  _task_id uuid,
  _actor uuid,
  _type notification_type,
  _title text,
  _body text,
  _include_client boolean DEFAULT true
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, body, task_id)
  SELECT DISTINCT u.user_id, _type, _title, _body, _task_id
  FROM (
    SELECT t.assignee_id AS user_id FROM public.tasks t WHERE t.id = _task_id
    UNION
    SELECT t.created_by FROM public.tasks t WHERE t.id = _task_id
    UNION
    SELECT tc.author_id FROM public.task_comments tc WHERE tc.task_id = _task_id
    UNION
    SELECT cm.user_id FROM public.client_members cm
      JOIN public.tasks t ON t.client_id = cm.client_id
      WHERE t.id = _task_id AND _include_client
  ) u
  WHERE u.user_id IS NOT NULL AND u.user_id IS DISTINCT FROM _actor;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_notify_comment() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _title text;
BEGIN
  SELECT 'Novo comentário em: ' || t.title INTO _title FROM public.tasks t WHERE t.id = NEW.task_id;
  PERFORM public.notify_task_audience(
    NEW.task_id, NEW.author_id, 'task_comment', COALESCE(_title, 'Novo comentário'),
    left(NEW.content, 160), NOT NEW.is_internal
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_comments_notify ON public.task_comments;
CREATE TRIGGER trg_comments_notify AFTER INSERT ON public.task_comments
FOR EACH ROW EXECUTE FUNCTION public.trg_notify_comment();

CREATE OR REPLACE FUNCTION public.trg_notify_task_status() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    PERFORM public.notify_task_audience(
      NEW.id, auth.uid(), 'task_status_changed',
      'Status atualizado: ' || NEW.title,
      'Novo status: ' || NEW.status::text, true
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_tasks_notify_status ON public.tasks;
CREATE TRIGGER trg_tasks_notify_status AFTER UPDATE ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.trg_notify_task_status();

CREATE OR REPLACE FUNCTION public.trg_notify_task_created() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, body, task_id)
  SELECT DISTINCT u.user_id, 'task_created', 'Nova demanda: ' || NEW.title,
         COALESCE(left(NEW.description, 160), ''), NEW.id
  FROM (
    SELECT ur.user_id FROM public.user_roles ur WHERE ur.role IN ('admin','manager')
    UNION SELECT NEW.assignee_id
  ) u
  WHERE u.user_id IS NOT NULL AND u.user_id IS DISTINCT FROM NEW.created_by;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_tasks_notify_created ON public.tasks;
CREATE TRIGGER trg_tasks_notify_created AFTER INSERT ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.trg_notify_task_created();

-- Revoke trigger functions
DO $$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.notify_task_audience(uuid, uuid, notification_type, text, text, boolean) FROM anon, authenticated, public;
EXCEPTION WHEN undefined_function THEN null;
END $$;
DO $$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.trg_notify_comment() FROM anon, authenticated, public;
EXCEPTION WHEN undefined_function THEN null;
END $$;
DO $$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.trg_notify_task_status() FROM anon, authenticated, public;
EXCEPTION WHEN undefined_function THEN null;
END $$;
DO $$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.trg_notify_task_created() FROM anon, authenticated, public;
EXCEPTION WHEN undefined_function THEN null;
END $$;

-- =========================================================================
-- STORAGE BUCKETS
-- =========================================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', false)
ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('client-logos', 'client-logos', false)
ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('attachments', 'attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
DROP POLICY IF EXISTS "avatars_read_authenticated" ON storage.objects;
CREATE POLICY "avatars_read_authenticated" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'avatars');
DROP POLICY IF EXISTS "avatars_insert_own" ON storage.objects;
CREATE POLICY "avatars_insert_own" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
DROP POLICY IF EXISTS "avatars_update_own" ON storage.objects;
CREATE POLICY "avatars_update_own" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
DROP POLICY IF EXISTS "avatars_delete_own" ON storage.objects;
CREATE POLICY "avatars_delete_own" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "logos_read_authenticated" ON storage.objects;
CREATE POLICY "logos_read_authenticated" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'client-logos');
DROP POLICY IF EXISTS "logos_staff_manage" ON storage.objects;
CREATE POLICY "logos_staff_manage" ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'client-logos' AND public.is_admin_or_manager(auth.uid()))
WITH CHECK (bucket_id = 'client-logos' AND public.is_admin_or_manager(auth.uid()));

DROP POLICY IF EXISTS "attach_read_authenticated" ON storage.objects;
CREATE POLICY "attach_read_authenticated" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'attachments');
DROP POLICY IF EXISTS "attach_insert_authenticated" ON storage.objects;
CREATE POLICY "attach_insert_authenticated" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'attachments' AND owner = auth.uid());
DROP POLICY IF EXISTS "attach_delete_own_or_staff" ON storage.objects;
CREATE POLICY "attach_delete_own_or_staff" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'attachments' AND (owner = auth.uid() OR public.is_staff(auth.uid())));

-- =========================================================================
-- SEED DATA
-- =========================================================================
INSERT INTO public.plans (name, tier, monthly_hours, monthly_price, sla_hours, max_projects, description) VALUES
  ('Basic',      'basic',      10, 690.00,   48,  1, 'Ideal para começar — 10h de desenvolvimento mensais.'),
  ('Starter',    'starter',    20, 1290.00,  24,  3, 'Para times pequenos escalando presença digital.'),
  ('Pro',        'pro',        40, 2490.00,  12,  8, 'Time dedicado com SLA rápido e múltiplos projetos.'),
  ('Enterprise', 'enterprise', 80, 4990.00,  4,  20, 'Operação corporativa com prioridade máxima.')
ON CONFLICT DO NOTHING;

INSERT INTO public.categories (name, slug, color, position) VALUES
  ('WordPress',      'wordpress',      '#21759b',  1),
  ('WooCommerce',    'woocommerce',    '#96588a',  2),
  ('Elementor',      'elementor',      '#d3084b',  3),
  ('Landing Page',   'landing-page',   '#f97316',  4),
  ('Sistema',        'sistema',        '#6366f1',  5),
  ('Integração',     'integracao',     '#8b5cf6',  6),
  ('API',            'api',            '#0ea5e9',  7),
  ('Correção',       'correcao',       '#ef4444',  8),
  ('Hospedagem',     'hospedagem',     '#10b981',  9),
  ('Servidor',       'servidor',       '#14b8a6', 10),
  ('Banco de Dados', 'banco-de-dados', '#0891b2', 11),
  ('SEO',            'seo',            '#22c55e', 12),
  ('Performance',    'performance',    '#eab308', 13),
  ('Design',         'design',         '#ec4899', 14),
  ('Outro',          'outro',          '#64748b', 99)
ON CONFLICT (slug) DO NOTHING;

-- =========================================================================
-- REALTIME
-- =========================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.task_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.task_checklist;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.timer_sessions;
