import { TaskType, AppNode, TaskParam } from '@/lib/types'
import { Edge } from '@xyflow/react'
import { TaskRegistry } from '@/lib/workflow/task/Registry'

// Normalize smart quotes and other unicode quotes to standard double quotes
function normalizeQuotes(input: string): string {
  return input
    .replace(/[“”„‟«»]/g, '"')
    .replace(/[‘’‚‛‹›]/g, '"')
}

function stripComments(input: string): string {
  return input
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|\s)\/\/.*$/gm, '')
}

function extractBalancedJson(input: string): string {
  let start = -1
  let end = -1
  let stack: string[] = []
  let inString = false
  let escaped = false
  for (let i = 0; i < input.length; i++) {
    const ch = input[i]
    if (inString) {
      if (escaped) {
        escaped = false
      } else if (ch === '\\') {
        escaped = true
      } else if (ch === '"') {
        inString = false
      }
      continue
    }
    if (ch === '"') { inString = true; continue }
    if (ch === '{' || ch === '[') {
      if (start === -1) start = i
      stack.push(ch)
      continue
    }
    if (ch === '}' || ch === ']') {
      if (stack.length === 0) continue
      const top = stack[stack.length - 1]
      if ((ch === '}' && top === '{') || (ch === ']' && top === '[')) {
        stack.pop()
        if (stack.length === 0) { end = i; break }
      }
    }
  }
  let out = (start !== -1) ? input.slice(start, end !== -1 ? end + 1 : input.length) : input.trim()
  // Auto-close if unfinished
  if (inString) out += '"'
  while (stack.length) {
    const closer = stack.pop() === '{' ? '}' : ']'
    out += closer
  }
  return out
}

// Remove UI-only fields that commonly break parsing
function stripMeasured(input: string): string {
  return input.replace(/\"measured\"\s*:\s*\{[^}]*\}\s*,?/g, '')
}

// Balance an array starting at the given '[' index
function extractBalancedArrayFrom(input: string, startIndex: number): string {
  let i = startIndex
  let stack: string[] = []
  let inString = false
  let escaped = false
  let out = ''
  for (; i < input.length; i++) {
    const ch = input[i]
    out += ch
    if (inString) {
      if (escaped) {
        escaped = false
      } else if (ch === '\\') {
        escaped = true
      } else if (ch === '"') {
        inString = false
      }
      continue
    }
    if (ch === '"') { inString = true; continue }
    if (ch === '[' || ch === '{') stack.push(ch)
    else if (ch === ']' || ch === '}') {
      const top = stack[stack.length - 1]
      if ((ch === ']' && top === '[') || (ch === '}' && top === '{')) {
        stack.pop()
        if (stack.length === 0 && ch === ']') {
          break
        }
      }
    }
  }
  // If not closed, close it
  if (stack.length > 0) {
    // close any open string
    if (inString) out += '"'
    while (stack.length) {
      const closer = stack.pop() === '[' ? ']' : '}'
      out += closer
    }
  }
  return out
}

// Try to reconstruct minimal valid workflow JSON from broken blocks
function reconstructWorkflowJson(input: string): string | null {
  const cleaned = stripMeasured(normalizeQuotes(stripComments(input)))
  const nodesIdx = cleaned.search(/\"nodes\"\s*:\s*\[/)
  if (nodesIdx === -1) return null
  const startBracket = cleaned.indexOf('[', nodesIdx)
  if (startBracket === -1) return null
  const nodesArr = extractBalancedArrayFrom(cleaned, startBracket)
  // edges optional
  const edgesIdx = cleaned.search(/\"edges\"\s*:\s*\[/)
  let edgesArr = '[]'
  if (edgesIdx !== -1) {
    const eStart = cleaned.indexOf('[', edgesIdx)
    if (eStart !== -1) edgesArr = extractBalancedArrayFrom(cleaned, eStart)
  }
  // Remove trailing commas inside arrays
  const tidyNodes = nodesArr.replace(/,\s*([}\]])/g, '$1')
  const tidyEdges = edgesArr.replace(/,\s*([}\]])/g, '$1')
  const candidate = `{"workflow":{"nodes":${tidyNodes},"edges":${tidyEdges}}}`
  return candidate
}

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
// Create a basic fallback workflow when JSON parsing fails
function createFallbackWorkflow(siteUrl: string, webhookUrl?: string) {
  const timestamp = Date.now()
  
  const nodes = [
    {
      id: `node-${timestamp}-1`,
      data: {
        type: TaskType.LAUNCH_BROWSER,
        inputs: {
          "Website Url": siteUrl || "https://example.com"
        }
      },
      position: { x: 0, y: 0 },
      type: "FlowScrapeNode",
      dragHandle: ".drag-handle"
    },
    {
      id: `node-${timestamp}-2`,
      data: {
        type: TaskType.PAGE_TO_HTML,
        inputs: {
          "Web page": ""
        }
      },
      position: { x: 400, y: 0 },
      type: "FlowScrapeNode",
      dragHandle: ".drag-handle"
    },
    {
      id: `node-${timestamp}-3`,
      data: {
        type: TaskType.EXTRACT_TEXT_FROM_ELEMENT,
        inputs: {
          "HTML": "",
          "Selector": ".product, .item, h1, .title"
        }
      },
      position: { x: 800, y: 0 },
      type: "FlowScrapeNode",
      dragHandle: ".drag-handle"
    }
  ]

  const edges = [
    {
      id: `edge-${timestamp}-1`,
      source: `node-${timestamp}-1`,
      target: `node-${timestamp}-2`,
      animated: true
    },
    {
      id: `edge-${timestamp}-2`,
      source: `node-${timestamp}-2`,
      target: `node-${timestamp}-3`,
      animated: true
    }
  ]

  // Add webhook node if URL provided
  if (webhookUrl) {
    const webhookNode = {
      id: `node-${timestamp}-4`,
      data: {
        type: TaskType.DELIVER_VIA_WEBHOOK,
        inputs: {
          "Target URL": webhookUrl,
          "Body": ""
        }
      },
      position: { x: 1200, y: 0 },
      type: "FlowScrapeNode",
      dragHandle: ".drag-handle"
    }
    
    nodes.push(webhookNode as any) // Cast to avoid type issues
    edges.push({
      id: `edge-${timestamp}-3`,
      source: `node-${timestamp}-3`,
      target: `node-${timestamp}-4`,
      animated: true
    })
  }

  return { nodes: nodes as any, edges } // Cast to avoid type issues
}

