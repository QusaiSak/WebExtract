import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { SYSTEM_PROMPT, generateWorkflowPrompt, modifyWorkflowPrompt } from "./prompts";
import { AppNode } from "./types";
import { Edge } from "@xyflow/react";

import { streamUI } from "ai/rsc";
//
import { z } from "zod";
import { ReactNode } from "react";
import { generateNodeId } from "./workflow-ai";
import WorkflowCanvas from "@/components/ai/WorkflowCanvas";
import { Bot } from "lucide-react";

export interface WorkflowContext {
  currentWorkflow?: { nodes: AppNode[], edges: Edge[] }
  conversationHistory?: any[]
}

// Build context for AI from current workflow state
export function buildWorkflowContext(
  workflow?: { nodes: AppNode[], edges: Edge[] },
  conversationHistory?: any[]
): WorkflowContext {
  return {
    currentWorkflow: workflow,
    conversationHistory: conversationHistory?.slice(-10) // Keep last 10 messages
  }
}

// ✅ Enhanced workflow generation with proper prompts
export async function generateStreamingWorkflow(
  prompt: string, 
  context?: WorkflowContext
) {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error("OpenRouter API key not found in environment");
    }

    const openrouter = createOpenAI({
      apiKey,
      baseURL: process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1",
    });

    const systemPrompt = SYSTEM_PROMPT
    const userPrompt = context?.currentWorkflow 
      ? modifyWorkflowPrompt(prompt, context.currentWorkflow, context.conversationHistory)
      : generateWorkflowPrompt(prompt, context)

    const defaultModel = process.env.OPENROUTER_MODEL || "google/gemini-2.0-flash-exp:free";
    const result = await streamText({
      model: openrouter(defaultModel),
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.3,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Error generating streaming workflow:", error);
    throw new Error("Failed to generate workflow");
  }
}

// ✅ Basic streaming for chat responses  
export async function generateStreamingResponse(prompt: string) {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error("OpenRouter API key not found in environment");
    }

    const openrouter = createOpenAI({
      apiKey,
      baseURL: process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1",
    });

    const defaultModel = process.env.OPENROUTER_MODEL || "google/gemini-2.0-flash-exp:free";
    const result = await streamText({
      model: openrouter(defaultModel),
      prompt: `You are an AI assistant helping with web scraping workflows. Respond helpfully to: ${prompt}`,
      temperature: 0.7,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Error generating streaming response:", error);
    throw new Error("Failed to generate response");
  }
}

