import { TaskParamType, TaskType, WorkflowTask } from "@/lib/types";
import { BarChart3Icon, LucideProps } from "lucide-react";

export const ExportToPowerBITask = {
  type: TaskType.EXPORT_TO_POWERBI,
  label: "Export to Power BI (CSV)",
  icon: (props: LucideProps) => (
    <BarChart3Icon className="stroke-yellow-400" {...props} />
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
      name: "Chart Type",
      type: TaskParamType.SELECT,
      required: true,
      hideHandle: true,
      helperText: "Prepares data structure optimized for this chart type in Power BI",
      options: [
        { label: "Trend Analysis", value: "trend" },
        { label: "Pie Chart", value: "pie" },
        { label: "Bar Chart", value: "bar" },
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
  ] as const,
  credits: 2,
} satisfies WorkflowTask;
