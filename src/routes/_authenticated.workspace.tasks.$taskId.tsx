import { createFileRoute } from "@tanstack/react-router";
import { TaskDetailView } from "@/components/app/task-detail-view";

export const Route = createFileRoute("/_authenticated/workspace/tasks/$taskId")({
  head: () => ({ meta: [{ title: "Demanda · Meu Workspace" }] }),
  component: Page,
});

function Page() {
  const { taskId } = Route.useParams();
  const session = Route.useRouteContext().session;
  return <TaskDetailView taskId={taskId} session={session} role="workspace" />;
}
