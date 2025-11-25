import { auth } from "@clerk/nextjs/server";
import { Loader2Icon } from "lucide-react";
import { Suspense } from "react";

import { notFound, redirect } from "next/navigation";

import { getWorkflowExecutionWithPhases } from "@/actions/workflows";
import Topbar from "@/app/workflow/_components/topbar/Topbar";

import prisma from "@/lib/prisma";

async function getExecutionData(executionId: string, userId: string) {
  const execution = await prisma.workflowExecution.findUnique({
    where: { id: executionId },
    include: {
      workflow: true,
      phases: {
        orderBy: { startedAt: "asc" },
        include: {
          logs: {
            orderBy: { timestamp: "asc" },
          },
        },
      },
    },
  });

  if (!execution) {
    notFound();
  }

  if (execution.workflow.userId !== userId) {
    redirect("/workflows");
  }

  return execution;
}

function ExecutionViewerPage({
  params,
}: {
  params: { executionId: string; workflowId: string };
}) {
  return (
    <div className="flex flex-col h-screen w-full overflow-hidden gradient-bg">
      <Topbar
        workflowId={params.workflowId}
        title="Workflow run details"
        subtitle={`Execution Id: ${params.executionId}`}
        hideButtons
      />
      <section className="flex h-full overflow-auto p-4">
        <Suspense
          fallback={
            <div className="flex w-full items-center justify-center">
              <Loader2Icon className="h-10 w-10 animate-spin stroke-primary" />
            </div>
          }
        >
          <ExecutionViewerWrapper executionId={params.executionId} />
        </Suspense>
      </section>
    </div>
  );
}

export default ExecutionViewerPage;

import dynamic from "next/dynamic";

const ExecutionViewer = dynamic(() => import("./_components/ExecutionViewer"), {
  ssr: false,
  loading: () => (
    <div className="flex w-full h-full items-center justify-center">
      <Loader2Icon className="h-10 w-10 animate-spin stroke-primary" />
    </div>
  ),
});

async function ExecutionViewerWrapper({
  executionId,
}: {
  executionId: string;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const workflowExecution = await getWorkflowExecutionWithPhases(executionId);

  if (!workflowExecution) {
    return <div>No Found</div>;
  }

  return <ExecutionViewer initialData={workflowExecution} />;
}
