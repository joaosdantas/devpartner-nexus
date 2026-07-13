import { createFileRoute } from "@tanstack/react-router";
import { TaskDetailView } from "@/components/app/task-detail-view";

export const Route = createFileRoute("/_authenticated/admin/tasks/$taskId")({
  head: () => ({ meta: [{ title: "Demanda · DEV Partner" }] }),
  component: Page,
});

function Page() {
  const { taskId } = Route.useParams();
  const session = Route.useRouteContext().session;
  return <TaskDetailView taskId={taskId} session={session} role="admin" />;
}
