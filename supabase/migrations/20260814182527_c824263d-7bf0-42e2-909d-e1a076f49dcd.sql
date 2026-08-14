
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
