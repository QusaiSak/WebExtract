import { TaskParamType, TaskType, WorkflowTask } from "@/lib/types";
import { LucideProps, FileText } from "lucide-react";

export const ExportToPDFTask = {
  type: TaskType.EXPORT_TO_PDF,
  label: "Export to PDF",
  icon: (props: LucideProps) => <FileText className="stroke-red-500" {...props} />,
  isEntryPoint: false,
  inputs: [
    {
      name: "Content",
      type: TaskParamType.STRING,
      required: true,
      helperText: "HTML or plain text to render into a PDF",
    },
    {
      name: "File Name",
      type: TaskParamType.STRING,
      required: false,
      helperText: "Optional file name without extension",
    },
  ] as const,
  outputs: [
    {
      name: "PDF Base64",
      type: TaskParamType.STRING,
    },
    {
      name: "Download URL",
      type: TaskParamType.STRING,
    },
    {
      name: "Auto Download",
      type: TaskParamType.STRING,
    },
  ] as const,
  credits: 2,
} satisfies WorkflowTask;