import { TaskType, AppNode, TaskParam } from '@/lib/types'
import { Edge } from '@xyflow/react'
import { TaskRegistry } from '@/lib/workflow/task/Registry'

export interface WorkflowResponse {
  workflow?: {
    nodes: AppNode[]
    edges: Edge[]
  }
  explanation?: string
  error?: string
}

export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

// Generate unique node ID
export function generateNodeId(): string {
  return crypto.randomUUID()
}

// Parse AI response to extract workflow JSON (streaming-safe)
export function parseAIWorkflow(aiResponse: string, isStreaming: boolean = false): WorkflowResponse {
  try {
    // For streaming, be more cautious about parsing incomplete JSON
    if (isStreaming) {
      // Don't try to parse if the response seems incomplete
      const openBraces = (aiResponse.match(/\{/g) || []).length
      const closeBraces = (aiResponse.match(/\}/g) || []).length
      
      // If there are unmatched braces, likely incomplete
      if (openBraces > closeBraces) {
        return { error: 'JSON streaming in progress' }
      }
    }

    // Try to extract JSON from response
    // Look for both direct JSON and workflow-wrapped JSON
    let jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
    
    if (!jsonMatch) {
      return { error: 'No JSON found in AI response' }
    }

    const parsed = JSON.parse(jsonMatch[0])
    
    // Handle direct workflow format (nodes and edges at root level)
    if (parsed.nodes && parsed.edges) {
      // Process and validate edges, generate handles if missing
      const processedNodes = parsed.nodes.map((node: any) => ({
        ...node,
        id: node.id || generateNodeId(),
        type: 'FlowScrapeNode',
        dragHandle: '.drag-handle',
        data: {
          ...node.data,
          inputs: node.data.inputs || {}
        }
      }))

      const processedEdges = parsed.edges?.map((edge: any) => ({
        ...edge,
        id: edge.id || `edge-${edge.source}-${edge.target}`,
        animated: true
      })) || []

      // If edges are missing proper handles, generate them automatically
      const edgesNeedHandles = processedEdges.some((edge: any) => 
        !edge.sourceHandle || !edge.targetHandle
      )
      
      console.log('Processing direct format - edges:', processedEdges.length, 'edgesNeedHandles:', edgesNeedHandles)
      
      let finalEdges = processedEdges
      if (edgesNeedHandles || processedEdges.length === 0) {
        console.log('Generating auto edges because:', { edgesNeedHandles, noEdges: processedEdges.length === 0 })
        // Use auto-generated edges with proper handles
        finalEdges = generateAutoEdges(processedNodes)
      }

      console.log('Final edges (direct format):', finalEdges)

      return {
        workflow: {
          nodes: processedNodes,
          edges: finalEdges
        },
        explanation: parsed.explanation || 'Workflow generated successfully'
      }
    }
    
    // Handle wrapped workflow format (workflow object containing nodes and edges)
    if (parsed.workflow && parsed.workflow.nodes && parsed.workflow.edges) {
      // Ensure all nodes have proper structure
      const processedNodes = parsed.workflow.nodes.map((node: any) => ({
        ...node,
        id: node.id || generateNodeId(),
        type: 'FlowScrapeNode',
        dragHandle: '.drag-handle',
        data: {
          ...node.data,
          inputs: node.data.inputs || {}
        }
      }))

      // Process and validate edges, generate handles if missing
      const processedEdges = parsed.workflow.edges?.map((edge: any) => ({
        ...edge,
        id: edge.id || `edge-${edge.source}-${edge.target}`,
        animated: true
      })) || []

      // If edges are missing proper handles, generate them automatically
      const edgesNeedHandles = processedEdges.some((edge: any) => 
        !edge.sourceHandle || !edge.targetHandle
      )
      
      console.log('Processing wrapped format - edges:', processedEdges.length, 'edgesNeedHandles:', edgesNeedHandles)
      
      let finalEdges = processedEdges
      if (edgesNeedHandles || processedEdges.length === 0) {
        console.log('Generating auto edges because:', { edgesNeedHandles, noEdges: processedEdges.length === 0 })
        // Use auto-generated edges with proper handles
        finalEdges = generateAutoEdges(processedNodes)
      }

      console.log('Final edges (wrapped format):', finalEdges)

      return {
        workflow: {
          nodes: processedNodes,
          edges: finalEdges
        },
        explanation: parsed.explanation || 'Workflow generated successfully'
      }
    }

    return { error: 'Invalid workflow structure in response' }
  } catch (error) {
    console.error('Error parsing AI response:', error)
    return { error: 'Failed to parse AI response' }
  }
}

// Validate workflow structure
export function validateWorkflow(workflow: { nodes: AppNode[], edges: Edge[] }): ValidationResult {
  const errors: string[] = []

  if (!workflow.nodes || workflow.nodes.length === 0) {
    errors.push('Workflow must have at least one node')
    return { isValid: false, errors }
  }

  // Check if there's an entry point
  const hasEntryPoint = workflow.nodes.some(node => {
    return node.data.type === TaskType.LAUNCH_BROWSER
  })

  if (!hasEntryPoint) {
    errors.push('Workflow must start with LAUNCH_BROWSER task')
  }

  // Validate each node
  workflow.nodes.forEach((node, index) => {
    if (!node.id) {
      errors.push(`Node ${index + 1} is missing an ID`)
    }
    
    if (!node.data || !node.data.type) {
      errors.push(`Node ${index + 1} is missing task type`)
    }

    // Check if task type is valid
    if (node.data.type && !Object.values(TaskType).includes(node.data.type)) {
      errors.push(`Node ${index + 1} has invalid task type: ${node.data.type}`)
    }

    if (!node.position) {
      errors.push(`Node ${index + 1} is missing position`)
    }
  })

  // Validate edges
  workflow.edges.forEach((edge, index) => {
    if (!edge.id) {
      errors.push(`Edge ${index + 1} is missing an ID`)
    }
    
    if (!edge.source || !edge.target) {
      errors.push(`Edge ${index + 1} is missing source or target`)
    }

    // Check if source and target nodes exist
    const sourceExists = workflow.nodes.some(node => node.id === edge.source)
    const targetExists = workflow.nodes.some(node => node.id === edge.target)

    if (!sourceExists) {
      errors.push(`Edge ${index + 1} references non-existent source node: ${edge.source}`)
    }
    
    if (!targetExists) {
      errors.push(`Edge ${index + 1} references non-existent target node: ${edge.target}`)
    }
  })

  return {
    isValid: errors.length === 0,
    errors
  }
}

