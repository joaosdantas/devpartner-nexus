import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      throw redirect({
        to: "/auth",
        search: { redirect: location.href },
      });
    }

    // Store access token in cookie so server functions can verify the session
    document.cookie = `sb-access-token=${session.access_token}; path=/; SameSite=Lax; max-age=3600`;
    document.cookie = `sb-refresh-token=${session.refresh_token}; path=/; SameSite=Lax; max-age=86400`;

    return { user: session.user };
  },
  component: () => <Outlet />,
});
