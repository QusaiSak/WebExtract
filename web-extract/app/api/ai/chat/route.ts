import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import prisma from '@/lib/prisma'
import { generateStreamingWorkflow, generateStreamingResponse, buildWorkflowContext } from '@/lib/openrouter'
import { parseAIWorkflow, validateWorkflow } from '@/lib/workflow-ai'

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { message, conversationId, currentWorkflow } = await request.json()

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Detect if this is a workflow generation request
    const isWorkflowRequest = /generate|create|build|make.*workflow|scrape|extract|automation/i.test(message)
    
    let conversationHistory: any[] = []
    
    // Get conversation history if conversationId provided
    if (conversationId) {
      const conversation = await (prisma as any).aiConversation.findUnique({
        where: { id: conversationId, userId: user.id }
      })
      if (conversation) {
        conversationHistory = conversation.messages as any[]
      }
    }

    // Build context for AI
    const context = buildWorkflowContext(currentWorkflow, conversationHistory)

    // Generate appropriate response
    let streamResponse
    try {
      streamResponse = isWorkflowRequest 
        ? await generateStreamingWorkflow(message, context)
        : await generateStreamingResponse(message)
    } catch (error) {
      console.error('AI API error:', error)
      // Fallback to mock response
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
          return reader.read().then(({ done, value }) => {
            if (done) {
              // Save conversation after streaming is complete
              saveConversationAsync(user.id, conversationId, message, fullResponse, isWorkflowRequest)
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
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
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
  return `# Workflow Generated for: "${message}"

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
            "Html": "",
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
  isWorkflowRequest: boolean
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

        // If this conversation has a workflow, also create a workflow entry
        if (hasWorkflow && workflowData) {
          try {
            // Generate unique workflow name with timestamp
            const timestamp = new Date().toISOString().slice(0, 16).replace('T', ' ')
            const workflowTitle = `AI Workflow - ${timestamp}`
            
            await prisma.workflow.create({
              data: {
                userId,
                name: workflowTitle,
                description: `Auto-generated workflow: ${title}`,
                definition: JSON.stringify(workflowData),
                status: 'DRAFT'
              }
            })
            console.log(`Auto-created workflow: ${workflowTitle}`)
          } catch (workflowError) {
            console.error('Error creating workflow from conversation:', workflowError)
          }
        }
      }
    }
  } catch (error) {
    console.error('Error saving conversation:', error)
  }
}
