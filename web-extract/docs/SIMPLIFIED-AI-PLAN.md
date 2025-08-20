# 🤖 AI Workflow Generator - Focused Plan

## 🎯 Project Vision
Create an AI-powered workflow generator similar to Lovable but for web scraping. Users describe what they want to scrape, AI generates a ReactFlow workflow in real-time that appears directly in the editor, and they can iterate through conversation.

## 🏗️ Simple Architecture

### Core Files (Only 6 files!)
```
lib/
  openrouter.ts           # ALL AI magic happens here
  prompts.ts             # All prompts organized
  
app/workflow/_components/AIChat/
  ChatPanel.tsx          # Collapsible chat panel in editor
  MessageStream.tsx      # Streaming messages
  WorkflowActions.tsx    # Apply/Test buttons
  
prisma/
  schema.prisma         # Add AI conversation + workflow reference
```

### Data Flow Like Lovable
```
User: "Scrape Amazon product prices" 
→ AI streams response 
→ Workflow appears in ReactFlow editor in real-time
→ User: "Add error handling to login" 
→ AI modifies specific nodes
→ User can test immediately
```

---

## 🚀 Implementation Phases (Simplified)

### Phase 1: Core AI Integration (Week 1)

#### 1.1 AI Service (`lib/openrouter.ts`)
- [ ] Complete streaming workflow generation
- [ ] Handle conversation context
- [ ] Parse AI responses to workflow JSON
- [ ] Basic error handling

#### 1.2 Prompts (`lib/prompts.ts`)  
- [ ] Workflow generation prompt
- [ ] Workflow modification prompt
- [ ] Context building utilities

#### 1.3 Database (Minimal)
- [ ] Add simple AI conversation table
- [ ] Store conversation history

### Phase 2: Chat Interface (Week 2)

#### 2.1 Chat Page (`app/dashboard/chatAi/page.tsx`)
- [ ] Main chat interface
- [ ] Message streaming display
- [ ] Workflow preview panel
- [ ] Apply workflow to editor button

#### 2.2 AI Integration
- [ ] Connect chat to AI service
- [ ] Handle workflow application
- [ ] Basic conversation memory

### Phase 3: Workflow Integration (Week 3)

#### 3.1 Workflow Conversion (`lib/workflow-ai.ts`)
- [ ] Convert AI JSON to ReactFlow format
- [ ] Validate generated workflows
- [ ] Apply workflows to editor

#### 3.2 Testing Integration
- [ ] "Test this workflow" button
- [ ] Basic validation feedback
- [ ] Error reporting to AI

---

## 📋 Simplified Task List

### Week 1: AI Foundation

**Task 1.1: Complete `lib/openrouter.ts`**
- Set up streaming AI with conversation context
- Handle workflow generation and modification
- Parse responses into structured format

**Task 1.2: Create `lib/prompts.ts`**
- Main workflow generation prompt
- Modification prompt for conversations
- Context building from existing workflows

**Task 1.3: Minimal Database Update**
- Add conversation table to Prisma schema
- Simple conversation storage and retrieval

### Week 2: Chat Interface  

**Task 2.1: Build Chat Interface in `chatAi` page**
- Simple chat UI with message history
- Streaming message display
- Workflow preview component

**Task 2.2: Connect AI to Chat**
- Wire up AI service to chat interface
- Handle conversation flow
- Basic error handling

### Week 3: Workflow Integration

**Task 3.1: Create `lib/workflow-ai.ts`**
- Convert AI responses to ReactFlow nodes/edges
- Validate workflow structure
- Apply to existing workflow editor

**Task 3.2: Testing Loop**
- "Apply to Editor" button
- "Test Workflow" integration
- Feedback loop for improvements

---

## 🎯 Success Metrics (Simplified)

### MVP Success Criteria
- [ ] User can describe workflow in natural language
- [ ] AI generates valid ReactFlow workflow
- [ ] User can apply workflow to editor
- [ ] User can test workflow immediately
- [ ] Conversation allows refinements

