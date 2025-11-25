import { TaskParamType, TaskType, WorkflowTask } from "@/lib/types";
import { CodeIcon, LucideProps } from "lucide-react";

export const PageToHtmlTask = {
  type: TaskType.PAGE_TO_HTML,
  label: "Get HTML from the page",
  icon: (props: LucideProps) => (
    <CodeIcon className="stroke-rose-400" {...props} />
  ),
  isEntryPoint: false,
  inputs: [
    {
      name: "Web page",
      type: TaskParamType.BROWSE_INSTANCE,
      required: false,
    },
    {
      name: "All Pages Data",
      type: TaskParamType.STRING,
      helperText: "Multiple pages data from Launch Browser (will process all pages automatically)",
      required: false,
    },
  ] as const,
  outputs: [
    {
      name: "HTML",
      type: TaskParamType.STRING,
    },
    {
      name: "Web page",
      type: TaskParamType.BROWSE_INSTANCE,
    },
    {
      name: "All HTML Data",
      type: TaskParamType.STRING,
    },
    {
      name: "Pages Count",
      type: TaskParamType.STRING,
    },
  ] as const,
  credits: 2,
} satisfies WorkflowTask;
