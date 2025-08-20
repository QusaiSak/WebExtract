'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Send, Sparkles, Code, Zap, Bot, User, Save, Download, Trash2, Plus, Eye } from 'lucide-react'
import { cn } from '@/lib/utils'
import { parseAIWorkflow } from '@/lib/workflow-ai'
import WorkflowCanvas from './WorkflowCanvas'
import ComponentPicker from './ComponentPicker'
import WorkflowDetails from './WorkflowDetails'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  workflow?: any
}

interface SavedConversation {
  id: string
  title: string
  createdAt: string
}

interface ChatInterfaceProps {
  onWorkflowSaved?: () => void
}

interface SavedConversation {
  id: string
  title: string
  createdAt: string
  updatedAt: string
}

const ChatInterface = ({ onWorkflowSaved }: ChatInterfaceProps = {}) => {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [streamingMessage, setStreamingMessage] = useState('')
  const [currentConversationId, setCurrentConversationId] = useState<string | undefined>()
  const [savedConversations, setSavedConversations] = useState<SavedConversation[]>([])
  const [viewingWorkflow, setViewingWorkflow] = useState<any>(null)
  const [streamingWorkflow, setStreamingWorkflow] = useState<any>(null)
  const [showLiveCanvas, setShowLiveCanvas] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, streamingMessage])

  // Load saved conversations on mount
  useEffect(() => {
    loadConversations()
  }, [])

  const loadConversations = async () => {
    try {
      const response = await fetch('/api/ai/conversations')
      if (response.ok) {
        const conversations = await response.json()
        setSavedConversations(conversations)
      }
    } catch (error) {
      console.error('Error loading conversations:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    // Clear previous live canvas when starting new request
    setShowLiveCanvas(false)
    setStreamingWorkflow(null)

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    setStreamingMessage('')

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: input.trim(),
          conversationId: currentConversationId 
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response body')

      let accumulatedContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = new TextDecoder().decode(value)
        accumulatedContent += chunk
        setStreamingMessage(accumulatedContent)

        // Try to parse workflow in real-time and show in canvas
        const workflowParsed = parseAIWorkflow(accumulatedContent, true) // Pass true for streaming
        console.log('Parsing during stream:', { hasWorkflow: !!workflowParsed.workflow, content: accumulatedContent.substring(0, 100), error: workflowParsed.error })
        if (workflowParsed.workflow) {
          console.log('Setting streaming workflow:', workflowParsed.workflow)
          setStreamingWorkflow(workflowParsed.workflow)
          setShowLiveCanvas(true)
        }
      }

      // Parse workflow if present in response
      const workflowParsed = parseAIWorkflow(accumulatedContent, false) // Pass false for final parsing
      console.log('Final parsing result:', { hasWorkflow: !!workflowParsed.workflow, error: workflowParsed.error })
      
      // Add the complete message to the messages array
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: accumulatedContent,
        timestamp: new Date(),
        workflow: workflowParsed.workflow || undefined
      }

      setMessages(prev => [...prev, assistantMessage])
      setStreamingMessage('')
      
      // Reload conversations to show the new auto-saved conversation
      loadConversations()
      
      // Call callback to refresh workflows list
      if (onWorkflowSaved && workflowParsed.workflow) {
        onWorkflowSaved()
      }
      
      // Keep live canvas visible if workflow was generated successfully
      if (workflowParsed.workflow) {
        setStreamingWorkflow(workflowParsed.workflow)
        // Keep showLiveCanvas true so user can see the final result
      } else {
        // Only hide if no workflow was generated
        setShowLiveCanvas(false)
        setStreamingWorkflow(null)
      }
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
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

  const createNewChat = () => {
    setMessages([])
    setStreamingMessage('')
    setCurrentConversationId(undefined)
  }

  const loadConversation = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/ai/conversations/${conversationId}`)
      if (response.ok) {
        const conversation = await response.json()
        const loadedMessages = conversation.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
        setMessages(loadedMessages)
        setCurrentConversationId(conversationId)
      }
    } catch (error) {
      console.error('Error loading conversation:', error)
    }
  }

  const saveChat = () => {
    if (messages.length === 0) return
    
    const chatData = {
      messages,
      timestamp: new Date().toISOString(),
      title: messages[0]?.content.slice(0, 50) + '...' || 'Chat Export',
      conversationId: currentConversationId
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
    setCurrentConversationId(undefined)
  }

  // Workflow functions
  const saveWorkflowToDatabase = async (workflow: any, title: string) => {
    try {
      console.log('Saving workflow:', { workflow, title })
      const response = await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: title,
          description: `AI Generated workflow: ${title}`,
          definition: JSON.stringify(workflow)
        })
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Save failed:', errorText)
        throw new Error(`Failed to save workflow: ${errorText}`)
      }
      
      const savedWorkflow = await response.json()
      console.log('Workflow saved successfully:', savedWorkflow)
      
      // Call the callback to refresh workflow list
      if (onWorkflowSaved) {
        onWorkflowSaved()
      }
      
      return savedWorkflow
    } catch (error) {
      console.error('Error saving workflow:', error)
      throw error
    }
  }

  const runWorkflow = async (workflow: any) => {
    try {
      // This would integrate with your workflow execution system
      console.log('Running workflow:', workflow)
      // You can add the actual workflow execution logic here
      // Example: POST to /api/workflows/execute
    } catch (error) {
      console.error('Error running workflow:', error)
      throw error
    }
  }

  const copyWorkflow = (workflow: any) => {
    navigator.clipboard.writeText(JSON.stringify(workflow, null, 2))
      .then(() => {
        // Could add a toast notification here
        console.log('Workflow copied to clipboard')
      })
      .catch(err => console.error('Failed to copy workflow:', err))
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
  }

  const formatMessage = (content: string) => {
    // Basic markdown-like formatting
    return content
      .split('\n')
      .map((line, index) => {
        // Headers
        if (line.startsWith('###')) {
          return <h3 key={index} className="text-lg font-semibold mb-2 mt-4">{line.replace('###', '').trim()}</h3>
        }
        if (line.startsWith('##')) {
          return <h2 key={index} className="text-xl font-bold mb-3 mt-4">{line.replace('##', '').trim()}</h2>
        }
        if (line.startsWith('#')) {
          return <h1 key={index} className="text-2xl font-bold mb-3 mt-4">{line.replace('#', '').trim()}</h1>
        }
        if (line.startsWith('**')) {
          return <strong key={index}>{line.replace(/\*\*(.*?)\*\*/g, '$1')}</strong>
        }
        if (line.startsWith('*')) {
          return <em key={index}>{line.replace(/\*(.*?)\*/g, '$1')}</em>
        }
        if (line.startsWith('>')) {
          return <blockquote key={index} className="border-l-2 pl-4 italic text-muted-foreground mb-2">{line.replace(/>/g, '').trim()}</blockquote>
        }  

        // Code blocks
        if (line.startsWith('```')) {
          return <div key={index} className="bg-muted/50 rounded-lg p-3 mt-2 mb-2 font-mono text-sm border">{line.replace(/```/g, '')}</div>
        }
        
        // Bullet points
        if (line.trim().startsWith('•') || line.trim().startsWith('-') || line.trim().startsWith('*')) {
          return <li key={index} className="ml-4 mb-1">{line.replace(/^[\s]*[•\-\*][\s]*/, '')}</li>
        }
        
        // Numbered lists
        if (/^\d+\./.test(line.trim())) {
          return <li key={index} className="ml-4 mb-1 list-decimal list-inside">{line.replace(/^\d+\.\s*/, '')}</li>
        }
        
        // Bold text
        const boldText = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        
        // Empty lines
        if (line.trim() === '') {
          return <br key={index} />
        }
        
        return <p key={index} className="mb-2" dangerouslySetInnerHTML={{ __html: boldText }} />
      })
  }

  const quickPrompts = [
    {
      icon: <Sparkles className="w-4 h-4" />,
      title: "Generate Workflow",
      description: "Create a workflow to scrape product prices from an e-commerce site",
    },
    {
      icon: <Code className="w-4 h-4" />,
      title: "Debug Workflow",
      description: "Help me fix errors in my current workflow",
    },
    {
      icon: <Zap className="w-4 h-4" />,
      title: "Optimize Process",
      description: "Make my workflow faster and more reliable",
    },
  ]

  return (
    <div className="h-screen mx-auto flex flex-col bg-background">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-border bg-card">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">AI Workflow Generator</h1>
              <p className="text-sm text-muted-foreground">
                {currentConversationId ? 'Active conversation' : 'Generate and optimize workflows'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={createNewChat}
              className="flex items-center gap-2"
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
                  className="flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearChat}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear
                </Button>
              </>
            )}
          </div>
        </div>
        
        {/* Saved Conversations */}
        {savedConversations.length > 0 && messages.length === 0 && (
          <div className="px-6 pb-4">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-sm font-medium text-muted-foreground">Recent Conversations</h3>
            </div>
            <div className="flex gap-2 overflow-x-auto">
              {savedConversations.slice(0, 5).map((conversation) => (
                <Card 
                  key={conversation.id} 
                  className="min-w-[200px] cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => loadConversation(conversation.id)}
                >
                  <CardContent className="p-3">
                    <p className="text-sm font-medium truncate">{conversation.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(conversation.updatedAt).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Messages Container - Fixed height with scroll */}
      <div className="flex-1 min-h-0">
        <div className="h-full overflow-y-auto">
          <div className="max-w-4xl mx-auto px-6 py-6">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                  <Bot className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-2xl font-semibold text-foreground mb-2">
                  Start creating workflows
                </h2>
                <p className="text-muted-foreground text-center mb-8 max-w-md">
                  Describe what you want to scrape or automate, and I'll help you build it
                </p>
                
                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-3xl">
                  {quickPrompts.map((prompt, index) => (
                    <Card 
                      key={index} 
                      className="cursor-pointer hover:bg-accent/50 transition-colors"
                      onClick={() => setInput(prompt.description)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                            {prompt.icon}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-medium text-foreground text-sm mb-1">
                              {prompt.title}
                            </h3>
                            <p className="text-muted-foreground text-xs">
                              {prompt.description}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex gap-3",
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    {message.role === 'assistant' && (
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                        <Bot className="w-4 h-4 text-primary-foreground" />
                      </div>
                    )}
                    
                    <div
                      className={cn(
                        "max-w-2xl rounded-2xl px-4 py-3 border",
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-card text-card-foreground border-border'
                      )}
                    >
                      <div className="text-sm leading-relaxed">
                        {message.role === 'assistant' ? 
                          formatMessage(message.content) : 
                          <p>{message.content}</p>
                        }
                      </div>
                      
                      {/* Workflow Details */}
                      {message.workflow && (
                        <div className="mt-4">
                          <WorkflowDetails 
                            workflow={message.workflow}
                            explanation={message.content}
                            onSave={() => saveWorkflowToDatabase(message.workflow, 'AI Generated Workflow')}
                            onRun={() => runWorkflow(message.workflow)}
                            onCopy={() => copyWorkflow(message.workflow)}
                            onDownload={() => downloadWorkflow(message.workflow)}
                          />
                        </div>
                      )}
                      
                      {/* Legacy Workflow Actions (keeping for compatibility) */}
                      {message.workflow && (
                        <div className="mt-3 pt-3 border-t border-border/50">
                          <div className="flex items-center gap-2 mb-2">
                            <Code className="w-4 h-4 text-primary" />
                            <span className="text-xs font-medium text-muted-foreground">
                              Quick Actions
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-xs h-7"
                                  onClick={() => setViewingWorkflow(message.workflow)}
                                >
                                  <Eye className="w-3 h-3 mr-1" />
                                  View Canvas
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-6xl h-[80vh]">
                                <DialogHeader>
                                  <DialogTitle>Workflow Canvas</DialogTitle>
                                </DialogHeader>
                                {viewingWorkflow && (
                                  <WorkflowCanvas
                                    workflow={viewingWorkflow}
                                    title="AI Generated Workflow"
                                    onSave={saveWorkflowToDatabase}
                                    onRun={runWorkflow}
                                  />
                                )}
                              </DialogContent>
                            </Dialog>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs h-7"
                              onClick={() => {
                                saveWorkflowToDatabase(message.workflow, 'AI Generated Workflow')
                                  .then(() => alert('Workflow saved successfully!'))
                                  .catch(() => alert('Failed to save workflow'))
                              }}
                            >
                              <Sparkles className="w-3 h-3 mr-1" />
                              Save to Workflows
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      <div className={cn(
                        "text-xs mt-2 opacity-60",
                        message.role === 'user' ? 'text-primary-foreground' : 'text-muted-foreground'
                      )}>
                        {message.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                    
                    {message.role === 'user' && (
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                        <User className="w-4 h-4 text-secondary-foreground" />
                      </div>
                    )}
                  </div>
                ))}
                
                {/* Streaming message */}
                {streamingMessage && (
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                      <Bot className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <div className="max-w-2xl rounded-2xl px-4 py-3 border bg-card text-card-foreground border-border">
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

      {/* Live Canvas View - Shows workflow as it's being generated */}
      {showLiveCanvas && streamingWorkflow && (
        <div className="border-t border-border bg-muted/30">
          <div className="max-w-6xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <h3 className="text-lg font-semibold">Live Workflow Preview</h3>
                <span className="text-sm text-muted-foreground">Building your workflow in real-time...</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLiveCanvas(false)}
              >
                Hide Preview
              </Button>
            </div>
            <div className="h-[400px] border rounded-lg bg-background">
              <WorkflowCanvas
                workflow={streamingWorkflow}
                title="Live AI Workflow"
                onSave={saveWorkflowToDatabase}
                onRun={runWorkflow}
              />
            </div>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="flex-shrink-0 border-t border-border bg-card">
        <div className="max-w-4xl mx-auto px-6 py-4 space-y-4">
          {/* Component Picker */}
          <ComponentPicker 
            onComponentSelect={(componentText) => {
              setInput(prev => prev ? `${prev} ${componentText}` : componentText)
              textareaRef.current?.focus()
            }}
          />
          
          <form onSubmit={handleSubmit} className="flex items-end gap-3">
            <div className="flex-1">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe the workflow you want to create..."
                className="w-full min-h-[44px] max-h-[100px] px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                disabled={isLoading}
                rows={1}
              />
            </div>
            <Button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="h-[44px] px-4 rounded-xl"
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
  )
}

export default ChatInterface