### Technical Goals
- [ ] AI generates valid workflows 80% of the time
- [ ] Response time under 5 seconds
- [ ] Basic conversation memory works
- [ ] Integration with existing editor smooth

---

## 📝 Detailed Tasks

### Task 1.1: Complete `lib/openrouter.ts`
**Description**: Create the main AI service that handles all AI interactions

**Functions to implement**:
```typescript
// Generate initial workflow from prompt
generateWorkflow(prompt: string, context?: WorkflowContext)

// Modify existing workflow based on conversation
modifyWorkflow(request: string, currentWorkflow: WorkflowData, history: Message[])

// Build context from current workflow state  
buildContext(workflow?: WorkflowData): WorkflowContext

// Parse AI response into structured workflow
parseWorkflowResponse(aiResponse: string): WorkflowData
```

### Task 1.2: Create `lib/prompts.ts`
**Description**: All AI prompts in one organized file

**Prompts needed**:
- System prompt for workflow generation
- Context building prompts
- Modification request prompts
- Error handling prompts

### Task 1.3: Minimal Database Schema
**Description**: Add just what's needed for conversation storage

```prisma
model AiConversation {
  id         String    @id @default(cuid())
  userId     String
  workflowId String?
  messages   Json      // Store entire conversation as JSON
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt
}
```

### Task 2.1: Chat Interface in `chatAi` page
**Description**: Build the main AI chat interface

**Components needed**:
- Chat message list with streaming
- Message input with send button
- Workflow preview panel
- "Apply to Editor" button

### Task 2.2: Connect AI Service
**Description**: Wire up the chat interface to AI service

**API endpoints needed**:
- `POST /api/ai/chat` - Main chat endpoint
- Streaming response handling
- Error boundary for AI failures

### Task 3.1: Workflow Conversion Utility
**Description**: Convert AI responses to ReactFlow format

**Key functions**:
```typescript
// Convert AI JSON to ReactFlow nodes and edges
convertToReactFlow(aiWorkflow: any): { nodes: AppNode[], edges: Edge[] }

// Validate workflow structure
validateWorkflow(workflow: any): ValidationResult

// Generate unique IDs and proper positioning
optimizeLayout(nodes: AppNode[], edges: Edge[]): { nodes: AppNode[], edges: Edge[] }
```

### Task 3.2: Testing Integration
**Description**: Connect with existing workflow testing system

**Integration points**:
- Button to apply generated workflow to editor
- Hook into existing workflow validation
- Feedback loop for test results

---

## 🔧 File Structure (Final)

```
lib/
├── openrouter.ts          # Main AI service (all AI logic)
├── prompts.ts             # All prompts organized
└── workflow-ai.ts         # AI ↔ ReactFlow conversion

app/
└── dashboard/chatAi/
    ├── page.tsx           # Main chat interface
    └── _components/
        ├── ChatInterface.tsx     # Chat UI
        ├── WorkflowPreview.tsx   # Preview generated workflow
        └── ApplyButton.tsx       # Apply to editor

api/
└── ai/
    └── chat/route.ts      # Single API endpoint for chat

prisma/
└── schema.prisma          # Add minimal conversation table
```

---

## 🚀 Getting Started

### Week 1 Priority
1. **Start with `lib/openrouter.ts`** - Get basic AI responses working
2. **Create `lib/prompts.ts`** - Define how AI understands workflows
3. **Update database** - Add conversation storage

### Week 2 Priority  
1. **Build chat interface** - Simple, functional UI
2. **Connect to AI** - Wire up the conversation flow
3. **Test basic flow** - Ensure prompt → response → display works

### Week 3 Priority
1. **Workflow conversion** - AI JSON → ReactFlow format
2. **Editor integration** - Apply button that works
3. **Testing loop** - Complete the feedback cycle

This simplified approach focuses on getting the core functionality working quickly while keeping the codebase manageable for a solo developer. You can always add more features and complexity later once the foundation is solid!
