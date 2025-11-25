import { TaskParamType, TaskType, WorkflowTask } from "@/lib/types";
import { GlobeIcon, LucideProps } from "lucide-react";

export const LaunchBrowserTask = {
  type: TaskType.LAUNCH_BROWSER,
  label: "Launch Browser",
  icon: (props: LucideProps) => (
    <GlobeIcon className="stroke-pink-400" {...props} />
  ),
  isEntryPoint: true,
  inputs: [
    {
      name: "Website Url",
      type: TaskParamType.STRING,
      helperText: "eg: https://www.google.com or research link",
      required: false,
      hideHandle: false,
    },
    {
      name: "Research Links",
      type: TaskParamType.STRING,
      helperText: "Numbered links from AI Research Assistant (will process all links automatically)",
      required: false,
      hideHandle: false,
    },
    {
      name: "Process All Links",
      type: TaskParamType.STRING,
      helperText: "Set to 'true' to loop through all research links automatically",
      required: false,
      hideHandle: true,
    },
  ] as const,
  outputs: [
    {
      name: "Web page",
      type: TaskParamType.BROWSE_INSTANCE,
    },
    {
      name: "All Pages Data",
      type: TaskParamType.STRING,
    },
    {
      name: "Pages Processed",
      type: TaskParamType.STRING,
    },
  ] as const,
  credits: 1,
} satisfies WorkflowTask;
