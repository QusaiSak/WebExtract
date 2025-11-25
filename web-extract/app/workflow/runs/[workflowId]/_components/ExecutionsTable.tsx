"use client";
import { getWorkflowExecutions } from "@/actions/workflows";
import { useQuery } from "@tanstack/react-query";
import React from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { datesToDurationString } from "@/lib/helper";
import { Badge } from "@/components/ui/badge";
import ExecutionStatusIndicator from "./ExecutionStatusIndicator";
import { WorkflowExecutionStatus } from "@/lib/types";
import { Coins, CoinsIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";

type InitialData = Awaited<ReturnType<typeof getWorkflowExecutions>>;

function ExecutionsTable({
  workflowId,
  initialData,
}: {
  workflowId: string;
  initialData: InitialData;
}) {
  const query = useQuery({
    queryKey: ["executions", workflowId],
    initialData,
    queryFn: () => getWorkflowExecutions(workflowId),
    refetchInterval: 5000,
  });

  const router = useRouter();

  return (
    <div className="max-h-[calc(100vh-160px)] overflow-y-auto">
      <Table className="min-w-full table-auto">
        <TableHeader className="bg-muted">
          <TableRow>
            <TableHead>Id</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Consumed</TableHead>
            <TableHead className="text-right text-sm text-muted-foreground">
              Started at
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {query.data.map((execution) => {
            const duration = datesToDurationString(
              execution.completedAt,
              execution.startedAt
            );

            const formattedStartedAt =
              execution.startedAt &&
              formatDistanceToNow(execution.startedAt, { addSuffix: true });

            return (
              <TableRow
                key={execution.id}
                className="cursor-pointer hover:bg-muted/40"
                onClick={() => {
                  router.push(
                    `/workflow/runs/${execution.workflowId}/${execution.id}`
                  );
                }}
              >
                <TableCell>
                  <span className="font-semibold text-sm">{execution.id}</span>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2 items-center">
                    <ExecutionStatusIndicator
                      status={execution.status as WorkflowExecutionStatus}
                    />
                    <span className="font-medium text-sm capitalize">
                      {execution.status}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2 items-center">
                    <CoinsIcon size={16} className="text-primary" />
                    <span className="font-medium text-sm">
                      {execution.creditsConsumed}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right text-muted-foreground capitalize first:uppercase">
                  {formattedStartedAt}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

export default ExecutionsTable;
