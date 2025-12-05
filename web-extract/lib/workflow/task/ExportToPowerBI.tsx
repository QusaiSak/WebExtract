import { TaskParamType, TaskType, WorkflowTask } from "@/lib/types";
import { BarChart3Icon, LucideProps } from "lucide-react";

export const ExportToPowerBITask = {
  type: TaskType.EXPORT_TO_POWERBI,
  label: "Visualize & Export",
  icon: (props: LucideProps) => (
    <BarChart3Icon className="stroke-pink-400" {...props} />
  ),
  isEntryPoint: false,
  inputs: [
    {
      name: "Data",
      type: TaskParamType.STRING,
      required: true,
    },
    {
      name: "Chart Type",
      type: TaskParamType.SELECT,
      required: true,
      hideHandle: true,
      options: [
        { label: "Bar Chart", value: "bar" },
        { label: "Line Chart", value: "line" },
        { label: "Pie Chart", value: "pie" },
        { label: "Scatter Plot", value: "scatter" },
      ],
    },
  ] as const,
  outputs: [
    {
      name: "Power BI CSV",
      type: TaskParamType.STRING,
    },
    {
      name: "Template File",
      type: TaskParamType.STRING,
    },
    {
      name: "Auto Download",
      type: TaskParamType.STRING,
    },
    {
      name: "Visualization Config",
      type: TaskParamType.STRING,
    },
    {
      name: "HTML Report",
      type: TaskParamType.STRING,
    },
    {
      name: "Visualization Image",
      type: TaskParamType.STRING,
    },
    {
      name: "Visualization Image URL",
      type: TaskParamType.STRING,
    },
  ] as const,
  credits: 2,
} satisfies WorkflowTask;
