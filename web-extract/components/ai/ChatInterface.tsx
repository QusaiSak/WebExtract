'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Send, Sparkles, Bot, User, Save, Trash2, Plus, Eye, History } from 'lucide-react'
import { cn } from '@/lib/utils'
import { parseAIWorkflow } from '@/lib/workflow-ai'
import { TaskType } from '@/lib/types'
import WorkflowCanvas from './WorkflowCanvas'
import ComponentPicker from './ComponentPicker'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { ScrollArea } from '@/components/ui/scroll-area'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  workflow?: any
  timestamp: any
  context?: {
    previousWorkflows?: any[]
    workflowsInContext?: any[]
    userIntent?: string
    suggestedActions?: string[]
  }
}

interface SavedConversation {
  id: string
  title: string
  messages: Message[]
  timestamp: string
  lastUpdated: string
}

interface ChatInterfaceProps {
  onWorkflowSaved?: () => void
}

const ChatInterface = ({ onWorkflowSaved }: ChatInterfaceProps = {}) => {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [streamingMessage, setStreamingMessage] = useState('')
  const [streamingWorkflow, setStreamingWorkflow] = useState<any>(null)
  const [showLiveCanvas, setShowLiveCanvas] = useState(false)
  const [savedConversations, setSavedConversations] = useState<SavedConversation[]>([])
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  
  const [conversationContext, setConversationContext] = useState({
    allWorkflows: [] as any[],
    currentWorkflow: null as any,
    userPreferences: {},
    conversationHistory: [] as string[],
    workflowEvolution: [] as any[],
    suggestedActions: [] as string[]
  })
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { toast } = useToast()

  // Load saved conversations on mount
  useEffect(() => {
    const saved = localStorage.getItem('ai-conversations')
    if (saved) {
      try {
        const conversations = JSON.parse(saved)
        setSavedConversations(conversations)
      } catch (error) {
        console.error('Failed to load conversations:', error)
      }
    }
  }, [])

  // Auto-save current conversation
  useEffect(() => {
    if (messages.length > 0) {
      saveCurrentConversation()
    }
  }, [messages])

  const saveCurrentConversation = () => {
    if (messages.length === 0) return

    const conversationId = currentConversationId || `conv-${Date.now()}`
    const title = messages[0]?.content.slice(0, 50) + '...' || 'Untitled Conversation'
    
    const conversation: SavedConversation = {
      id: conversationId,
      title,
      messages,
      timestamp: messages[0]?.timestamp || new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    }

    setSavedConversations(prev => {
      const filtered = prev.filter(conv => conv.id !== conversationId)
      const updated = [conversation, ...filtered].slice(0, 50) // Keep max 50 conversations
      localStorage.setItem('ai-conversations', JSON.stringify(updated))
      return updated
    })

    if (!currentConversationId) {
      setCurrentConversationId(conversationId)
    }
  }

  const loadConversation = (conversation: SavedConversation) => {
    // Normalize timestamps to Date objects to avoid Invalid Date
    const normalized = conversation.messages.map(m => ({
      ...m,
      timestamp: typeof m.timestamp === 'string' ? new Date(m.timestamp) : m.timestamp
    }))
    setMessages(normalized)
    setCurrentConversationId(conversation.id)
    setShowHistory(false)
    
    toast({
      title: "Conversation Loaded",
      description: `Loaded "${conversation.title}"`,
    })
  }

  const deleteConversation = (conversationId: string) => {
    setSavedConversations(prev => {
      const filtered = prev.filter(conv => conv.id !== conversationId)
      localStorage.setItem('ai-conversations', JSON.stringify(filtered))
      return filtered
    })
    
    if (currentConversationId === conversationId) {
      setCurrentConversationId(null)
      setMessages([])
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, streamingMessage])

  const analyzeUserIntent = (message: string): { intent: string; confidence: number; suggestedActions: string[] } => {
    const createWords = ['create', 'build', 'make', 'generate', 'new', 'start']
    const modifyWords = ['modify', 'change', 'update', 'edit', 'fix', 'improve', 'add', 'remove', 'delete']
    
    const lowerMessage = message.toLowerCase()
    
    try {
      if (createWords.some(word => lowerMessage.includes(word))) {
        return {
          intent: 'create',
          confidence: 0.8,
          suggestedActions: ['Generate new workflow', 'Add specific components', 'Set up data sources']
        }
      } else if (modifyWords.some(word => lowerMessage.includes(word))) {
        return {
          intent: 'modify',
          confidence: 0.9,
          suggestedActions: ['Update existing nodes', 'Modify workflow logic', 'Add new connections']
        }
      }
      
      return {
        intent: 'create',
        confidence: 0.5,
        suggestedActions: ['Create workflow', 'Provide more details']
      }
    } catch (error) {
      console.warn('Intent analysis failed:', error)
      return {
        intent: 'create',
        confidence: 0.3,
        suggestedActions: []
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    const userIntent = analyzeUserIntent(userMessage)

    // Add user message to the chat immediately
    const newUserMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, newUserMessage])
    setIsLoading(true)
    setShowLiveCanvas(false)
    setStreamingWorkflow(null)
    setStreamingMessage('')
    setInput('')

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMessage,
          context: {
            ...conversationContext,
            userIntent: userIntent.intent,
            previousMessages: messages.slice(-3)
          }
        })
      })
      if (!res.ok) throw new Error(await res.text())

      const reader = res.body?.getReader()
      if (!reader) throw new Error('No response body')

      let accumulatedContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = new TextDecoder().decode(value)
        accumulatedContent += chunk
        setStreamingMessage(accumulatedContent)

        const workflowParsed = parseAIWorkflow(accumulatedContent, true)
        if (workflowParsed.workflow) {
          setStreamingWorkflow(workflowParsed.workflow)
          setShowLiveCanvas(true)
        }
      }

      const workflowParsed = parseAIWorkflow(accumulatedContent, false)
      
      let finalWorkflow = workflowParsed.workflow
      if (!finalWorkflow && userIntent.intent === 'create' && accumulatedContent.length > 50) {
        finalWorkflow = generateFallbackWorkflow(userMessage)
        
        toast({
          title: "Workflow ready",
          description: "I created a basic workflow from your request.",
        })
      } else if (finalWorkflow) {
        toast({
          title: "Workflow ready",
          description: `Created a workflow with ${finalWorkflow.nodes?.length || 0} steps.`,
        })
      }
      
      // Check if we're modifying an existing workflow in this conversation
      const existingWorkflowMessage = [...messages].reverse().find(msg => msg.workflow)
      
      if (finalWorkflow && existingWorkflowMessage && userIntent.intent === 'modify') {
        try {
          // Apply modifications to the existing workflow while preserving original URLs
          finalWorkflow = applySurgicalModifications(existingWorkflowMessage.workflow, finalWorkflow, userMessage)
          
          // Update the existing message instead of creating a new one
          setMessages(prev => prev.map(msg => 
            msg.workflow ? { ...msg, workflow: finalWorkflow, content: accumulatedContent } : msg
          ))
          
          toast({
            title: "Workflow Updated! ✨",
            description: "Your existing workflow has been modified while preserving original settings.",
          })
          
          setStreamingMessage('')
          return // Exit early to avoid creating duplicate messages
        } catch (error) {
          console.warn('Surgical modification failed, creating new workflow:', error)
        }
      }
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: accumulatedContent,
        timestamp: new Date(),
        workflow: finalWorkflow || undefined,
        context: {
          previousWorkflows: conversationContext.allWorkflows,
          workflowsInContext: conversationContext.workflowEvolution,
          userIntent: userIntent.intent,
          suggestedActions: conversationContext.suggestedActions
        }
      }

      setMessages(prev => [...prev, assistantMessage])
      setStreamingMessage('')
      
      if (finalWorkflow) {
        setConversationContext(prev => ({
          ...prev,
          allWorkflows: [...prev.allWorkflows, finalWorkflow],
          currentWorkflow: finalWorkflow,
          workflowEvolution: [...prev.workflowEvolution, {
            timestamp: new Date(),
            workflow: finalWorkflow,
            userIntent: userIntent.intent
          }]
        }))
      }
      
      if (onWorkflowSaved && workflowParsed.workflow) {
        onWorkflowSaved()
      }
      
      if (workflowParsed.workflow) {
        setStreamingWorkflow(workflowParsed.workflow)
      } else {
        setShowLiveCanvas(false)
        setStreamingWorkflow(null)
      }
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error while processing your request. Please try again.',
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
      
      toast({
        title: "Request Failed",
        description: "There was an error processing your request. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
      setStreamingMessage('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as any)
    }
  }

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 100)}px`
    }
  }

  useEffect(() => {
    adjustTextareaHeight()
  }, [input])

  // Allow external components (e.g., Sample Prompts) to insert text
  useEffect(() => {
    const handler = (e: CustomEvent<{ text: string }>) => {
      const text = (e as any)?.detail?.text
      if (typeof text === 'string' && text.trim()) {
        setInput(prev => (prev ? `${prev} ${text}` : text))
        if (textareaRef.current) textareaRef.current.focus()
      }
    }
    window.addEventListener('chat-insert-prompt', handler as unknown as EventListener)
    return () => window.removeEventListener('chat-insert-prompt', handler as unknown as EventListener)
  }, [])

  const createNewChat = () => {
    setMessages([])
    setStreamingMessage('')
    setStreamingWorkflow(null)
    setCurrentConversationId(null)
    
    setConversationContext({
      allWorkflows: [],
      currentWorkflow: null,
      userPreferences: {},
      conversationHistory: [],
      workflowEvolution: [],
      suggestedActions: []
    })
    
    toast({
      title: "New Conversation",
      description: "Started a fresh conversation.",
    })
  }

  const saveChat = () => {
    if (messages.length === 0) return
    
    const chatData = {
      messages,
      timestamp: new Date().toISOString(),
      title: messages[0]?.content.slice(0, 50) + '...' || 'Chat Export'
    }
    
    const blob = new Blob([JSON.stringify(chatData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `chat-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const clearChat = () => {
    setMessages([])
    setStreamingMessage('')
  }

  // Apply surgical modifications to an existing workflow
  const applySurgicalModifications = (existingWorkflow: any, newWorkflow: any, userMessage?: string) => {
    try {
      // If the new workflow is a complete replacement, use it but preserve original URLs
      if (newWorkflow.nodes && newWorkflow.nodes.length > 1) {
        // Check if user is modifying existing workflow - preserve original URLs
        if (userMessage && (userMessage.toLowerCase().includes('modify') || userMessage.toLowerCase().includes('add'))) {
          // Find the original browser launch node to preserve URL
          const originalBrowserNode = existingWorkflow.nodes.find((node: any) => 
            node.data?.type === 'LAUNCH_BROWSER' || 
            (node.data?.inputs && node.data.inputs['Website Url'])
          )
          
          // Find the original webhook node to preserve endpoint
          const originalWebhookNode = existingWorkflow.nodes.find((node: any) => 
            node.data?.type === 'WEBHOOK' ||
            (node.data?.inputs && (node.data.inputs['URL'] || node.data.inputs['Webhook URL']))
          )
          
          // Update the new workflow nodes to preserve original URLs
          const updatedNodes = newWorkflow.nodes.map((node: any) => {
            // Preserve original website URL in browser launch node
            if ((node.data?.type === 'LAUNCH_BROWSER' || 
                (node.data?.inputs && node.data.inputs['Website Url'])) && originalBrowserNode) {
              return {
                ...node,
                data: {
                  ...node.data,
                  inputs: {
                    ...node.data.inputs,
                    'Website Url': originalBrowserNode.data.inputs['Website Url']
                  }
                }
              }
            }
            
            // Preserve original webhook URL
            if ((node.data?.type === 'WEBHOOK' || 
                (node.data?.inputs && (node.data.inputs['URL'] || node.data.inputs['Webhook URL']))) && originalWebhookNode) {
              const webhookUrlKey = node.data.inputs['URL'] ? 'URL' : 'Webhook URL'
              const originalUrlKey = originalWebhookNode.data.inputs['URL'] ? 'URL' : 'Webhook URL'
              return {
                ...node,
                data: {
                  ...node.data,
                  inputs: {
                    ...node.data.inputs,
                    [webhookUrlKey]: originalWebhookNode.data.inputs[originalUrlKey]
                  }
                }
              }
            }
            
            return node
          })
          
          return {
            ...newWorkflow,
            nodes: updatedNodes
          }
        }
        return newWorkflow
      }
      
      // For single node modifications, try to update the existing workflow
      if (newWorkflow.nodes && newWorkflow.nodes.length === 1) {
        const newNode = newWorkflow.nodes[0]
        
        // Find matching node type in existing workflow
        const updatedNodes = existingWorkflow.nodes.map((node: any) => {
          if (node.type === newNode.type || 
              (node.data && newNode.data && 
               typeof node.data === 'object' && typeof newNode.data === 'object' &&
               Object.keys(node.data).some(key => Object.keys(newNode.data).includes(key)))) {
            return {
              ...node,
              data: { ...node.data, ...newNode.data }
            }
          }
          return node
        })
        
        return {
          ...existingWorkflow,
          nodes: updatedNodes,
          edges: newWorkflow.edges || existingWorkflow.edges
        }
      }
      
      return newWorkflow || existingWorkflow
    } catch (error) {
      console.error('Error applying surgical modifications:', error)
      return newWorkflow || existingWorkflow
    }
  }

  const generateWorkflowTitle = (userPrompt: string): string => {
    // Extract key words and create a descriptive title
    const prompt = userPrompt.toLowerCase()
    
    // Extract domain/website
    const urlMatch = prompt.match(/(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+\.[a-zA-Z]{2,})/)
    const domain = urlMatch ? urlMatch[1] : ''
    
    // Extract action words
    let action = 'Extract'
    if (prompt.includes('scrape')) action = 'Scrape'
    else if (prompt.includes('collect')) action = 'Collect'
    else if (prompt.includes('gather')) action = 'Gather'
    else if (prompt.includes('monitor')) action = 'Monitor'
    
    // Extract target data
    let target = 'Data'
    if (prompt.includes('price')) target = 'Prices'
    else if (prompt.includes('product')) target = 'Products'
    else if (prompt.includes('title') || prompt.includes('headline')) target = 'Titles'
    else if (prompt.includes('review')) target = 'Reviews'
    else if (prompt.includes('contact') || prompt.includes('email')) target = 'Contacts'
    else if (prompt.includes('job') || prompt.includes('listing')) target = 'Job Listings'
    else if (prompt.includes('news') || prompt.includes('article')) target = 'Articles'
    else if (prompt.includes('image') || prompt.includes('photo')) target = 'Images'
    
    // Combine parts
    let title = `${action} ${target}`
    if (domain) {
      title += ` from ${domain.replace('www.', '')}`
    }
    
    // Capitalize first letter of each word
    return title.replace(/\b\w/g, l => l.toUpperCase())
  }

  const generateFallbackWorkflow = (userInput: string): { nodes: any[]; edges: any[] } => {
    const timestamp = Date.now()
    
    const nodes = [
      {
        id: `node-${timestamp}-1`,
        data: {
          type: TaskType.LAUNCH_BROWSER,
          inputs: {
            "Website Url": userInput.includes('http') ? 
              userInput.match(/(https?:\/\/[^\s]+)/)?.[0] || "https://example.com" : 
              "https://example.com"
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
            "Selector": userInput.toLowerCase().includes('price') ? '.price, [class*="price"]' :
                       userInput.toLowerCase().includes('title') ? 'h1, .title, [class*="title"]' :
                       userInput.toLowerCase().includes('review') ? '.review, [class*="review"]' :
                       'h1, .title, .content'
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

    return { nodes, edges }
  }

  const saveWorkflowToDatabase = async (workflow: any, userPrompt: string) => {
    try {
      // Generate a descriptive title from the user prompt
      const workflowTitle = generateWorkflowTitle(userPrompt)
      
      // Check if there's an existing workflow in this conversation
      const existingWorkflowMessage = messages.find(msg => msg.workflow)
      
      let res
      if (existingWorkflowMessage?.workflow) {
        // Update existing workflow instead of creating a new one
        console.log('Updating existing workflow...')
        
        // For now, we'll still create a new one but with a versioned name
        const versionedTitle = `${workflowTitle} (v${Date.now().toString().slice(-4)})`
        
        res = await fetch('/api/workflows', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: versionedTitle,
            description: `Created via Chat: ${versionedTitle}`,
            definition: JSON.stringify(workflow)
          })
        })
      } else {
        // Create new workflow
        res = await fetch('/api/workflows', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: workflowTitle,
            description: `Created via Chat: ${workflowTitle}`,
            definition: JSON.stringify(workflow)
          })
        })
      }
      
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text)
      }
      const saved = await res.json()
      if (onWorkflowSaved) onWorkflowSaved()
      return saved
    } catch (error) {
      console.error('Error saving workflow:', error)
      throw error
    }
  }

  const runWorkflow = async (workflow: any) => {
    try {
      console.log('Running workflow:', workflow)
    } catch (error) {
      console.error('Error running workflow:', error)
      throw error
    }
  }

  const copyWorkflow = (workflow: any) => {
    navigator.clipboard.writeText(JSON.stringify(workflow, null, 2))
      .then(() => {
        toast({
          title: "Copied!",
          description: "Workflow JSON copied to clipboard.",
        })
      })
      .catch(err => {
        console.error('Failed to copy workflow:', err)
        toast({
          title: "Copy Failed",
          description: "Failed to copy workflow to clipboard.",
          variant: "destructive"
        })
      })
  }

  const downloadWorkflow = (workflow: any) => {
    const dataStr = JSON.stringify(workflow, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `workflow-${Date.now()}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    toast({
      title: "Downloaded!",
      description: "Workflow JSON file downloaded successfully.",
    })
  }

  // Compute the nearest preceding user prompt for a given assistant message
  const getLastUserPromptBefore = (messageId: string): string => {
    const index = messages.findIndex(m => m.id === messageId)
    if (index === -1) return messages.find(m => m.role === 'user')?.content || ''
    const priorUser = [...messages.slice(0, index)].reverse().find(m => m.role === 'user')
    return priorUser?.content || messages.find(m => m.role === 'user')?.content || ''
  }

  // Build a meaningful workflow title for a message's workflow
  const getMessageWorkflowTitle = (message: Message): string => {
    const prompt = getLastUserPromptBefore(message.id)
    return generateWorkflowTitle(prompt || 'Web Extraction Workflow')
  }

  const formatMessage = (content: string) => {
    const jsonBlockRegex = /```(?:json)?\s*\{[\s\S]*?\}\s*```/g
    const directJsonRegex = /^\s*\{[\s\S]*\}\s*$/m
    const inlineJsonRegex = /\{[\s\S]*?"workflow"[\s\S]*?\}/g
    
    let cleanText = content
      .replace(jsonBlockRegex, '')
      .replace(inlineJsonRegex, '')
      .replace(directJsonRegex, '')
      .replace(/```[\s\S]*?```/g, '')
      .replace(/\r/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/^\s*[\{\}]\s*$/gm, '')
      .trim()
    
    if (!cleanText || cleanText.length < 20 || cleanText.match(/^[\s\{\}\[\],]*$/)) {
      return (
        <div className="space-y-2">
          <p>I've generated a workflow for you! 🎉</p>
          <p>You can view and interact with it using the workflow canvas below.</p>
        </div>
      )
    }

    const lines = cleanText.split('\n').filter(line => line.trim())
    
    return (
      <div className="space-y-2">
        {lines.map((line, index) => {
          const trimmedLine = line.trim()
          
          if (!trimmedLine || trimmedLine.match(/^[\s\{\}\[\],]*$/)) {
            return null
          }
          
          if (trimmedLine.startsWith('###')) {
            return <h3 key={index} className="text-lg font-semibold mt-4 mb-2">{trimmedLine.replace('###', '').trim()}</h3>
          }
          if (trimmedLine.startsWith('##')) {
            return <h2 key={index} className="text-xl font-bold mt-4 mb-2">{trimmedLine.replace('##', '').trim()}</h2>
          }
          if (trimmedLine.startsWith('#')) {
            return <h1 key={index} className="text-2xl font-bold mt-4 mb-2">{trimmedLine.replace('#', '').trim()}</h1>
          }
          
          if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
            return <div key={index} className="flex items-start space-x-2 mb-1"><span>•</span><span>{trimmedLine.replace(/^[*-]\s/, '')}</span></div>
          }
          if (trimmedLine.match(/^\d+\.\s/)) {
            const match = trimmedLine.match(/^(\d+)\.\s(.*)/)
            if (match) {
              return <div key={index} className="flex items-start space-x-2 mb-1"><span>{match[1]}.</span><span>{match[2]}</span></div>
            }
          }
          
          if (trimmedLine.includes('**')) {
            const parts = trimmedLine.split(/(\*\*.*?\*\*)/)
            return (
              <p key={index} className="mb-2">
                {parts.map((part, partIndex) => 
                  part.startsWith('**') && part.endsWith('**') ? 
                    <strong key={partIndex}>{part.slice(2, -2)}</strong> : 
                    part
                )}
              </p>
            )
          }
          
          return <p key={index} className="mb-2 leading-relaxed">{trimmedLine}</p>
        })}
      </div>
    );
  }

  const formatTimestampValue = (ts: any) => {
    try {
      const d = typeof ts === 'string' ? new Date(ts) : ts instanceof Date ? ts : new Date()
      return isNaN(d.getTime()) ? '' : d.toLocaleString()
    } catch { return '' }
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-border/50 bg-gradient-to-r from-card/90 to-card/70 backdrop-blur-sm">
        <div className="flex items-center justify-between px-8 py-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
              <Sparkles className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                Workflow Chat Builder
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Describe your goal. I’ll generate and refine your scraping workflow.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Dialog open={showHistory} onOpenChange={setShowHistory}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 hover:bg-blue-50 border-blue-200 hover:border-blue-300 text-blue-700 hover:text-blue-800"
                >
                  <History className="w-4 h-4" />
                  History ({savedConversations.length})
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Conversation History</DialogTitle>
                </DialogHeader>
                <ScrollArea className="h-96">
                  {savedConversations.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No saved conversations yet</p>
                  ) : (
                    <div className="space-y-2">
                      {savedConversations.map((conversation) => (
                        <div key={conversation.id} className="flex items-center gap-2 p-3 rounded-lg border hover:bg-muted/50">
                          <div 
                            className="flex-1 cursor-pointer"
                            onClick={() => loadConversation(conversation)}
                          >
                            <p className="text-sm font-medium truncate">{conversation.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(conversation.lastUpdated).toLocaleDateString()}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteConversation(conversation.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </DialogContent>
            </Dialog>
            
            <Button
              variant="outline"
              size="sm"
              onClick={createNewChat}
              className="flex items-center gap-2 hover:bg-primary/10 border-primary/20 hover:border-primary/40 transition-all duration-200"
            >
              <Plus className="w-4 h-4" />
              New Chat
            </Button>
            {messages.length > 0 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={saveChat}
                  className="flex items-center gap-2 hover:bg-green-50 border-green-200 hover:border-green-300 text-green-700 hover:text-green-800"
                >
                  <Save className="w-4 h-4" />
                  Export
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearChat}
                  className="flex items-center gap-2 hover:bg-red-50 border-red-200 hover:border-red-300 text-red-700 hover:text-red-800"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Messages Container - Fixed height with scroll */}
      <div className="flex-1 min-h-0">
        <div className="h-full overflow-y-auto bg-gradient-to-b from-background to-background/50">
          <div className="max-w-6xl mx-auto px-6 py-8">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center py-16">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-8 shadow-lg">
                  <Bot className="w-10 h-10 text-primary" />
                </div>
                <h2 className="text-3xl font-bold text-foreground mb-3 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                  Build a scraping workflow with chat
                </h2>
                <p className="text-muted-foreground text-center mb-12 max-w-lg text-lg leading-relaxed">
                  Tell me what to extract and where to send it. I’ll do the rest.
                </p>
                {savedConversations.length > 0 && (
                  <Button
                    variant="outline"
                    onClick={() => setShowHistory(true)}
                    className="flex items-center gap-2"
                  >
                    <History className="w-4 h-4" />
                    View {savedConversations.length} saved conversation{savedConversations.length !== 1 ? 's' : ''}
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex gap-4",
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    {message.role === 'assistant' && (
                      <div className="flex-shrink-0 w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-sm">
                        <Bot className="w-5 h-5 text-primary-foreground" />
                      </div>
                    )}
                    
                    <div
                      className={cn(
                        "max-w-2xl rounded-3xl px-6 py-4 shadow-sm",
                        message.role === 'user'
                          ? 'bg-gradient-to-br from-primary to-primary/90 text-primary-foreground shadow-primary/20'
                          : 'bg-card/90 text-card-foreground border border-border/50 backdrop-blur supports-[backdrop-filter]:bg-card/60'
                      )}
                    >
                      <div className="text-sm leading-relaxed">{message.role === 'assistant' ? 
                          formatMessage(message.content) : 
                          <p>{message.content}</p>
                        }
                      </div>
                      
                      {message.workflow && (
                        <div className="mt-4 p-4 bg-muted/30 rounded-lg border">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Bot className="w-4 h-4 text-primary" />
                              <span className="text-sm font-medium">Generated Workflow</span>
                              <Badge variant="secondary" className="text-xs">
                                {message.workflow.nodes?.length || 0} nodes
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="text-sm text-muted-foreground mb-3">
                            ✅ Workflow created successfully with {message.workflow.nodes?.length || 0} steps and {message.workflow.edges?.length || 0} connections
                          </div>
                          
                          {/* Debug info for workflow structure */}
                          <div className="text-xs text-muted-foreground mb-2 font-mono bg-muted/50 p-2 rounded">
                            Nodes: {JSON.stringify(message.workflow.nodes?.map((n: any) => ({ id: n.id, type: n.type })) || [])}
                          </div>
                          
                          <div className="flex flex-wrap gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button size="sm" variant="outline" className="text-xs">
                                  <Eye className="w-3 h-3 mr-1" />
                                  View Canvas
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-[90vw] max-h-[90vh] w-full h-full">
                                <DialogHeader className="pb-4">
                                  <DialogTitle className="text-xl">Workflow Canvas</DialogTitle>
                                  <div className="text-sm text-muted-foreground">
                                    {message.workflow.nodes?.length || 0} nodes, {message.workflow.edges?.length || 0} connections
                                  </div>
                                </DialogHeader>
                                <div className="flex-1 h-[75vh] w-full border rounded-lg overflow-hidden bg-gray-50">
                                  <div className="h-full w-full relative">
                                    <WorkflowCanvas
                                      workflow={message.workflow}
                                      title={getMessageWorkflowTitle(message)}
                                      onSave={saveWorkflowToDatabase}
                                      onRun={runWorkflow}
                                    />
                                    
                                    {/* Fallback display if canvas doesn't load */}
                                    {(!message.workflow?.nodes || message.workflow.nodes.length === 0) && (
                                      <div className="absolute inset-0 flex items-center justify-center bg-white/90">
                                        <div className="text-center">
                                          <Bot className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                                          <p className="text-sm text-muted-foreground">No workflow data available</p>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                            
                            <Button
                              size="sm"
                              variant="default"
                              className="text-xs"
                              onClick={async () => {
                                try {
                                  await saveWorkflowToDatabase(message.workflow, getMessageWorkflowTitle(message))
                                  toast({
                                    title: "Workflow Saved! 🎉",
                                    description: "Your AI-generated workflow has been saved successfully.",
                                  })
                                  if (onWorkflowSaved) onWorkflowSaved()
                                } catch (error) {
                                  toast({
                                    title: "Save Failed",
                                    description: "Failed to save the workflow. Please try again.",
                                    variant: "destructive"
                                  })
                                }
                              }}
                            >
                              <Sparkles className="w-3 h-3 mr-1" />
                              Save Workflow
                            </Button>
                            
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs"
                              onClick={() => copyWorkflow(message.workflow)}
                            >
                              Copy JSON
                            </Button>
                            
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs"
                              onClick={() => downloadWorkflow(message.workflow)}
                            >
                              Download
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      <div className={cn(
                        "text-xs mt-2 opacity-60",
                        message.role === 'user' ? 'text-primary-foreground' : 'text-muted-foreground'
                      )}>
                        {formatTimestampValue(message.timestamp)}
                      </div>
                    </div>
                    
                    {message.role === 'user' && (
                      <div className="flex-shrink-0 w-10 h-10 rounded-2xl bg-secondary flex items-center justify-center shadow-sm">
                        <User className="w-5 h-5 text-secondary-foreground" />
                      </div>
                    )}
                  </div>
                ))}
                
                {streamingMessage && (
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-2xl bg-primary flex items-center justify-center shadow-sm">
                      <Bot className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div className="max-w-2xl rounded-3xl px-6 py-4 border bg-card text-card-foreground border-border/50 backdrop-blur-sm shadow-sm">
                      <div className="text-sm leading-relaxed">
                        {formatMessage(streamingMessage)}
                        <span className="inline-block w-2 h-4 bg-primary ml-1 animate-pulse rounded-sm" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>


      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 border-t border-border/50 bg-gradient-to-r from-card/90 to-card/70 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-6 space-y-4">
          {/* Component Picker */}
          <ComponentPicker 
            onComponentSelect={(componentText) => {
              setInput(prev => prev ? `${prev} ${componentText}` : componentText)
              textareaRef.current?.focus()
            }}
          />
          
          <form onSubmit={handleSubmit} className="flex items-end gap-4">
            <div className="flex-1">
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Describe the workflow you want to create... (Press Enter to send, Shift+Enter for new line)"
                  className="w-full min-h-[56px] max-h-[120px] px-6 py-4 rounded-2xl border border-border/50 bg-background/80 backdrop-blur-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 text-sm shadow-sm transition-all duration-200"
                  disabled={isLoading}
                  rows={1}
                />
                <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
                  {input.length}/1000
                </div>
              </div>
            </div>
            <Button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="h-[56px] px-6 rounded-2xl bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-200 font-medium"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  Send
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ChatInterface
