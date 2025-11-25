import { TaskParamType, TaskType, WorkflowTask } from "@/lib/types";
import { SearchIcon, LucideProps } from "lucide-react";

export const AiResearchAssistantTask = {
  type: TaskType.AI_RESEARCH_ASSISTANT,
  label: "AI Research Assistant",
  icon: (props: LucideProps) => (
    <SearchIcon className="stroke-blue-400" {...props} />
  ),
  isEntryPoint: true,
  inputs: [
    {
      name: "Research Query",
      type: TaskParamType.STRING,
      required: true,
      variant: "textarea",
      helperText: "e.g., 'Find articles about renewable energy in India'",
      hideHandle: true,
    },
    {
      name: "Number of Links",
      type: TaskParamType.STRING,
      required: false,
      hideHandle: true,
      helperText: "How many research links? (1-20, default: 5)",
    },
    {
      name: "Credentials",
      type: TaskParamType.CREDENTIAL,
      required: true,
      helperText: "SerpApi key for Google search (get from https://serpapi.com)",
    },
  ] as const,
  outputs: [
    {
      name: "Research Links",
      type: TaskParamType.STRING,
    },
    {
      name: "Link Count",
      type: TaskParamType.STRING,
    },
    {
      name: "Research Summary",
      type: TaskParamType.STRING,
    },
  ] as const,
  credits: 3,
} satisfies WorkflowTask;