export function parseAIWorkflow(aiResponse: string, isStreaming: boolean = false): WorkflowResponse {
  try {
    console.log('Parsing AI response:', { 
      length: aiResponse.length, 
      isStreaming, 
      preview: aiResponse.substring(0, 200) 
    })

    // For streaming, be more cautious about parsing incomplete JSON
    if (isStreaming) {
      // Basic brace counting
      const openBraces = (aiResponse.match(/\{/g) || []).length
      const closeBraces = (aiResponse.match(/\}/g) || []).length
      
      // Also check for incomplete strings
      const quotes = (aiResponse.match(/"/g) || []).length
      const hasUnmatchedQuotes = quotes % 2 !== 0
      
      // Check if the response looks truncated
      const endsWithComma = aiResponse.trim().endsWith(',')
      const endsWithIncompleteValue = aiResponse.trim().match(/:\s*"[^"]*$/)
      
      if (openBraces > closeBraces || hasUnmatchedQuotes || endsWithComma || endsWithIncompleteValue) {
        console.log('JSON appears incomplete during streaming:', {
          openBraces,
          closeBraces,
          hasUnmatchedQuotes,
          endsWithComma,
          endsWithIncompleteValue: !!endsWithIncompleteValue
        })
        return { workflow: undefined, error: 'JSON streaming in progress' }
      }
    }

    // Enhanced JSON extraction with multiple patterns and better error handling
    let jsonStr = ''
    let cleanResponse = aiResponse.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

    const fencedJsonMatch = cleanResponse.match(/```json\s*([\s\S]*?)```/i)
    const fencedGenericMatch = (!fencedJsonMatch ? cleanResponse.match(/```\s*([\s\S]*?)```/) : null)
    if (fencedJsonMatch || fencedGenericMatch) {
      const block = (fencedJsonMatch ? fencedJsonMatch[1] : (fencedGenericMatch as RegExpMatchArray)[1]).trim()
      let candidate = normalizeQuotes(stripComments(block))
      candidate = stripMeasured(candidate)
      candidate = candidate.replace(/,\s*([}\]])/g, '$1')
      jsonStr = extractBalancedJson(candidate)
      console.log('Found JSON in fenced block:', jsonStr.substring(0, 200))
    } else {
         // Pattern 3: Look for workflow object specifically - more restrictive
         const workflowMatch = cleanResponse.match(/(\{[\s\S]*?"workflow"\s*:\s*\{[\s\S]*?\}[\s\S]*?\})/m)
         if (workflowMatch) {
           jsonStr = workflowMatch[1]
           console.log('Found workflow pattern:', jsonStr.substring(0, 200))
         } else {
           // Pattern 4: Find largest JSON object that looks valid
           const allJsonMatches = cleanResponse.match(/\{(?:[^{}]|{[^{}]*})*\}/g) || []
           
           // Filter to find the most likely workflow JSON
           const workflowCandidates = allJsonMatches.filter(json => {
             return json.includes('"nodes"') || json.includes('"workflow"') || json.length > 500
           })
           
           if (workflowCandidates.length > 0) {
             // Use the longest candidate
             jsonStr = workflowCandidates.reduce((longest, current) => 
               current.length > longest.length ? current : longest
             )
             console.log('Found workflow candidate JSON:', jsonStr.substring(0, 200))
           } else {
             console.log('No JSON pattern found in response')
             return { 
               workflow: { nodes: [], edges: [] }, 
               explanation: 'No workflow data found in response'
             }
           }
         }
     }
 
    // Clean up common JSON formatting issues
    jsonStr = stripMeasured(normalizeQuotes(stripComments(jsonStr)))
      .replace(/,\s*([}\]])/g, '$1')
      .replace(/\n\s*\n/g, '\n')
      .trim()

    // Ensure even number of quotes
    const quoteCount = (jsonStr.match(/"/g) || []).length
    if (quoteCount % 2 !== 0) jsonStr += '"'

    // Balance braces/brackets if needed
    jsonStr = extractBalancedJson(jsonStr)

    let parsed
    try {
      parsed = JSON.parse(jsonStr)
      console.log('Successfully parsed JSON:', { hasWorkflow: !!parsed.workflow, hasNodes: !!parsed.nodes })
    } catch (parseError) {
      console.error('JSON parse failed:', parseError, 'JSON:', jsonStr.substring(0, 500))

      // Try to fix common JSON issues and parse again
      let fixedJson = jsonStr
      fixedJson = fixedJson.replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":')
      fixedJson = fixedJson.replace(/'/g, '"')
      fixedJson = fixedJson.replace(/,\s*([}\]])/g, '$1')
      fixedJson = extractBalancedJson(fixedJson)

      try {
        parsed = JSON.parse(fixedJson)
        console.log('Successfully parsed fixed JSON')
      } catch (secondError) {
        console.error('Fixed JSON also failed:', secondError)

        // Attempt reconstruction from arrays
        const reconstructed = reconstructWorkflowJson(cleanResponse)
        if (reconstructed) {
          try {
            parsed = JSON.parse(reconstructed)
            console.log('Reconstructed workflow JSON successfully')
          } catch {}
        }

        if (!parsed) {
          // Last resort: URL extraction fallback
          const urls = aiResponse.match(/https?:\/\/[^\s<>"{}|\\^`\[\]]+/g) || []
          const webhookUrls = urls.filter(url => url.includes('httpbin') || url.includes('webhook'))
          const siteUrls = urls.filter(url => !url.includes('httpbin') && !url.includes('webhook'))

          if (siteUrls.length > 0) {
            console.log('Creating fallback workflow with extracted URLs:', { siteUrls, webhookUrls })
            const fallbackWorkflow = createFallbackWorkflow(siteUrls[0], webhookUrls[0])
            return {
              workflow: fallbackWorkflow,
              explanation: 'Created fallback workflow from extracted URLs',
              error: 'JSON parsing failed but recovered with URL extraction'
            }
          }

          return {
            workflow: { nodes: [], edges: [] },
            explanation: 'Invalid JSON format in response',
            error: 'Failed to parse workflow JSON: ' + (parseError as Error).message
          }
        }
      }
    }
    
    // Handle both direct and nested workflow formats
    let workflowData = parsed.nodes ? parsed : parsed.workflow
    if (!workflowData?.nodes) {
      console.log('No nodes found in parsed data:', parsed)
      return { 
        workflow: { nodes: [], edges: [] }, 
        explanation: 'No valid workflow structure found'
      }
    }

    console.log('Processing workflow with nodes:', workflowData.nodes.length)

    const processedNodes = workflowData.nodes.map((node: any) => ({
       ...node,
       id: node.id || generateNodeId(),
       type: 'FlowScrapeNode',
       dragHandle: '.drag-handle',
       data: {
         ...node.data,
         inputs: node.data.inputs || {}
       }
     }))

     let processedEdges = workflowData.edges?.map((edge: any) => ({
       ...edge,
       id: edge.id || `edge-${edge.source}-${edge.target}`,
       animated: true
     })) || []

     // Generate auto edges if needed
     const edgesNeedHandles = processedEdges.some((edge: any) => 
       !edge.sourceHandle || !edge.targetHandle
     )
     
     if (edgesNeedHandles || processedEdges.length === 0) {
       processedEdges = generateAutoEdges(processedNodes)
     }

     const workflow = {
       nodes: processedNodes,
       edges: processedEdges
     }

     const validation = validateWorkflow(workflow)
     
     return { 
       workflow, 
       explanation: parsed.explanation || 'Workflow generated successfully',
       error: validation.isValid ? undefined : `Validation warnings: ${validation.errors.join(', ')}`
     }

   } catch (error) {
     console.error('Error parsing AI workflow response:', error)
     return { 
       workflow: { nodes: [], edges: [] }, 
       explanation: 'Failed to parse workflow from AI response',
       error: error instanceof Error ? error.message : 'Unknown parsing error'
     }
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
