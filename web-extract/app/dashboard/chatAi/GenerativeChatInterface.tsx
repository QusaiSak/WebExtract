"use client";

import { useState, useRef, useEffect } from "react";
import { useUIState, useActions } from "ai/rsc";
import { AI } from "./ai-provider"; // We need to create this provider wrapper
import { Button } from "@/components/ui/button";
import { Send, Bot, User, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export default function GenerativeChatInterface() {
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useUIState<typeof AI>();
  const { submitUserMessage } = useActions<typeof AI>();
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const value = inputValue.trim();
    setInputValue("");
    setIsLoading(true);

    // Add user message to UI state
    setMessages((currentMessages) => [
      ...currentMessages,
      {
        id: Date.now().toString(),
        role: "user",
        display: (
          <div className="flex gap-3 justify-end">
            <div className="max-w-2xl rounded-2xl px-4 py-3 border bg-primary text-primary-foreground border-primary">
              <div className="text-sm leading-relaxed">{value}</div>
            </div>
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
              <User className="w-4 h-4 text-secondary-foreground" />
            </div>
          </div>
        ),
      },
    ]);

    try {
      // Submit message to server action
      const response = await submitUserMessage(value);
      setMessages((currentMessages) => [...currentMessages, response]);
    } catch (error) {
      console.error("Error submitting message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-border bg-card px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              AI Workflow Generator
            </h1>
            <p className="text-sm text-muted-foreground">
              Generative UI Enabled
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[50vh] text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                <Bot className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold text-foreground mb-2">
                Start creating workflows
              </h2>
              <p className="text-muted-foreground max-w-md">
                Describe what you want to scrape, and I'll generate the workflow for you instantly.
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div key={message.id} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                {message.display}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="flex-shrink-0 border-t border-border bg-card p-6">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Describe the workflow you want to create..."
              className="flex-1 px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
              disabled={isLoading}
            />
            <Button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className="h-[46px] px-6 rounded-xl"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
