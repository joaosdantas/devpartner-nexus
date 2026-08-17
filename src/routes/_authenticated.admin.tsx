import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getSessionContext } from "@/lib/session.functions";
import { getAccessToken } from "@/lib/auth-token";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async () => {
    const accessToken = await getAccessToken();
    const ctx = await getSessionContext({ data: { accessToken } });
    if (!ctx.isStaff) {
      throw redirect({ to: "/workspace/dashboard" });
    }
    return { session: ctx };
  },
  loader: ({ context }) => context,
  component: () => <Outlet />,
});
