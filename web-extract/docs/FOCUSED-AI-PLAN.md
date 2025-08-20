# 🤖 AI Workflow Generator - Detailed Plan

## 🎯 Vision: Lovable for Web Scraping Workflows

User types: "Scrape Amazon product prices" → AI generates workflow directly in ReactFlow editor → User can say "Add error handling to the login step" → AI modifies that specific node → User tests immediately.

---

## 📁 File Structure

### Backend Logic (AI Engine)
```
lib/
├── openrouter.ts                    # Main AI service
├── prompts.ts                       # Prompt templates
├── workflow-ai.ts                   # AI ↔ ReactFlow conversion
└── ai-context.ts                    # Context building utilities

app/api/ai/
└── chat/route.ts                    # Streaming chat API endpoint

prisma/
└── schema.prisma                    # Database schema updates
```

### Frontend UI (Chat Interface)  
```
app/workflow/_components/AIChat/
├── ChatPanel.tsx                    # Main collapsible panel
├── MessageStream.tsx                # Streaming message display
├── MessageInput.tsx                 # Chat input with actions
├── WorkflowActions.tsx              # Apply/Test/Explain buttons
├── ConversationHistory.tsx          # Message history list
└── StreamingIndicator.tsx           # Loading/typing indicators
```

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

## 🎨 Frontend Implementation Details

### Week 2: Chat Interface Components

#### Task 2.1: `ChatPanel.tsx` - Main Chat Container
**Priority**: Critical | **Time**: 2-3 days

**Component Structure**:
```typescript
interface ChatPanelProps {
  workflowId?: string
  currentWorkflow?: { nodes: AppNode[], edges: Edge[] }
  onWorkflowUpdate?: (workflow: any) => void
}

export default function ChatPanel({ 
  workflowId, 
  currentWorkflow, 
  onWorkflowUpdate 
}: ChatPanelProps)
```

**Features**:
- Collapsible sidebar (300px width, slides from right)
- Integration with existing workflow editor layout
- Keyboard shortcut (Ctrl+/ or Cmd+/) to toggle
- Responsive design (collapses on mobile)
- State persistence across page refreshes

**UI Structure**:
```jsx
<div className="fixed right-0 top-0 h-full bg-background border-l">
  <ChatHeader onClose={handleClose} />
  <ConversationHistory messages={messages} />
  <MessageInput onSend={handleSend} />
  <WorkflowActions workflow={currentWorkflow} />
</div>
```

---

#### Task 2.2: `MessageStream.tsx` - Streaming Message Display
**Priority**: High | **Time**: 2 days

**Features**:
- Real-time streaming text display (character by character)
- Syntax highlighting for workflow JSON
- Message timestamps and user/AI indicators
- Loading states and typing indicators
- Auto-scroll to latest message
- Copy to clipboard functionality

**Component Structure**:
```typescript
interface StreamingMessageProps {
  message: {
    id: string
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
    isStreaming?: boolean
  }
}
```

---

#### Task 2.3: `MessageInput.tsx` - Chat Input Interface
**Priority**: High | **Time**: 1-2 days

**Features**:
- Auto-expanding textarea (max 5 lines)
- Send on Enter, Shift+Enter for new line
- Suggested prompts based on workflow state
- Voice input button (future enhancement)
- Character limit indicator
- Send button with loading state

**Smart Suggestions**:
- "Add error handling to this workflow"
- "Optimize the data extraction steps"  
- "Add retry logic for network requests"
- "Explain how this workflow works"

---

#### Task 2.4: `WorkflowActions.tsx` - Action Buttons
**Priority**: Critical | **Time**: 1-2 days

**Action Buttons**:
```typescript
interface WorkflowActionsProps {
  workflow?: { nodes: AppNode[], edges: Edge[] }
  onApply: (workflow: any) => void
  onTest: () => void
  onExplain: () => void
}
```

**Actions**:
- **Apply Changes**: Apply AI-generated workflow to editor
- **Test Workflow**: Run workflow validation/execution
- **Explain**: Get AI explanation of current workflow
- **Reset**: Clear conversation and start over
- **Save**: Save current conversation

---

#### Task 2.5: `ConversationHistory.tsx` - Message History
**Priority**: Medium | **Time**: 1 day

**Features**:
- Scrollable message list with virtualization
- Message grouping by date
- Search functionality
- Export conversation option
- Message reactions (👍/👎 for feedback)

---

#### Task 2.6: `StreamingIndicator.tsx` - Loading States
**Priority**: Low | **Time**: 0.5 days

**Indicators**:
- Typing dots animation when AI is thinking
- Progress indicator for workflow generation
- Connection status indicator
- Error state displays

---

### Week 3: Integration & Real-time Updates

#### Task 3.1: FlowEditor Integration
**Priority**: Critical | **Time**: 2-3 days

**Integration Points**:
- Add chat panel toggle to existing toolbar
- Share workflow state between editor and chat
- Handle AI-generated workflow updates in real-time
- Maintain undo/redo history with AI changes
- Preserve user selections during AI updates

**Modifications to Existing Files**:
- `FlowEditor.tsx`: Add chat panel, workflow update handlers
- `Editor.tsx`: Adjust layout for chat panel
- `Topbar.tsx`: Add AI chat toggle button

