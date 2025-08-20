'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  ReactFlow,
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  BackgroundVariant,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Play, Save, Download, Sparkles } from 'lucide-react'
import { AppNode } from '@/lib/types'
import NodeComponent from '@/app/workflow/_components/nodes/NodeComponent'
import { toast } from '@/hooks/use-toast'

const nodeTypes = {
  FlowScrapeNode: NodeComponent,
}

interface WorkflowCanvasProps {
  workflow?: {
    nodes: AppNode[]
    edges: Edge[]
  }
  title?: string
  onSave?: (workflow: { nodes: AppNode[], edges: Edge[] }, title: string) => Promise<void>
  onRun?: (workflow: { nodes: AppNode[], edges: Edge[] }) => Promise<void>
}

const WorkflowCanvas = ({ workflow, title, onSave, onRun }: WorkflowCanvasProps) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(workflow?.nodes || [])
  const [edges, setEdges, onEdgesChange] = useEdgesState(workflow?.edges || [])
  
  // Debug logging
  useEffect(() => {
    console.log('WorkflowCanvas received:', { 
      workflow, 
      nodesCount: workflow?.nodes?.length || 0, 
      edgesCount: workflow?.edges?.length || 0,
      title 
    })
  }, [workflow, title])
  const [workflowTitle, setWorkflowTitle] = useState(title || 'AI Generated Workflow')
  const [isSaving, setIsSaving] = useState(false)
  const [isRunning, setIsRunning] = useState(false)

  // Update nodes and edges when workflow prop changes
  useEffect(() => {
    if (workflow) {
      setNodes(workflow.nodes || [])
      setEdges(workflow.edges || [])
    }
  }, [workflow, setNodes, setEdges])

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  const handleSave = async () => {
    if (!onSave) {
      // Fallback: download as JSON
      const workflowData = {
        title: workflowTitle,
        nodes: nodes as AppNode[],
        edges,
        createdAt: new Date().toISOString()
      }
      
      const blob = new Blob([JSON.stringify(workflowData, null, 2)], { 
        type: 'application/json' 
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `workflow-${workflowTitle.toLowerCase().replace(/\s+/g, '-')}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      toast({
        title: 'Workflow Downloaded',
        description: 'Workflow has been downloaded as JSON file.',
      })
      return
    }

    setIsSaving(true)
    try {
      await onSave({ nodes: nodes as AppNode[], edges }, workflowTitle)
      toast({
        title: 'Workflow Saved',
        description: 'Your workflow has been saved successfully.',
      })
    } catch (error) {
      console.error('Error saving workflow:', error)
      toast({
        title: 'Save Error',
        description: 'Failed to save workflow. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleRun = async () => {
    if (!onRun) {
      toast({
        title: 'Run Not Available',
        description: 'Workflow execution is not configured.',
        variant: 'destructive',
      })
      return
    }

    if (nodes.length === 0) {
      toast({
        title: 'Empty Workflow',
        description: 'Add some nodes to your workflow before running.',
        variant: 'destructive',
      })
      return
    }

    setIsRunning(true)
    try {
      await onRun({ nodes: nodes as AppNode[], edges })
      toast({
        title: 'Workflow Started',
        description: 'Your workflow execution has begun.',
      })
    } catch (error) {
      console.error('Error running workflow:', error)
      toast({
        title: 'Execution Error',
        description: 'Failed to run workflow. Please check your configuration.',
        variant: 'destructive',
      })
    } finally {
      setIsRunning(false)
    }
  }

  const handleExportJson = () => {
    const workflowData = {
      title: workflowTitle,
      nodes: nodes as AppNode[],
      edges,
      metadata: {
        createdAt: new Date().toISOString(),
        nodeCount: nodes.length,
        edgeCount: edges.length
      }
    }
    
    const blob = new Blob([JSON.stringify(workflowData, null, 2)], { 
      type: 'application/json' 
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${workflowTitle.toLowerCase().replace(/\s+/g, '-')}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast({
      title: 'Workflow Exported',
      description: 'Workflow JSON has been downloaded.',
    })
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">{workflowTitle}</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportJson}
                className="flex items-center gap-1"
              >
                <Download className="w-4 h-4" />
                Export
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-1"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
              <Button
                size="sm"
                onClick={handleRun}
                disabled={isRunning || nodes.length === 0}
                className="flex items-center gap-1"
              >
                <Play className="w-4 h-4" />
                {isRunning ? 'Running...' : 'Run'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-sm text-muted-foreground">
            {nodes.length} nodes, {edges.length} connections
          </div>
        </CardContent>
      </Card>

      {/* ReactFlow Canvas */}
      <Card className="flex-1 overflow-hidden">
        <CardContent className="h-full p-0">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
            className="bg-background"
          >
            <Controls />
            <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
          </ReactFlow>
        </CardContent>
      </Card>
    </div>
  )
}

export default WorkflowCanvas
