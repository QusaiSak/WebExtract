import { TaskParamType, TaskType, WorkflowTask } from "@/lib/types";
import { LanguagesIcon, LucideProps } from "lucide-react";

export const TranslateTextTask = {
  type: TaskType.TRANSLATE_TEXT,
  label: "Translate Text",
  icon: (props: LucideProps) => (
    <LanguagesIcon className="stroke-green-400" {...props} />
  ),
  isEntryPoint: false,
  inputs: [
    {
      name: "Text Content",
      type: TaskParamType.STRING,
      required: true,
      variant: "textarea",
    },
    {
      name: "Target Language",
      type: TaskParamType.SELECT,
      required: true,
      hideHandle: true,
      options: [
        { label: "English", value: "en" },
        { label: "Hindi", value: "hi" },
        { label: "Tamil", value: "ta" },
        { label: "Bengali", value: "bn" },
        { label: "Marathi", value: "mr" },
        { label: "Kannada", value: "kn" },
      ],
    },
    {
      name: "Credentials",
      type: TaskParamType.CREDENTIAL,
      required: true,
    },
  ] as const,
  outputs: [
    {
      name: "Translated Text",
      type: TaskParamType.STRING,
    },
    {
      name: "Source Language",
      type: TaskParamType.STRING,
    },
  ] as const,
  credits: 2,
} satisfies WorkflowTask;
