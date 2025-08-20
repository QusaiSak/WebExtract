'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  Clock, 
  Zap, 
  ArrowRight, 
  Info, 
  Play, 
  Copy,
  Download,
  Save
} from 'lucide-react'
import { TaskType } from '@/lib/types'
import { COMPONENT_LIBRARY } from './ComponentPicker'

interface WorkflowDetailsProps {
  workflow: {
    nodes: any[]
    edges: any[]
  }
  explanation?: string
  onSave?: () => void
  onRun?: () => void
  onCopy?: () => void
  onDownload?: () => void
}

export default function WorkflowDetails({ 
  workflow, 
  explanation, 
  onSave, 
  onRun, 
  onCopy, 
  onDownload 
}: WorkflowDetailsProps) {
  const getComponentInfo = (taskType: TaskType) => {
    return COMPONENT_LIBRARY.find((comp: any) => comp.type === taskType)
  }

  const totalCredits = workflow.nodes.reduce((sum, node) => {
    const componentInfo = getComponentInfo(node.data.type)
    return sum + (componentInfo?.credits || 0)
  }, 0)

  const getFlowPath = () => {
    // Sort nodes by position to show flow sequence
    const sortedNodes = [...workflow.nodes].sort((a, b) => {
      if (a.position.y !== b.position.y) {
        return a.position.y - b.position.y
      }
      return a.position.x - b.position.x
    })
    
    return sortedNodes
  }

  const flowPath = getFlowPath()

  return (
    <div className="space-y-6">
      {/* Workflow Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-600" />
              Workflow Overview
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1">
                <Clock className="h-3 w-3" />
                {workflow.nodes.length} steps
              </Badge>
              <Badge variant="outline" className="gap-1">
                <Zap className="h-3 w-3" />
                {totalCredits} credits
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {explanation && (
            <p className="text-muted-foreground mb-4">{explanation}</p>
          )}
          
          {/* Action Buttons */}
          <div className="flex gap-2 flex-wrap">
            {onRun && (
              <Button onClick={onRun} className="gap-2">
                <Play className="h-4 w-4" />
                Run Workflow
              </Button>
            )}
            {onSave && (
              <Button variant="outline" onClick={onSave} className="gap-2">
                <Save className="h-4 w-4" />
                Save
              </Button>
            )}
            {onCopy && (
              <Button variant="outline" onClick={onCopy} className="gap-2">
                <Copy className="h-4 w-4" />
                Copy JSON
              </Button>
            )}
            {onDownload && (
              <Button variant="outline" onClick={onDownload} className="gap-2">
                <Download className="h-4 w-4" />
                Download
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Workflow Flow */}
      <Card>
        <CardHeader>
          <CardTitle>Execution Flow</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64">
            <div className="space-y-4">
              {flowPath.map((node, index) => {
                const componentInfo = getComponentInfo(node.data.type)
                const IconComponent = componentInfo?.icon
                
                return (
                  <div key={node.id}>
                    <div className="flex items-start gap-3 p-3 rounded-lg border">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-medium text-blue-600">
                        {index + 1}
                      </div>
                      
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          {IconComponent && <IconComponent className="h-4 w-4 text-blue-600" />}
                          <h4 className="font-medium">{componentInfo?.name || node.data.type}</h4>
                          <Badge variant="secondary" className="text-xs">
                            {componentInfo?.credits} credits
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-muted-foreground">
                          {componentInfo?.description}
                        </p>
                        
                        {/* Show configured inputs */}
                        {node.data.inputs && Object.keys(node.data.inputs).length > 0 && (
                          <div className="text-xs space-y-1">
                            <span className="font-medium text-muted-foreground">Configuration:</span>
                            {Object.entries(node.data.inputs).map(([key, value]: [string, any]) => (
                              value && (
                                <div key={key} className="flex gap-2">
                                  <span className="font-medium">{key}:</span>
                                  <span className="text-muted-foreground truncate max-w-xs">
                                    {String(value)}
                                  </span>
                                </div>
                              )
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {index < flowPath.length - 1 && (
                      <div className="flex justify-center py-2">
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Component Details */}
      <Card>
        <CardHeader>
          <CardTitle>Components Used</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {workflow.nodes.map((node) => {
              const componentInfo = getComponentInfo(node.data.type)
              const IconComponent = componentInfo?.icon
              
              return (
                <div key={node.id} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50">
                  {IconComponent && <IconComponent className="h-5 w-5 text-blue-600 mt-1" />}
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{componentInfo?.name}</h4>
                      <Badge variant="outline">{componentInfo?.credits} credits</Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground">
                      {componentInfo?.detailedDescription}
                    </p>
                    
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <div>
                        <span className="font-medium">Inputs:</span> {componentInfo?.inputs.join(', ')}
                      </div>
                      <div>
                        <span className="font-medium">Outputs:</span> {
                          componentInfo?.outputs.length ? componentInfo.outputs.join(', ') : 'None'
                        }
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Connection Details */}
      {workflow.edges && workflow.edges.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Data Flow Connections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {workflow.edges.map((edge, index) => {
                const sourceNode = workflow.nodes.find(n => n.id === edge.source)
                const targetNode = workflow.nodes.find(n => n.id === edge.target)
                const sourceComponent = getComponentInfo(sourceNode?.data.type)
                const targetComponent = getComponentInfo(targetNode?.data.type)
                
                return (
                  <div key={edge.id} className="flex items-center gap-2 text-sm">
                    <span className="font-medium">{sourceComponent?.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {edge.sourceHandle}
                    </Badge>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    <span className="font-medium">{targetComponent?.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {edge.targetHandle}
                    </Badge>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
