
REVOKE EXECUTE ON FUNCTION public.notify_task_audience(uuid, uuid, notification_type, text, text, boolean) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.trg_notify_comment() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.trg_notify_task_status() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.trg_notify_task_created() FROM anon, authenticated, public;
