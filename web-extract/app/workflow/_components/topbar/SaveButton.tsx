"use client";

import { updateWorkFlow } from "@/actions/workflows";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { useReactFlow } from "@xyflow/react";
import { CheckIcon } from "lucide-react";
import React from "react";
import { toast } from "sonner";

function SaveButton({ workflowId }: { workflowId: string }) {
  const { toObject } = useReactFlow();

  const saveMutation = useMutation({
    mutationFn: async ({ id, definition }: { id: string; definition: string }) =>
      updateWorkFlow(id, definition),
    onSuccess: () => {
      toast.success("Flow saved successfully", { id: "save-workflow" });
    },
    onError: (error: any) => {
      console.error("Save error:", error);
      const errorMessage = error?.message || "Something went wrong";
      toast.error(errorMessage, { id: "save-workflow" });
    },
  });

  return (
    <Button
      variant={"outline"}
      className="flex items-center gap-2"
      onClick={() => {
        const workflowDef = toObject();
        // Convert to plain JSON to avoid class instance serialization issues
        const plainWorkflowDef = JSON.parse(JSON.stringify(workflowDef));
        toast.loading("Saving Workflow", { id: "save-workflow" });
        saveMutation.mutate({
          id: workflowId,
          definition: JSON.stringify(plainWorkflowDef),
        });
      }}
      disabled={saveMutation.isPending}
    >
      <CheckIcon size={16} className="stroke-green-400" />
      Save
    </Button>
  );
}

export default SaveButton;