// Optimize workflow layout - position nodes in a logical flow
export function optimizeWorkflowLayout(nodes: AppNode[], edges: Edge[]): { nodes: AppNode[], edges: Edge[] } {
  const nodeMap = new Map(nodes.map(node => [node.id, node]))
  const processedNodes: AppNode[] = []
  const visited = new Set<string>()

  // Find entry point
  const entryNode = nodes.find(node => node.data.type === TaskType.LAUNCH_BROWSER)
  if (!entryNode) {
    // If no entry point, just return nodes with basic positioning
    return {
      nodes: nodes.map((node, index) => ({
        ...node,
        position: { x: index * 400, y: 0 }
      })),
      edges
    }
  }

  // Position nodes in a hierarchical layout
  function positionNodeAndChildren(nodeId: string, x: number, y: number, level: number = 0) {
    if (visited.has(nodeId)) return y

    const node = nodeMap.get(nodeId)
    if (!node) return y

    visited.add(nodeId)
    
    // Position current node
    processedNodes.push({
      ...node,
      position: { x, y }
    })

    // Find child nodes
    const childEdges = edges.filter(edge => edge.source === nodeId)
    let currentY = y + 300 // Space between levels
    
    childEdges.forEach((edge, index) => {
      const childX = x + (index * 400) // Space between siblings
      currentY = Math.max(currentY, positionNodeAndChildren(edge.target, childX, currentY, level + 1))
    })

    return Math.max(y, currentY)
  }

  // Start positioning from entry node
  positionNodeAndChildren(entryNode.id, 0, 0)

  // Add any remaining unvisited nodes
  let currentX = 0
  let currentY = 600
  nodes.forEach(node => {
    if (!visited.has(node.id)) {
      processedNodes.push({
        ...node,
        position: { x: currentX, y: currentY }
      })
      currentX += 400
    }
  })

  return { nodes: processedNodes, edges }
}

// Convert workflow for streaming updates
export function parseStreamingWorkflow(streamContent: string): WorkflowResponse {
  // Handle partial JSON responses during streaming
  try {
    // Look for complete JSON blocks
    const jsonBlocks = streamContent.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g) || []
    
    for (const block of jsonBlocks.reverse()) { // Try latest block first
      try {
        const parsed = JSON.parse(block)
        if (parsed.workflow) {
          return parseAIWorkflow(block)
        }
      } catch {
        continue
      }
    }

    // If no complete JSON, return partial content
    return { explanation: streamContent }
  } catch (error) {
    return { explanation: streamContent }
  }
}

// Generate edges automatically based on node sequence with proper handles
export function generateAutoEdges(nodes: AppNode[]): Edge[] {
  console.log('Generating auto edges for nodes:', nodes.length)
  const edges: Edge[] = []
  
  // Sort nodes by position (left to right, top to bottom)
  const sortedNodes = [...nodes].sort((a, b) => {
    if (a.position.y !== b.position.y) {
      return a.position.y - b.position.y
    }
    return a.position.x - b.position.x
  })

  console.log('Sorted nodes:', sortedNodes.map(n => ({ id: n.id, type: n.data.type, position: n.position })))

  // Create sequential edges with proper handles
  for (let i = 0; i < sortedNodes.length - 1; i++) {
    const sourceNode = sortedNodes[i]
    const targetNode = sortedNodes[i + 1]
    
    console.log(`Creating edge from ${sourceNode.data.type} to ${targetNode.data.type}`)
    
    // Get task definitions to find available handles
    const sourceTask = TaskRegistry[sourceNode.data.type]
    const targetTask = TaskRegistry[targetNode.data.type]
    
    console.log('Source task:', sourceTask?.type, 'outputs:', sourceTask?.outputs)
    console.log('Target task:', targetTask?.type, 'inputs:', targetTask?.inputs)
    
    // Use the first output from source and first input from target that match types
    const sourceOutput = sourceTask?.outputs?.[0]
    const targetInput = targetTask?.inputs?.find((input: TaskParam) => !input.hideHandle)
    
    console.log('Selected handles - source:', sourceOutput?.name, 'target:', targetInput?.name)
    
    if (sourceOutput && targetInput) {
      const edge = {
        id: `edge-${sourceNode.id}-${targetNode.id}`,
        source: sourceNode.id,
        target: targetNode.id,
        sourceHandle: sourceOutput.name,
        targetHandle: targetInput.name,
        animated: true
      }
      console.log('Created edge with handles:', edge)
      edges.push(edge)
    } else {
      // Fallback without handles if no compatible types found
      const edge = {
        id: `edge-${sourceNode.id}-${targetNode.id}`,
        source: sourceNode.id,
        target: targetNode.id,
        animated: true
      }
      console.log('Created edge without handles (fallback):', edge)
      edges.push(edge)
    }
  }

  console.log('Generated edges:', edges)
  return edges
}