---

#### Task 3.2: Real-time Workflow Updates  
**Priority**: Critical | **Time**: 2-3 days

**Features**:
- Stream workflow changes to ReactFlow as AI responds
- Smooth animations for node additions/modifications
- Conflict resolution if user edits during AI generation
- Visual indicators for AI-generated vs user-created nodes
- Ability to interrupt AI generation

**Animation Strategy**:
- New nodes fade in with slight scale animation
- Modified nodes highlight briefly
- Edges draw with smooth path animation
- Layout changes transition smoothly

---

#### Task 3.3: Testing Integration
**Priority**: High | **Time**: 1-2 days

**Integration with Existing System**:
- "Test Workflow" button triggers existing validation
- Display test results in chat interface
- AI learns from test failures to improve suggestions
- Quick fix suggestions based on test errors

---

## 📊 Success Metrics & Validation

### Backend Success Criteria
- [ ] AI generates valid workflows 85% of the time
- [ ] Streaming responses work smoothly (< 2s first token)
- [ ] Conversation context maintained across 10+ turns
- [ ] Database operations complete reliably
- [ ] API handles 50+ concurrent users

### Frontend Success Criteria  
- [ ] Chat panel integrates seamlessly with existing editor
- [ ] Message streaming feels natural (like ChatGPT)
- [ ] Workflow updates appear smoothly in real-time
- [ ] No performance impact on existing editor functionality
- [ ] Mobile responsive design works well

### User Experience Goals
- [ ] User can generate basic workflow in < 2 minutes
- [ ] Conversation flow feels natural and helpful
- [ ] Workflow modifications work as expected
- [ ] Testing integration provides valuable feedback
- [ ] Overall experience comparable to Lovable/Cursor

---

## 🎯 Key Features

### Lovable-Style Experience
- **Real-time Generation**: Workflow appears in editor as AI streams response
- **Conversational Editing**: "Make the login more robust" → AI updates specific nodes
- **Immediate Testing**: Test button right in chat, results inform next AI response
- **Visual Feedback**: See changes happen live in ReactFlow

### Smart Conversations
- **Context Aware**: AI knows current workflow state and history
- **Specific Targeting**: "Change the third extraction step" → AI finds and modifies exact node
- **Bulk Operations**: "Add error handling to all form steps" → AI updates multiple nodes
- **Learning**: Store successful patterns for future use

### Database Integration
- **Conversation History**: Full chat history stored with workflow references
- **Workflow Versions**: Each AI modification saves new workflow version
- **Context Building**: AI can reference previous conversations about same workflow
- **Pattern Storage**: Save successful workflow patterns for reuse

---

## 🔧 Technical Implementation

### `lib/openrouter.ts` Functions
```typescript
// Main workflow generation
generateWorkflow(prompt: string, context?: WorkflowContext): Stream

// Targeted modifications  
modifyWorkflow(request: string, currentWorkflow: any, conversationHistory: any[]): Stream

// Parse streaming AI response into ReactFlow format
parseWorkflowStream(aiResponse: string): { nodes: AppNode[], edges: Edge[] }

// Build context from current workflow for AI
buildContext(workflow?: any, history?: any[]): WorkflowContext
```

### Chat Panel Integration Points
- **FlowEditor.tsx**: Add chat panel toggle, share workflow state
- **Editor.tsx**: Adjust layout for collapsible chat panel  
- **Existing workflow**: Use current save/load system, add AI conversation reference

### Real-time Updates
- AI streaming → Parse response → Update ReactFlow nodes/edges in real-time
- Smooth animations as nodes appear/modify
- User can interrupt generation process
- Undo/redo works with AI changes

---

## 📊 Success Criteria (Realistic for Solo Project)

### MVP Goals
- [ ] "Scrape Amazon products" → Generates functional workflow in editor
- [ ] "Add login step before scraping" → Modifies workflow correctly  
- [ ] "Test this workflow" → Runs validation and provides feedback
- [ ] Conversation history persists across sessions
- [ ] 70% of generated workflows are valid and testable

### User Experience
- [ ] Chat panel integrates smoothly with existing editor
- [ ] Streaming responses feel natural (like ChatGPT/Lovable)
- [ ] Workflow changes appear smoothly in real-time
- [ ] Testing integration works seamlessly
- [ ] No performance impact on existing editor

---

## 🚀 Getting Started

### Day 1-2: Setup AI Foundation
1. Complete `lib/openrouter.ts` with basic streaming
2. Create prompts that understand your workflow node types  
3. Test: AI can generate basic workflow JSON

### Week 1: Core AI Working
- AI generates workflows from natural language
- Basic conversation handling
- Database stores conversations with workflow references

### Week 2: Chat Interface  
- Chat panel in workflow editor
- Streaming messages work smoothly  
- Apply button updates ReactFlow editor

### Week 3: Polish & Testing
- Real-time workflow updates as AI streams
- Test workflow integration
- Conversation improvements and context awareness

**Result**: A working AI workflow generator that feels like Lovable but for web scraping, with minimal complexity and maximum impact!
