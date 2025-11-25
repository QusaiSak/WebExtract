import { TaskParamType, TaskType, WorkflowTask } from "@/lib/types";
import { FileSpreadsheetIcon, LucideProps } from "lucide-react";

export const ExportToCSVTask = {
  type: TaskType.EXPORT_TO_CSV,
  label: "Export to CSV",
  icon: (props: LucideProps) => (
    <FileSpreadsheetIcon className="stroke-emerald-400" {...props} />
  ),
  isEntryPoint: false,
  inputs: [
    {
      name: "Data",
      type: TaskParamType.STRING,
      required: true,
      variant: "textarea",
    },
    {
      name: "Include Metadata",
      type: TaskParamType.SELECT,
      required: true,
      hideHandle: true,
      options: [
        { label: "Yes", value: "true" },
        { label: "No", value: "false" },
      ],
    },
  ] as const,
  outputs: [
    {
      name: "CSV File URL",
      type: TaskParamType.STRING,
    },
  ] as const,
  credits: 1,
} satisfies WorkflowTask;
