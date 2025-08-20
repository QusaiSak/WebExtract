/**
 * Test page for AI Workflow Generator
 * This component integrates all the pieces:
 * 1. AI Chat Interface with streaming responses
 * 2. Workflow Canvas with ReactFlow
 * 3. Save to database functionality
 * 4. View saved workflows
 */

'use client'

import { useState, useEffect } from 'react'
import ChatInterface from '@/components/ai/ChatInterface'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Play, Eye, Calendar } from 'lucide-react'

interface SavedWorkflow {
  id: string
  name: string
  description?: string
  createdAt: string
  status: string
}

export default function AIWorkflowTestPage() {
  const [savedWorkflows, setSavedWorkflows] = useState<SavedWorkflow[]>([])
  const [loading, setLoading] = useState(true)

  // Load saved workflows
  useEffect(() => {
    loadWorkflows()
  }, [])

  const loadWorkflows = async () => {
    try {
      const response = await fetch('/api/workflows')
      if (response.ok) {
        const workflows = await response.json()
        setSavedWorkflows(workflows)
      }
    } catch (error) {
      console.error('Failed to load workflows:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleWorkflowSaved = () => {
    // Refresh the workflows list when a new one is saved
    loadWorkflows()
  }

  const runWorkflow = async (workflowId: string) => {
    try {
      const response = await fetch('/api/workflows/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer user-token'
        },
        body: JSON.stringify({ workflowId })
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Workflow execution started:', result)
        alert(`Workflow execution started! Execution ID: ${result.executionId}`)
      } else {
        throw new Error('Failed to start workflow')
      }
    } catch (error) {
      console.error('Error running workflow:', error)
      alert('Failed to run workflow')
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">AI Workflow Generator</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Generate web scraping workflows with AI, visualize them on a canvas, and save them to your workflow library.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* AI Chat Interface */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">AI Workflow Chat</h2>
          <div className="border rounded-lg">
            <ChatInterface onWorkflowSaved={handleWorkflowSaved} />
          </div>
        </div>

        {/* Saved Workflows */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Your Workflows</h2>
            <Button variant="outline" onClick={loadWorkflows}>
              Refresh
            </Button>
          </div>
          
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading workflows...</p>
              </div>
            ) : savedWorkflows.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-muted-foreground">
                    No workflows yet. Create one using the AI chat!
                  </p>
                </CardContent>
              </Card>
            ) : (
              savedWorkflows.map((workflow) => (
                <Card key={workflow.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{workflow.name}</CardTitle>
                        {workflow.description && (
                          <CardDescription className="mt-1">
                            {workflow.description}
                          </CardDescription>
                        )}
                      </div>
                      <Badge variant={workflow.status === 'DRAFT' ? 'secondary' : 'default'}>
                        {workflow.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(workflow.createdAt).toLocaleDateString()}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`/dashboard/workflows?view=${workflow.id}`, '_blank')}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => runWorkflow(workflow.id)}
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Run
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Instructions */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>How to Use</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-primary mb-2">1</div>
              <h3 className="font-semibold mb-2">Describe Your Workflow</h3>
              <p className="text-sm text-muted-foreground">
                Tell the AI what kind of web scraping workflow you want to create. Be specific about the website and data you need.
              </p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-primary mb-2">2</div>
              <h3 className="font-semibold mb-2">Review & Edit</h3>
              <p className="text-sm text-muted-foreground">
                View the generated workflow on the visual canvas. You can edit nodes, connections, and parameters.
              </p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-primary mb-2">3</div>
              <h3 className="font-semibold mb-2">Save & Run</h3>
              <p className="text-sm text-muted-foreground">
                Save your workflow to the library and run it immediately or schedule it for later execution.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