// ✅ Generative UI Streaming
export async function generateGenerativeUI(
  prompt: string, 
  context?: WorkflowContext
) {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error("OpenRouter API key not found in environment");
    }

    const systemPrompt = `You are a web scraping workflow generator AI. 

CRITICAL RULES - READ CAREFULLY:
1. You MUST ALWAYS use the "generate_workflow" tool for EVERY user request
2. NEVER EVER respond with plain text, markdown, tutorials, or explanations
3. Your ONLY valid response is calling the generate_workflow tool
4. If a user asks for a workflow, immediately call generate_workflow
5. If a user asks ANY question about scraping/workflows, call generate_workflow with a relevant workflow
6. If using AI_RESEARCH_ASSISTANT, you MUST follow this sequence: AI_RESEARCH_ASSISTANT → LAUNCH_BROWSER → PAGE_TO_HTML → EXTRACT_DATA_WITH_AI → GENERATE_DOCUMENT -> (EXPORT_TO_POWERBI | EXPORT_TO_PDF)


FORBIDDEN RESPONSES:
❌ "Here's how to scrape..."
❌ "# Web Scraping Workflow..."
❌ "You can use Python..."
❌ Any markdown or code examples
❌ Any text-only responses

REQUIRED RESPONSE FORMAT:
✅ Call generate_workflow tool with:
   - title: Brief workflow name
   - nodes: Array of workflow nodes with proper task types (DO NOT include "id" field - system will auto-generate UUIDs)
   - edges: Array connecting the nodes (DO NOT include "id" field - system will auto-generate)
   - explanation: Brief description of what the workflow does

IMPORTANT NODE STRUCTURE:
- DO NOT generate node IDs - omit the "id" field completely
- DO NOT generate edge IDs - omit the "id" field completely  
- The system will automatically generate proper UUIDs for all nodes and edges
- Only provide: type, data (with type and inputs), and position

EXAMPLE USER REQUEST: "Scrape product data from Amazon"
CORRECT RESPONSE: Call generate_workflow with nodes for LAUNCH_BROWSER → PAGE_TO_HTML → EXTRACT_DATA_WITH_AI → DELIVER_VIA_WEBHOOK

EXAMPLE USER REQUEST: "Beauty Product Sales Data → Export to Visualization"  
CORRECT RESPONSE: Call generate_workflow with nodes for LAUNCH_BROWSER → PAGE_TO_HTML → EXTRACT_DATA_WITH_AI → EXPORT_TO_POWERBI, ensuring that EXTRACT_DATA_WITH_AI outputs numeric data matching the chosen chart type schema.

Available task types: LAUNCH_BROWSER, PAGE_TO_HTML, EXTRACT_DATA_WITH_AI, EXTRACT_TEXT_FROM_ELEMENT, FILL_INPUT, CLICK_ELEMENT, WAIT_FOR_ELEMENT, NAVIGATE_URL, SCROLL_TO_ELEMENT, DELIVER_VIA_WEBHOOK, READ_PROPERTY_FROM_JSON, ADD_PROPERTY_TO_JSON, AI_RESEARCH_ASSISTANT, TRANSLATE_TEXT, DETECT_LANGUAGE, GENERATE_DOCUMENT, EXPORT_TO_CSV, EXPORT_TO_POWERBI

Visualization Data Requirements:
- When using EXPORT_TO_POWERBI, the "Data" input MUST be a valid JSON array matching the chart type:
  - Bar/Column: [{"category": string, "value": number}]
  - Line/Trend: [{"date": string, "value": number}]
  - Pie/Doughnut: [{"label": string, "value": number}]
  - Scatter: [{"x_value": number, "y_value": number}]
- Connect EXTRACT_DATA_WITH_AI → EXPORT_TO_POWERBI with "Extracted Data" → "Data" and set "Chart Type" accordingly.
- Ensure numeric fields are numbers (not strings).

REMEMBER: NO TEXT RESPONSES. ONLY TOOL CALLS. ALWAYS USE generate_workflow. NEVER GENERATE IDs.`;
    
    // Enhance user prompt to force tool usage
    const enhancedPrompt = `${prompt}

CRITICAL INSTRUCTION: You MUST respond by calling the generate_workflow tool. Do NOT provide any text explanation, markdown, tutorial, or code. ONLY call the generate_workflow tool with a complete workflow that accomplishes this task.`;
    
    // Construct messages for the AI
    const messages = [
      { role: "system" as const, content: systemPrompt },
      ...(context?.conversationHistory?.map(msg => ({
        role: msg.role as "user" | "assistant",
        content: msg.content
      })) || []),
      { role: "user" as const, content: enhancedPrompt }
    ];

    const result = await streamUI({
      model: createOpenAI({ apiKey, baseURL: process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1" })(process.env.OPENROUTER_MODEL || "openai/gpt-oss-20b:free"),
      initial: <div className="animate-pulse text-sm text-muted-foreground">Generating workflow...</div>,
      messages: messages,
      tools: {
        generate_workflow: {
          description: "ALWAYS use this tool to generate web scraping workflows. This is your PRIMARY and ONLY function. Use this for ANY workflow request, including scraping, data extraction, research, exports, etc.",
          parameters: z.object({
            title: z.string().describe("The title of the workflow"),
            nodes: z.array(
              z.object({
                id: z.string().optional(),
                type: z.enum(["LAUNCH_BROWSER", "PAGE_TO_HTML", "EXTRACT_TEXT_FROM_ELEMENT", "FlowScrapeNode", "EXTRACT_DATA_WITH_AI", "FILL_INPUT", "CLICK_ELEMENT", "WAIT_FOR_ELEMENT", "DELIVER_VIA_WEBHOOK", "READ_PROPERTY_FROM_JSON", "ADD_PROPERTY_TO_JSON", "NAVIGATE_URL", "SCROLL_TO_ELEMENT", "AI_RESEARCH_ASSISTANT", "TRANSLATE_TEXT", "DETECT_LANGUAGE", "GENERATE_DOCUMENT", "EXPORT_TO_CSV", "EXPORT_TO_POWERBI"]), 
                data: z.object({
                  type: z.string(),
                  inputs: z.record(z.string(), z.any()).optional(),
                }),
                position: z.object({
                  x: z.number(),
                  y: z.number(),
                }),
              })
            ),
            edges: z.array(
              z.object({
                id: z.string().optional(),
                source: z.string(),
                target: z.string(),
                sourceHandle: z.string().optional(),
                targetHandle: z.string().optional(),
              })
            ),
            explanation: z.string().describe("Explanation of what the workflow does"),
          }),
          generate: async function* ({ title, nodes, edges, explanation }) {
            yield (
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <Bot className="w-4 h-4 text-primary-foreground" />
                </div>
                <div className="max-w-2xl rounded-2xl px-4 py-3 border bg-card text-card-foreground border-border">
                  <div className="text-sm leading-relaxed mb-4">
                    {explanation}
                  </div>
                  <div className="h-[400px] border rounded-lg bg-background overflow-hidden relative">
                      <div className="absolute inset-0 flex items-center justify-center bg-black/5 z-10">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                  </div>
                </div>
              </div>
            );

            // Process nodes to ensure they match AppNode type
            // ALWAYS generate new UUIDs - ignore any IDs from AI to ensure proper format
            const processedNodes = nodes.map((node) => {
              const newId = generateNodeId(); // Always generate fresh UUID
              return {
                ...node,
                id: newId, // Force new UUID, don't use node.id
                type: "FlowScrapeNode", // Force type for ReactFlow
                dragHandle: ".drag-handle",
                data: {
                  ...node.data,
                  inputs: node.data.inputs || {},
                },
              };
            });

            // Create ID mapping for edges (old AI IDs -> new UUIDs)
            const idMapping = new Map<string, string>();
            nodes.forEach((node, index) => {
              if (node.id) {
                idMapping.set(node.id, processedNodes[index].id);
              }
            });

            // Process edges with new IDs
            const processedEdges = edges.map((edge) => {
              const newSourceId = idMapping.get(edge.source) || edge.source;
              const newTargetId = idMapping.get(edge.target) || edge.target;
              
              return {
                ...edge,
                id: `xy-edge__${newSourceId}${edge.sourceHandle || ''}-${newTargetId}${edge.targetHandle || ''}`,
                source: newSourceId,
                target: newTargetId,
                animated: true,
              };
            });

            return (
              <div className="flex gap-3 w-full">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <Bot className="w-4 h-4 text-primary-foreground" />
                </div>
                <div className="flex-1 min-w-0 space-y-4">
                  <div className="max-w-2xl rounded-2xl px-4 py-3 border bg-card text-card-foreground border-border">
                    <div className="text-sm leading-relaxed">
                      {explanation}
                    </div>
                  </div>
                  <div className="h-[500px] border rounded-xl bg-background overflow-hidden shadow-sm">
                    <WorkflowCanvas
                      workflow={{ nodes: processedNodes as any, edges: processedEdges }}
                      title={title}
                    />
                  </div>
                </div>
              </div>
            );
          },
        },
      },
    });

    return result.value;
  } catch (error) {
    console.error("Error generating generative UI:", error);
    throw new Error("Failed to generate response");
  }
}
