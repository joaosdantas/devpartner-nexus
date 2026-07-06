
-- Lock down SECURITY DEFINER helpers: only authenticated users may call them
REVOKE ALL ON FUNCTION public.has_role(UUID, app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_staff(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_admin_or_manager(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_client_member(UUID, UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.can_access_task(UUID, UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.has_role(UUID, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_staff(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_or_manager(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_client_member(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_task(UUID, UUID) TO authenticated;

-- Seed default plans
INSERT INTO public.plans (name, tier, monthly_hours, monthly_price, sla_hours, max_projects, description) VALUES
  ('Basic',      'basic',      10, 690.00,   48,  1, 'Ideal para começar — 10h de desenvolvimento mensais.'),
  ('Starter',    'starter',    20, 1290.00,  24,  3, 'Para times pequenos escalando presença digital.'),
  ('Pro',        'pro',        40, 2490.00,  12,  8, 'Time dedicado com SLA rápido e múltiplos projetos.'),
  ('Enterprise', 'enterprise', 80, 4990.00,  4,  20, 'Operação corporativa com prioridade máxima.')
ON CONFLICT DO NOTHING;

-- Seed categories
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

-- Enable realtime for the tables that will drive live UI
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.task_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.task_checklist;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.timer_sessions;
