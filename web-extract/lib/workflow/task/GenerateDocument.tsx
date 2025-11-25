import { TaskParamType, TaskType, WorkflowTask } from "@/lib/types";
import { FileTextIcon, LucideProps } from "lucide-react";

export const GenerateDocumentTask = {
  type: TaskType.GENERATE_DOCUMENT,
  label: "Generate Document",
  icon: (props: LucideProps) => (
    <FileTextIcon className="stroke-orange-400" {...props} />
  ),
  isEntryPoint: true,
  inputs: [
    {
      name: "Content Data",
      type: TaskParamType.STRING,
      required: true,
      variant: "textarea",
    },
    {
      name: "Document Type",
      type: TaskParamType.SELECT,
      required: true,
      hideHandle: true,
      options: [
        // Values aligned with executor template keys
        { label: "Research Paper", value: "research_paper" },
        { label: "Business Report", value: "business_report" },
        { label: "Executive Summary", value: "executive_summary" },
        { label: "Thesis Chapter", value: "thesis_chapter" },
      ],
    },
    {
      name: "Custom Instructions",
      type: TaskParamType.STRING,
      required: false,
      variant: "textarea",
      helperText: "Optional: Additional formatting or content instructions",
    },
    {
      name: "Credentials",
      type: TaskParamType.CREDENTIAL,
      required: true,
    },
  ] as const,
  outputs: [
    {
      name: "Generated Document",
      type: TaskParamType.STRING,
    },
  ] as const,
  credits: 5,
} satisfies WorkflowTask;
