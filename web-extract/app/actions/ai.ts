"use server";

import { generateGenerativeUI } from "@/lib/openrouter";
import { getMutableAIState } from "ai/rsc";
import { ReactNode } from "react";

// Define the AI state and UI state types
export type AIState = {
  role: "user" | "assistant" | "system";
  content: string;
  id?: string;
  name?: string;
}[];

export type UIState = {
  id: string;
  role: "user" | "assistant";
  display: ReactNode;
}[];

export async function submitUserMessage(content: string): Promise<UIState[number]> {
  "use server";

  // We need to get the AI state to pass history
  // Note: In a real app, you might want to fetch history from DB here too
  
  // Since we are not using the full AI Provider context in the same way as the Vercel example 
  // (we are mixing existing logic), we will pass a simplified context.
  // Ideally, we should use getMutableAIState() if we are inside the AI Provider.
  
  // Let's assume we are inside the AI Provider context
  const aiState = getMutableAIState();

  // Update AI state with user message
  aiState.update([
    ...aiState.get(),
    {
      role: "user",
      content,
    },
  ]);

  const history = aiState.get().map((msg: any) => ({
    role: msg.role,
    content: msg.content
  }));

  const uiComponent = await generateGenerativeUI(content, {
    conversationHistory: history
  });

  // Update AI state with assistant response (we only have the component, 
  // so we might want to store a text representation or just the component ID if needed)
  aiState.done([
    ...aiState.get(),
    {
      role: "assistant",
      content: "Generated UI Component", // Placeholder for history
    },
  ]);

  return {
    id: Date.now().toString(),
    role: "assistant",
    display: uiComponent,
  };
}
