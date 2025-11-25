import { TaskParamType, TaskType, WorkflowTask } from "@/lib/types";
import { GlobeIcon, LucideProps } from "lucide-react";

export const DetectLanguageTask = {
  type: TaskType.DETECT_LANGUAGE,
  label: "Detect Language",
  icon: (props: LucideProps) => (
    <GlobeIcon className="stroke-purple-400" {...props} />
  ),
  isEntryPoint: false,
  inputs: [
    {
      name: "Text Content",
      type: TaskParamType.STRING,
      required: true,
      variant: "textarea",
    },
  ] as const,
  outputs: [
    {
      name: "Language Code",
      type: TaskParamType.STRING,
    },
    {
      name: "Confidence Score",
      type: TaskParamType.STRING,
    },
    {
      name: "Text Content",
      type: TaskParamType.STRING,
    },
  ] as const,
  credits: 1,
} satisfies WorkflowTask;
