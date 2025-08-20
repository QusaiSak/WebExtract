# 🏗️ AI Workflow Generator - Backend Implementation

## Overview
Backend implementation for AI-powered workflow generation system. This document covers the core AI engine, API endpoints, and database integration needed to power the conversational workflow editing experience.

## Architecture
- **AI Service Layer**: OpenRouter integration for streaming responses
- **Workflow Processing**: Convert AI responses to ReactFlow format
- **API Endpoints**: RESTful streaming endpoints for chat interface
- **Database**: Conversation persistence and workflow linking

---

## 🏗️ Backend Implementation Details

### Week 1: AI Engine Foundation

#### Task 1.1: `lib/openrouter.ts` - Main AI Service

**Priority**: Critical | **Time**: 3-4 days

**Core Functions**:
```typescript
// Generate initial workflow from prompt
export async function generateWorkflow(
  prompt: string, 
  context?: WorkflowContext
): Promise<ReadableStream>

// Modify existing workflow through conversation
export async function modifyWorkflow(
  request: string,
  currentWorkflow: { nodes: AppNode[], edges: Edge[] },
  conversationHistory: Message[]
): Promise<ReadableStream>

// Build context for AI from current workflow state
export function buildWorkflowContext(
  workflow?: { nodes: AppNode[], edges: Edge[] },
  executionHistory?: any[]
): WorkflowContext
```

**Key Features**:

- Streaming responses using Vercel AI SDK
- Conversation context management (last 10 messages + current workflow)
- Response parsing to extract workflow JSON
- Error handling and retry mechanisms
- Rate limiting and token usage tracking

**Success Criteria**:

- [ ] Streams workflow generation responses smoothly
- [ ] Maintains conversation context across multiple turns  
- [ ] Parses AI responses into valid workflow JSON 90% of time
- [ ] Handles API errors gracefully with user feedback

---

#### Task 1.2: `lib/prompts.ts` - AI Instruction Templates

**Priority**: High | **Time**: 1-2 days

**Prompt Structure**:
```typescript
export const SYSTEM_PROMPT = `You are an expert web scraping workflow generator...`

export const WORKFLOW_GENERATION_PROMPT = (context: WorkflowContext) => `
Current workflow context: ${JSON.stringify(context)}
Available node types: ${NODE_TYPES.join(', ')}
Generate workflow for: {user_prompt}
`

export const MODIFICATION_PROMPT = (request: string, workflow: any) => `
Current workflow: ${JSON.stringify(workflow)}  
User request: ${request}
Modify the workflow to satisfy the request.
`
```

**Node Types to Include**:

- LAUNCH_BROWSER (entry point)
- NAVIGATE_URL (go to website)
- WAIT_FOR_ELEMENT (wait for page load)
- EXTRACT_TEXT (get text content)
- FILL_FORM (input data)
- CLICK_ELEMENT (interact with page)
- EXTRACT_DATA_WITH_AI (AI-powered extraction)

**Success Criteria**:

- [ ] AI consistently generates valid ReactFlow workflow JSON
- [ ] Understands all available node types and their parameters
- [ ] Can modify specific nodes without breaking workflow
- [ ] Handles complex multi-step workflows (10+ nodes)

---

#### Task 1.3: `lib/workflow-ai.ts` - AI ↔ ReactFlow Conversion

**Priority**: Critical | **Time**: 2-3 days

**Core Functions**:
```typescript
// Convert AI JSON response to ReactFlow format
export function parseAIWorkflow(aiResponse: string): {
  nodes: AppNode[],
  edges: Edge[],
  errors?: string[]
}

// Generate unique IDs and proper positioning
export function optimizeWorkflowLayout(
  nodes: AppNode[],
  edges: Edge[]
): { nodes: AppNode[], edges: Edge[] }

// Validate workflow structure before applying
export function validateWorkflow(workflow: any): {
  isValid: boolean,
  errors: string[]
}

// Apply workflow updates to existing ReactFlow
export function mergeWorkflowUpdates(
  currentWorkflow: { nodes: AppNode[], edges: Edge[] },
  updates: { nodes: AppNode[], edges: Edge[] }
): { nodes: AppNode[], edges: Edge[] }
```

**Key Features**:

- Parse streaming AI responses incrementally
- Generate unique node IDs (crypto.randomUUID())
- Intelligent node positioning (hierarchical layout)
- Validation against existing TaskType enum
- Handle partial workflow updates for conversations

**Success Criteria**:

- [ ] Converts AI JSON to valid ReactFlow format 95% of time
- [ ] Positions nodes without overlaps or clustering
- [ ] Validates workflows before applying to prevent errors
- [ ] Handles incremental updates for conversation-based changes

---

#### Task 1.4: `lib/ai-context.ts` - Context Building Utilities  

**Priority**: Medium | **Time**: 1 day

**Functions**:
```typescript
// Extract relevant context from current workflow
export function extractWorkflowContext(
  workflow?: { nodes: AppNode[], edges: Edge[] }
): WorkflowContext

// Build conversation context for AI
export function buildConversationContext(
  messages: Message[],
  maxMessages: number = 10
): string

// Analyze workflow for AI understanding
export function analyzeWorkflowStructure(
  workflow: { nodes: AppNode[], edges: Edge[] }
): WorkflowAnalysis
```

**Context Information**:

- Current workflow structure (nodes, edges, flow)
- Node types and their configurations  
- Data flow and dependencies
- Previous conversation history
- User's recent actions and modifications

---

#### Task 1.5: `app/api/ai/chat/route.ts` - API Endpoint

**Priority**: High | **Time**: 1-2 days

**API Structure**:
```typescript
// POST /api/ai/chat
interface ChatRequest {
  message: string
  conversationId?: string
  workflowId?: string
  currentWorkflow?: { nodes: AppNode[], edges: Edge[] }
}

interface ChatResponse {
  // Streaming response with workflow updates
}
```

**Features**:

- Streaming response using Vercel AI SDK
- Authentication with Clerk
- Conversation persistence
- Error handling and validation
- Rate limiting per user

---

#### Task 1.6: Database Schema Update

**Priority**: Medium | **Time**: 1 day

**New Prisma Model**:
```prisma
model AiConversation {
  id          String    @id @default(cuid())
  userId      String
  workflowId  String?   
  title       String?   // Auto-generated from first message
  messages    Json      // Array of {role, content, timestamp}
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  workflow    Workflow? @relation(fields: [workflowId], references: [id], onDelete: Cascade)
  
  @@map("ai_conversations")
}

// Add to existing Workflow model
model Workflow {
  // ... existing fields
  aiConversations AiConversation[]
}
```

---

## 📊 Backend Success Metrics

### Technical Success Criteria

- [ ] AI generates valid workflows 85% of the time
- [ ] Streaming responses work smoothly (< 2s first token)
- [ ] Conversation context maintained across 10+ turns
- [ ] Database operations complete reliably
- [ ] API handles 50+ concurrent users

### Performance Requirements

- **Response Time**: First token < 2 seconds
- **Throughput**: 50+ concurrent streaming connections
- **Reliability**: 99.5% uptime for API endpoints
- **Context Management**: Handle 10+ message history efficiently
- **Error Rate**: < 5% AI parsing failures

### Integration Points

- **Database**: Seamless integration with existing Workflow schema
- **Authentication**: Full Clerk integration for user management
- **Rate Limiting**: Per-user limits to prevent abuse
- **Monitoring**: Comprehensive logging and error tracking
- **Testing**: Unit tests for all core functions, integration tests for API endpoints
