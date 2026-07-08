import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getSessionContext } from "@/lib/session.functions";

export const Route = createFileRoute("/_authenticated/workspace")({
  beforeLoad: async () => {
    const ctx = await getSessionContext();
    // Staff always has access to /admin, redirect them there.
    if (ctx.isStaff && !ctx.clientId) {
      throw redirect({ to: "/admin/dashboard" });
    }
    if (!ctx.clientId && !ctx.isStaff) {
      // No client workspace attached and not staff — kick back to auth with a message.
      throw redirect({ to: "/auth" });
    }
    return { session: ctx };
  },
  loader: ({ context }) => context,
  component: () => <Outlet />,
});
