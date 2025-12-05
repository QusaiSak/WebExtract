import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import prisma from '@/lib/prisma'
import { generateStreamingWorkflow, generateStreamingResponse, buildWorkflowContext } from '@/lib/openrouter'
import { parseAIWorkflow, validateWorkflow } from '@/lib/workflow-ai'

async function broadcast(baseUrl: string, channel: string, type: string, payload: any) {
  try {
    const url = `${baseUrl.replace(/\/$/, '')}/api/ws`
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channel, type, payload })
    })
  } catch (e) {
    console.warn('WS broadcast failed:', e)
  }
}

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { message, conversationId, context } = await request.json()
    const workflowIdFromContext: string | undefined = context?.workflowId

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Enhanced workflow detection with context awareness
    const isWorkflowRequest = 
      /generate|create|build|make.*workflow|scrape|extract|automation|help.*with.*workflow|modify.*workflow|add.*to.*workflow|change.*workflow|workflow.*for/i.test(message) ||
      /website|url|data.*from|login|form|click|navigate|element/i.test(message) ||
      context?.currentWorkflow || // If there's a current workflow, assume it's workflow-related
      context?.intent === 'create' ||
      context?.intent === 'modify' ||
      context?.previousWorkflows?.length > 0 ||
      message.trim().length > 10 // Assume most requests are workflow related
    
    console.log('Workflow request detected:', isWorkflowRequest, 'for message:', message)
    
    let conversationHistory: any[] = []
    
    // Get conversation history if conversationId provided
    if (conversationId) {
      try {
        const conversation = await (prisma as any).aiConversation.findUnique({
          where: { id: conversationId, userId: user.id }
        })
        if (conversation) {
          conversationHistory = conversation.messages as any[]
        }
      } catch (error) {
        console.warn('Failed to load conversation history:', error)
        // Continue without history
      }
    }

    // Build enhanced context for AI
    const enhancedContext = {
      ...buildWorkflowContext(context?.currentWorkflow, conversationHistory),
      previousWorkflows: context?.previousWorkflows || [],
      userIntent: context?.intent || 'create',
      conversationContext: context || {}
    }

    // Generate appropriate response with enhanced error handling
    let streamResponse
    try {
      streamResponse = isWorkflowRequest 
        ? await generateStreamingWorkflow(message, enhancedContext)
        : await generateStreamingResponse(message)
    } catch (error) {
      console.error('AI API error:', error)
      // Fallback to mock response - return empty values instead of throwing
      return createMockStreamingResponse(message, isWorkflowRequest)
    }

    // Create readable stream that also collects the response for saving
    let fullResponse = ''
    
    const collectingStream = new ReadableStream({
      start(controller) {
        const reader = streamResponse.body?.getReader()
        if (!reader) {
          controller.close()
          return
        }

        function pump(): Promise<void> {
          return reader!.read().then(({ done, value }) => {
            if (done) {
              // Save conversation after streaming is complete (async, non-blocking)
              if (user && fullResponse) {
                // Use setTimeout to ensure this runs after response is complete
                setTimeout(() => {
                  saveConversationAsync(user.id, conversationId, message, fullResponse, isWorkflowRequest, workflowIdFromContext)
                    .catch(error => console.error('Background save failed:', error))
                }, 100)
              }
              controller.close()
              return
            }
            
            const chunk = new TextDecoder().decode(value)
            fullResponse += chunk
            controller.enqueue(value)
            return pump()
          })
        }
        
        return pump()
      }
    })

    return new Response(collectingStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })

  } catch (error) {
    console.error('Error in AI chat:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}

// Mock streaming response for fallback
async function createMockStreamingResponse(message: string, isWorkflowRequest: boolean): Promise<Response> {
  const response = isWorkflowRequest 
    ? createMockWorkflowResponse(message)
    : createMockChatResponse(message)

  const encoder = new TextEncoder()
  
  const stream = new ReadableStream({
    async start(controller) {
      const words = response.split(' ')
      
      for (let i = 0; i < words.length; i++) {
        const chunk = (i === 0 ? words[i] : ' ' + words[i])
        controller.enqueue(encoder.encode(chunk))
        await new Promise(resolve => setTimeout(resolve, 50))
      }
      
      controller.close()
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'no-cache',
    },
  })
}

function createMockWorkflowResponse(message: string): string {
  return `I'll help you create a workflow for: "${message}"

Let me break this down and build a workflow that accomplishes your goal:

1. **Launch Browser**: Opens a browser and navigates to the target website
2. **Extract Page HTML**: Gets the page content for processing  
3. **Extract Data**: Uses selectors to pull the specific data you need

\`\`\`json
{
  "workflow": {
    "nodes": [
      {
        "id": "node-1",
        "data": {
          "type": "LAUNCH_BROWSER",
          "inputs": {
            "Website Url": "https://example.com"
          }
        },
        "position": { "x": 0, "y": 0 },
        "type": "FlowScrapeNode",
        "dragHandle": ".drag-handle"
      },
      {
        "id": "node-2", 
        "data": {
          "type": "PAGE_TO_HTML",
          "inputs": {
            "Web page": ""
          }
        },
        "position": { "x": 400, "y": 0 },
        "type": "FlowScrapeNode",
        "dragHandle": ".drag-handle"
      },
      {
        "id": "node-3",
        "data": {
          "type": "EXTRACT_TEXT_FROM_ELEMENT",
          "inputs": {
            "HTML": "",
            "Selector": "h1, .title, .product-name"
          }
        },
        "position": { "x": 800, "y": 0 },
        "type": "FlowScrapeNode", 
        "dragHandle": ".drag-handle"
      }
    ],
    "edges": [
      {
        "id": "edge-1",
        "source": "node-1",
        "target": "node-2"
      },
      {
        "id": "edge-2", 
        "source": "node-2",
        "target": "node-3"
      }
    ]
  },
  "explanation": "This workflow opens a browser, navigates to the specified website, converts the page to HTML, and extracts text from common title elements. You can modify the selector to target specific elements on your target website."
}`
}

function createMockChatResponse(message: string): string {
  return `I understand you want to work with: "${message}". Here's what I can help you with:

## Workflow Generation
I can help you create web scraping workflows for various tasks like:
- **E-commerce scraping**: Product prices, reviews, inventory
- **Lead generation**: Contact information, company data  
- **Content extraction**: Articles, news, social media posts
- **Data monitoring**: Price changes, availability updates

## Next Steps
1. Describe your specific scraping goal
2. I'll generate a workflow with the right nodes
3. You can test and refine the workflow
4. Deploy it for automated execution

What specific website or data would you like to scrape?`
}



// Async function to save conversation without blocking the response
async function saveConversationAsync(
  userId: string, 
  conversationId: string | undefined, 
  userMessage: string, 
  aiResponse: string, 
  isWorkflowRequest: boolean,
  workflowId?: string
) {
  try {
    const userMsg = {
      id: Date.now().toString(),
      role: 'user' as const,
      content: userMessage,
      timestamp: new Date()
    }

    const aiMsg = {
      id: (Date.now() + 1).toString(), 
      role: 'assistant' as const,
      content: aiResponse,
      timestamp: new Date()
    }

    // Extract workflow if this was a workflow generation request
    let hasWorkflow = false
    let workflowData = null
    if (isWorkflowRequest) {
      const parsed = parseAIWorkflow(aiResponse)
      if (parsed.workflow) {
        const validation = validateWorkflow(parsed.workflow)
        hasWorkflow = validation.isValid
        if (hasWorkflow) {
          workflowData = parsed.workflow
        }
      }
    }

    if (conversationId) {
      // Update existing conversation
      const existingConv = await (prisma as any).aiConversation.findUnique({
        where: { id: conversationId, userId }
      })

      if (existingConv) {
        const existingMessages = existingConv.messages as any[]
        const updatedMessages = [...existingMessages, userMsg, aiMsg]

        await (prisma as any).aiConversation.update({
          where: { id: conversationId },
          data: {
            messages: updatedMessages,
            updatedAt: new Date()
          }
        })
      }
    } else {
      // Create new conversation - only save if it contains workflow or is meaningful
      if (hasWorkflow || userMessage.length > 10) {
        const title = userMessage.length > 50 
          ? userMessage.substring(0, 50) + '...'
          : userMessage

        const savedConversation = await (prisma as any).aiConversation.create({
          data: {
            userId,
            title,
            messages: [userMsg, aiMsg]
          }
        })

        // If this conversation has a workflow, optionally update existing workflow instead of creating
        if (hasWorkflow && workflowData) {
          try {
            if (workflowId) {
              const existing = await prisma.workflow.findUnique({ where: { id: workflowId }, select: { userId: true, name: true } })
              if (!existing || existing.userId !== userId) {
                console.warn('Workflow ownership mismatch or not found, skipping update')
              } else {
                const updated = await prisma.workflow.update({
                  where: { id: workflowId },
                  data: { definition: JSON.stringify(workflowData), updatedAt: new Date() as any }
                })
                console.log(`Updated workflow ${workflowId} from conversation`)
                // Broadcast live update so any open editors refresh instantly
                const base = process.env.NEXT_PUBLIC_APP_ORIGIN || 'http://localhost:3000'
                broadcast(base, workflowId, 'workflow.updated', { id: workflowId, name: updated.name, definition: updated.definition }).catch(() => {})
               }
             } else {
               // Do not auto-create to avoid duplicates; keep only conversation saved
               console.log('Workflow present, skipping auto-create (no workflowId provided)')
             }
           } catch (workflowError) {
             console.error('Error updating workflow from conversation:', workflowError)
           }
         }
       }
     }
   } catch (error) {
     console.error('Error saving conversation:', error)
   }
 }
