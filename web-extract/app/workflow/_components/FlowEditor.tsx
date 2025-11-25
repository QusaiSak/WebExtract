"use client";
import { Workflow } from "@prisma/client";
import {
  addEdge,
  Background,
  BackgroundVariant,
  Connection,
  Controls,
  Edge,
  getOutgoers,
  ReactFlow,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from "@xyflow/react";
import React, { useCallback, useEffect, useState, useRef } from "react";
import "@xyflow/react/dist/style.css";
import { AppNode, TaskType } from "@/lib/types";
import { createFlowNode } from "@/lib/workflow/CreateFlowNode";
import NodeComponent from "./nodes/NodeComponent";
import DeletableEdge from "./edges/DeletableEdge";
import { TaskRegistry } from "@/lib/workflow/task/Registry";
import { parseAIWorkflow } from "@/lib/workflow-ai";
import { Button } from "@/components/ui/button";
import { updateWorkFlow } from "@/actions/workflows";

const nodeTypes = {
  FlowScrapeNode: NodeComponent,
};
const edgeTypes = {
  default: DeletableEdge,
};

const snapGrid: [number, number] = [50, 50];
const fitViewOptions = { padding: 1 };

function FlowEditor({ workflow }: { workflow: Workflow }) {
  const [nodes, setNodes, onNodesChange] = useNodesState<AppNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const { setViewport, screenToFlowPosition, updateNodeData, fitView } = useReactFlow();

  // AI panel state
  const [aiOpen, setAiOpen] = useState(false);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiStreamingText, setAiStreamingText] = useState("");
  const streamingWorkflowRef = useRef<{ nodes: AppNode[]; edges: Edge[] } | null>(null);
  const sseRef = useRef<EventSource | null>(null);

  useEffect(() => {
    try {
      const flow = JSON.parse(workflow.definition);
      if (!flow) return;
      setNodes(flow.nodes || []);
      setEdges(flow.edges || []);

      //TODO:  Optional flow for restoring the view-port used by user for project
      // if (!flow.viewport) return;
      // const { x = 0, y = 0, zoom = 1 } = flow.viewport;
      // setViewport({ x, y, zoom });
    } catch (error) {}
  }, [workflow, setEdges, setNodes, setViewport]);

  // Live updates via SSE channel per workflow id
  // DISABLED: The /api/ws endpoint is for execution phase logs, not workflow updates
  // Workflows still save/load properly without this real-time sync feature
  const sseActive = false; // !!sseRef.current;
  
  // Commented out SSE connection - can be re-enabled when proper workflow SSE endpoint is created
  /*
  useEffect(() => {
    if (!workflow?.id) return;
    try { sseRef.current?.close() } catch {}
    let url = '';
    if (typeof window !== 'undefined') {
      const u = new URL('/api/ws', window.location.href);
      u.searchParams.set('workflowId', workflow.id);
      url = u.toString();
    }
    const es = new EventSource(url, { withCredentials: false });
    sseRef.current = es;
    es.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        if (msg?.type === 'workflow.updated' && msg?.payload) {
          const { definition } = msg.payload;
          const parsed = typeof definition === 'string' ? JSON.parse(definition) : definition;
          if (parsed?.nodes && parsed?.edges) {
            setNodes(parsed.nodes);
            setEdges(parsed.edges);
            try { fitView({ padding: 0.9 }) } catch {}
          }
        }
      } catch {}
    };
    es.onerror = () => { try { es.close() } catch {}; sseRef.current = null };
    return () => { try { es.close() } catch {} };
  }, [workflow?.id, setNodes, setEdges, fitView]);
  */

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const taskType = event.dataTransfer.getData("application/reactflow");
      if (typeof taskType === undefined || !taskType) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode = createFlowNode(taskType as TaskType, position);
      setNodes((nds) => nds.concat(newNode));
    },
    [setNodes, screenToFlowPosition]
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => addEdge({ ...connection, animated: true }, eds));
      if (!connection.targetHandle) return;
      const node = nodes.find((node) => node.id === connection.target);
      if (!node) return;
      const nodeInputs = node.data.inputs;
      updateNodeData(node.id, {
        inputs: {
          ...nodeInputs,
          [connection.targetHandle]: "",
        },
      });
    },
    [setEdges, updateNodeData, nodes]
  );

  const isValidConnection = useCallback(
    (connection: Edge | Connection) => {
      // No self-connection
      if (connection.source === connection.target) return false;

      // Same type connections
      const sourceNode = nodes.find((node) => node.id === connection.source);
      const targetNode = nodes.find((node) => node.id === connection.target);

      if (!sourceNode || !targetNode) {
        console.log("Source or target not found");
        return false;
      }

      const sourceTask = TaskRegistry[sourceNode.data.type];
      const targetTask = TaskRegistry[targetNode.data.type];

      const output = sourceTask.outputs.find(
        (o) => o.name === (connection as any).sourceHandle
      );
      const input = targetTask.inputs.find(
        (i) => i.name === (connection as any).targetHandle
      );

      if (input?.type !== output?.type) {
        console.log("Invalid connection");
        return false;
      }

      // Avoid cyclic connections :: DOCS_GRAPH
      const hasCycle = (node: AppNode, visited = new Set()) => {
        if (visited.has(node.id)) return false;

        visited.add(node.id);

        for (const outgoer of getOutgoers(node, nodes, edges)) {
          if (outgoer.id === connection.source) return true;
          if (hasCycle(outgoer, visited)) return true;
        }
      };

      const detectedCycle = hasCycle(targetNode);
      return !detectedCycle;
    },
    [nodes, edges]
  );

  // Apply surgical modifications and preserve important inputs
  const smartMerge = useCallback(
    (incoming: { nodes: AppNode[]; edges: Edge[] }): { nodes: AppNode[]; edges: Edge[] } => {
      if (!incoming?.nodes?.length) return { nodes, edges };

      // Preserve key inputs
      const originalBrowser = nodes.find(
        (n) => n.data?.inputs && (n.data.inputs as any)["Website Url"]
      );
      const originalWebhook = nodes.find(
        (n) => n.data?.type === TaskType.DELIVER_VIA_WEBHOOK
      );
      const originalWebhookUrl = originalWebhook?.data?.inputs?.["Target URL"] as string | undefined;
      const originalSiteUrl = originalBrowser?.data?.inputs?.["Website Url"] as string | undefined;

      const used = new Set<string>();
      const place = (pos?: { x: number; y: number }, index?: number) => {
        let x = pos?.x ?? ((index ?? 0) * 420);
        let y = pos?.y ?? 0;
        let key = `${x},${y}`;
        // avoid overlap
        while (used.has(key)) {
          x += 320;
          key = `${x},${y}`;
        }
        used.add(key);
        return { x, y };
      };

      // Seed existing positions to avoid stacking over them
      nodes.forEach((n) => used.add(`${n.position?.x ?? 0},${n.position?.y ?? 0}`));

      const updatedNodes = incoming.nodes.map((n, idx) => {
        const isBrowser = !!n.data && n.data.type === TaskType.LAUNCH_BROWSER;
        const isWebhook = !!n.data && n.data.type === TaskType.DELIVER_VIA_WEBHOOK;
        let data = { ...n.data } as any;

        // Preserve URLs
        if (data?.inputs) {
          if (isBrowser && originalSiteUrl) {
            data.inputs["Website Url"] = originalSiteUrl;
          }
          if (isWebhook && originalWebhookUrl) {
            data.inputs["Target URL"] = originalWebhookUrl;
          }
        }

        // Positioning: prefer incoming; only lock browser/webhook to old positions
        let position = n.position;
        if (isBrowser && originalBrowser?.position) position = originalBrowser.position;
        if (isWebhook && originalWebhook?.position) position = originalWebhook.position;
        position = place(position, idx);

        return { ...n, data, position } as AppNode;
      });

      const nextEdges = (incoming.edges && incoming.edges.length > 0) ? incoming.edges : edges;

      return { nodes: updatedNodes, edges: nextEdges };
    },
    [nodes, edges]
  );

  const cleanExplanation = useCallback((text: string) => {
    if (!text) return '';
    return text
      .replace(/```[\s\S]*?```/g, '') // code fences
      .replace(/\{[\s\S]*?\}/g, (m) => (m.length > 200 ? '' : m)) // large JSON blocks
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }, []);

  const sendAiPrompt = useCallback(async () => {
    if (!aiInput.trim() || aiLoading) return;
    setAiLoading(true);
    setAiStreamingText("");
    streamingWorkflowRef.current = null;

    const message = aiInput.trim();
    setAiInput("");

    try {
      const intent = nodes.length > 0 ? "modify" : "create";
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          context: {
            currentWorkflow: { nodes, edges },
            intent,
            previousWorkflows: [],
            workflowId: workflow.id,
          },
        }),
      });

      if (!res.ok) throw new Error(await res.text());
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");

      let accumulated = "";

      // Process streaming response
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = new TextDecoder().decode(value);
        accumulated += chunk;
        setAiStreamingText(cleanExplanation(accumulated));

        // Try parsing during streaming (but don't apply until complete)
        const streamingParsed = parseAIWorkflow(accumulated, true);
        if (streamingParsed.workflow) {
          streamingWorkflowRef.current = streamingParsed.workflow as any;
        }
      }

      console.log('Complete AI response received:', {
        totalLength: accumulated.length,
        preview: accumulated.substring(0, 300) + '...'
      });

      // Parse the complete response
      const finalParsed = parseAIWorkflow(accumulated, false);
      let incoming = finalParsed.workflow as any;
      
      if ((!incoming || !incoming.nodes?.length) && streamingWorkflowRef.current) {
        console.log('Using streaming workflow as fallback');
        incoming = streamingWorkflowRef.current as any;
      }

      if (incoming?.nodes?.length > 0) {
        console.log('Applying workflow with nodes:', incoming.nodes.length);
        const processed = smartMerge(incoming);
        setNodes(processed.nodes);
        setEdges(processed.edges);
        
        // Save the updated workflow
        try {
          await updateWorkFlow(workflow.id, JSON.stringify(processed));
          
          // Refresh the workflow from database
          if (!sseActive) {
            const wfRes = await fetch(`/api/workflows?id=${workflow.id}`, { cache: 'no-store' });
            if (wfRes.ok) {
              const wf = await wfRes.json();
              try {
                const parsed = JSON.parse(wf.definition);
                if (parsed?.nodes && parsed?.edges) {
                  setNodes(parsed.nodes);
                  setEdges(parsed.edges);
                  try { fitView({ padding: 0.9 }); } catch {}
                }
              } catch {}
            }
          }
        } catch (e) {
          console.warn('Failed to persist AI changes to workflow:', e);
        }
      } else {
        console.warn('No valid workflow nodes found in AI response');
      }
    } catch (err) {
      console.error("AI prompt failed:", err);
    } finally {
      setAiLoading(false);
      setAiStreamingText((s) => (s || "").trim());
    }
  }, [aiInput, aiLoading, nodes, edges, smartMerge, setNodes, setEdges, workflow.id, cleanExplanation, sseActive, fitView]);

  // Toggle panel via Cmd+/
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "/") {
        e.preventDefault();
        setAiOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <main className="h-full w-full relative">
      {/* AI Side Panel */}
      <div
        className={`absolute top-0 right-0 h-full w-[360px] max-w-[90vw] bg-white border-l border-gray-200 shadow-lg transition-transform duration-200 z-20 ${
          aiOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-3 border-b">
          <div className="font-medium">AI Assistant</div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setAiOpen(false)}>
              Close
            </Button>
          </div>
        </div>
        <div className="p-3 space-y-3 h-full flex flex-col">
          <div className="text-xs text-muted-foreground">
            Type what to build or change. Example: "Add an AI cleanup step before webhook, keep the same URLs".
          </div>
          <textarea
            value={aiInput}
            onChange={(e) => setAiInput(e.target.value)}
            placeholder="Describe your change... (Cmd+Enter to send)"
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                e.preventDefault();
                sendAiPrompt();
              }
            }}
            className="min-h-[96px] max-h-[140px] w-full p-2 border rounded-md text-sm"
          />
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setAiOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={sendAiPrompt} disabled={aiLoading || !aiInput.trim()}>
              {aiLoading ? "Working..." : "Send"}
            </Button>
          </div>
          {aiStreamingText && (
            <div className="mt-2 p-2 border rounded-md bg-gray-50 text-xs overflow-auto flex-1">
              {aiStreamingText}
            </div>
          )}
        </div>
      </div>

      {/* Toggle Button */}
      <div className="absolute top-2 right-2 z-10">
        <Button size="sm" variant="outline" onClick={() => setAiOpen((v) => !v)}>
          {aiOpen ? "Hide AI (Cmd+/)" : "Show AI (Cmd+/)"}
        </Button>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onEdgesChange={onEdgesChange}
        onNodesChange={onNodesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        snapToGrid
        snapGrid={snapGrid}
        fitView
        fitViewOptions={fitViewOptions}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onConnect={onConnect}
        isValidConnection={isValidConnection}
      >
        <Controls position="top-left" fitViewOptions={fitViewOptions} />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
      </ReactFlow>
    </main>
  );
}

export default FlowEditor;
