"use client";
import { runWorkflow } from "@/actions/runWorkflow";
import { Button } from "@/components/ui/button";
import useExecutionPlan from "@/hooks/useExecutionPlan";
import { useMutation } from "@tanstack/react-query";
import { useReactFlow } from "@xyflow/react";
import { PlayIcon } from "lucide-react";
import React from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

function ExecuteButton({ workflowId }: { workflowId: string }) {
  const generateExecutionPlan = useExecutionPlan();
  const router = useRouter();
  const mutation = useMutation({
    mutationFn: async (
      vars: { workflowId: string; flowDefinition?: string }
    ) =>
      runWorkflow({
        workflowId: String(vars.workflowId),
        flowDefinition: vars.flowDefinition
          ? String(vars.flowDefinition)
          : undefined,
      }),
    onSuccess: (executionId: string) => {
      toast.success("Execution Started - Redirecting to live logs...", { id: "flow-execution" });
      router.push(`/workflow/runs/${workflowId}/${executionId}`);
    },
    onError: (error: any) => {
      toast.error(error?.message || "Something went wrong", { id: "flow-execution" });
    },
  });

  const { toObject } = useReactFlow();

  return (
    <Button
      variant={"outline"}
      className="flex items-center gap-2"
      disabled={mutation.isPending}
      onClick={() => {
        const plan = generateExecutionPlan();
        if (!plan) return;
        toast.loading("Starting execution...", { id: "flow-execution" });
        const workflowDef = toObject();
        const plainWorkflowDef = JSON.parse(JSON.stringify(workflowDef));
        mutation.mutate({
          workflowId,
          flowDefinition: JSON.stringify(plainWorkflowDef),
        });
      }}
    >
      <PlayIcon size={16} className="stroke-orange-400" /> {mutation.isPending ? "Starting..." : "Execute"}
    </Button>
  );
}

export default ExecuteButton;
