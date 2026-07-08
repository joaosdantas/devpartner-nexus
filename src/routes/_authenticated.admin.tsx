import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getSessionContext } from "@/lib/session.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async () => {
    const ctx = await getSessionContext();
    if (!ctx.isStaff) {
      throw redirect({ to: "/workspace/dashboard" });
    }
    return { session: ctx };
  },
  loader: ({ context }) => context,
  component: () => <Outlet />,
});
