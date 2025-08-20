import { streamText } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { SYSTEM_PROMPT, generateWorkflowPrompt, modifyWorkflowPrompt } from "./prompts";
import { AppNode } from "./types";
import { Edge } from "@xyflow/react";
import { getOpenRouterApiKey } from "./credential-helper";

export interface WorkflowContext {
  currentWorkflow?: { nodes: AppNode[], edges: Edge[] }
  conversationHistory?: any[]
}

// ✅ Enhanced workflow generation with proper prompts
export async function generateStreamingWorkflow(
  prompt: string, 
  context?: WorkflowContext
) {
  try {
    // Try to get API key from credentials first, fallback to environment
    let apiKey = await getOpenRouterApiKey();
    if (!apiKey) {
      apiKey = process.env.OPENROUTER_API_KEY || null;
    }

    if (!apiKey) {
      throw new Error("OpenRouter API key not found in credentials or environment");
    }

    const openrouter = createOpenRouter({
      apiKey,
    });

    const systemPrompt = SYSTEM_PROMPT
    const userPrompt = context?.currentWorkflow 
      ? modifyWorkflowPrompt(prompt, context.currentWorkflow, context.conversationHistory)
      : generateWorkflowPrompt(prompt, context)

    const result = await streamText({
      model: openrouter("openai/gpt-4o-mini"),
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
    // Try to get API key from credentials first, fallback to environment
    let apiKey = await getOpenRouterApiKey();
    if (!apiKey) {
      apiKey = process.env.OPENROUTER_API_KEY || null;
    }

    if (!apiKey) {
      throw new Error("OpenRouter API key not found in credentials or environment");
    }

    const openrouter = createOpenRouter({
      apiKey,
    });

    const result = await streamText({
      model: openrouter("openai/gpt-4o-mini"),
      prompt: `You are an AI assistant helping with web scraping workflows. Respond helpfully to: ${prompt}`,
      temperature: 0.7,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Error generating streaming response:", error);
    throw new Error("Failed to generate response");
  }
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