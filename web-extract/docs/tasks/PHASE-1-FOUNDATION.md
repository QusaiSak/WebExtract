# Phase 1: Foundation & Core AI Integration

## Overview
Build the foundational AI services and integrate them with the existing workflow system.

**Timeline**: Week 1-2  
**Priority**: High  
**Dependencies**: OpenRouter SDK, existing workflow system

---

## Task 1.1: AI Service Layer

### 1.1.1 Complete OpenRouter Integration
**Description**: Set up streaming responses with proper error handling and token management

**Files to create/modify**:
- `lib/openrouter.ts` (already started)
- `lib/ai/workflow-service.ts`
- `lib/ai/types.ts`

**Acceptance Criteria**:
- [ ] Streaming AI responses work reliably
- [ ] Proper error handling for API failures
- [ ] Token usage tracking and limits
- [ ] Retry mechanism for failed requests

**Technical Requirements**:
- Use Vercel AI SDK with OpenRouter provider
- Implement exponential backoff for retries
- Add response validation
- Handle rate limiting gracefully

---

### 1.1.2 Workflow-Specific Prompt Templates
**Description**: Create specialized prompts for different workflow operations

**Files to create**:
- `lib/prompts/workflow-generation.ts`
- `lib/prompts/workflow-modification.ts`
- `lib/prompts/workflow-optimization.ts`

**Acceptance Criteria**:
- [ ] AI generates valid ReactFlow node structures
- [ ] Prompts include all available node types
- [ ] Context-aware prompt building
- [ ] Handles edge cases and validation

**Key Node Types to Include**:
- LAUNCH_BROWSER (entry point)
- NAVIGATE_URL 
- WAIT_FOR_ELEMENT
- EXTRACT_TEXT
- FILL_FORM
- CLICK_ELEMENT
- EXTRACT_DATA_WITH_AI
- PAGE_TO_HTML
- READ_PROPERTY_FROM_JSON

---

### 1.1.3 Conversation Context Management
**Description**: Track conversation history and context for multi-turn interactions

**Files to create**:
- `lib/ai/conversation-manager.ts`
- `lib/ai/context-builder.ts`

**Acceptance Criteria**:
- [ ] Maintains conversation history
- [ ] Builds context from current workflow state
- [ ] Handles context window limitations
- [ ] Persists conversations across sessions

---

## Task 1.2: Workflow Understanding Engine

### 1.2.1 Workflow State Analyzer
**Description**: Analyze current workflow and provide detailed context to AI

**Files to create**:
- `lib/workflow/analyzer.ts`
- `lib/workflow/workflow-context.ts`

**Acceptance Criteria**:
- [ ] Extracts workflow structure and relationships
- [ ] Identifies workflow patterns and complexity
- [ ] Provides natural language description of workflow
- [ ] Detects potential issues or optimizations

**Analysis Features**:
- Node count and types
- Connection patterns
- Data flow analysis
- Performance bottlenecks
- Missing validations
- Best practice compliance

---

### 1.2.2 Node Type Mapping and Validation
**Description**: Validate AI-generated nodes against existing task registry

**Files to modify**:
- `lib/workflow/task/Registry.ts` (extend with validation)
- Create `lib/ai/node-validator.ts`

**Acceptance Criteria**:
- [ ] Validates node structure and parameters
- [ ] Checks input/output compatibility
- [ ] Ensures proper handle connections
- [ ] Validates required parameters

---

## Task 1.3: Database Extensions

### 1.3.1 AI Conversation Schema
**Description**: Add database tables for storing AI conversations and metadata

**Files to create/modify**:
- `prisma/schema.prisma` (add new models)
- Migration files
- `lib/ai/conversation-db.ts`

**New Database Models**:

```prisma
model AIConversation {
  id          String   @id @default(cuid())
  workflowId  String
  userId      String
  title       String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  workflow    Workflow @relation(fields: [workflowId], references: [id], onDelete: Cascade)
  messages    AIMessage[]
  
  @@map("ai_conversations")
}

model AIMessage {
  id             String   @id @default(cuid())
  conversationId String
  role           String   // "user" or "assistant"
  content        String   @db.Text
  metadata       Json?    // Store additional context
  createdAt      DateTime @default(now())
  
  conversation   AIConversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  
  @@map("ai_messages")
}

model WorkflowGeneration {
  id                String   @id @default(cuid())
  workflowId        String
  prompt            String   @db.Text
  generatedNodes    Json
  generatedEdges    Json
  userAccepted      Boolean  @default(false)
  createdAt         DateTime @default(now())
  
  workflow          Workflow @relation(fields: [workflowId], references: [id], onDelete: Cascade)
  
  @@map("workflow_generations")
}
```

**Acceptance Criteria**:
- [ ] Database schema migrated successfully
- [ ] Can store and retrieve conversations
- [ ] Tracks workflow generation history
- [ ] Proper foreign key relationships

---

## Task 1.4: API Routes

### 1.4.1 AI Workflow Generation API
**Description**: Create API endpoints for AI workflow operations

**Files to create**:
- `app/api/ai/generate-workflow/route.ts`
- `app/api/ai/modify-workflow/route.ts`
- `app/api/ai/chat/route.ts`

**Endpoints**:

```typescript
// POST /api/ai/generate-workflow
{
  prompt: string;
  currentWorkflow?: { nodes: AppNode[], edges: Edge[] };
  conversationId?: string;
}

// POST /api/ai/modify-workflow  
{
  modification: string;
  workflowId: string;
  conversationId: string;
}

// POST /api/ai/chat
{
  message: string;
  workflowId: string;
  conversationId?: string;
}
```

**Acceptance Criteria**:
- [ ] Streaming responses work correctly
- [ ] Proper authentication and authorization
- [ ] Error handling and validation
- [ ] Rate limiting for API protection

---

## Task 1.5: Testing & Validation

### 1.5.1 Unit Tests
**Description**: Create comprehensive tests for AI services

**Files to create**:
- `__tests__/ai/workflow-service.test.ts`
- `__tests__/ai/conversation-manager.test.ts`
- `__tests__/workflow/analyzer.test.ts`

**Test Coverage**:
- [ ] AI service functions
- [ ] Workflow analysis
- [ ] Conversation management
- [ ] Database operations
- [ ] Error scenarios

---

### 1.5.2 Integration Tests  
**Description**: Test AI integration with existing workflow system

**Files to create**:
- `__tests__/integration/ai-workflow.test.ts`

**Integration Points**:
- [ ] AI-generated workflows execute correctly
- [ ] ReactFlow integration works smoothly
- [ ] Database operations are atomic
- [ ] Error handling maintains system stability

---

## Success Metrics

### Technical Metrics
- [ ] AI response time < 2 seconds for first token
- [ ] 95% uptime for AI services
- [ ] Generated workflows pass validation 90% of the time
- [ ] Memory usage stays within acceptable limits

### Quality Metrics
- [ ] AI generates syntactically correct workflows
- [ ] Generated workflows are logically sound
- [ ] Conversation context is maintained accurately
- [ ] Error messages are helpful and actionable

---

## Risk Mitigation

### Potential Risks
1. **AI API Rate Limits**: Implement proper rate limiting and fallback mechanisms
2. **Invalid Workflow Generation**: Strong validation before applying changes
3. **Performance Impact**: Optimize AI calls and use caching where appropriate
4. **Cost Management**: Monitor token usage and implement limits

### Mitigation Strategies
- Implement circuit breaker pattern for API calls
- Add comprehensive validation layer
- Use streaming for better perceived performance
- Set up monitoring and alerting for costs and errors

---

## Dependencies

### External
- OpenRouter API access
- Vercel AI SDK
- Database migration capabilities

### Internal  
- Existing workflow execution engine
- Task registry system
- ReactFlow implementation
- User authentication system

---

## Next Phase Preview

Phase 2 will focus on building the chat interface that will consume these AI services, creating the user-facing components for the AI workflow generator.
