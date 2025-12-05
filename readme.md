# WebExtract - AI-Powered Web Scraping Workflow Builder

<div align="center">

![WebExtract Logo](web-extract/public/logo.svg)

**Transform natural language into executable web scraping workflows**

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22-2D3748?logo=prisma)](https://www.prisma.io/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

</div>

---

## 📖 Overview

WebExtract is a visual workflow builder that lets you create, manage, and execute web scraping pipelines using an intuitive drag-and-drop interface powered by AI. Simply describe what you want to scrape in plain English, and the AI generates a complete workflow—or manually build one node by node.

### Core Value Proposition

> Turn a plain-English goal like *"Log into quotes.toscrape.com, extract quotes + authors, summarize each, send to my webhook"* into a runnable, versioned workflow in seconds—while preserving previously tuned parameters (URLs, selectors, webhook endpoints) across AI iterations.

---

## ✨ Features

### 🤖 AI-Powered Workflow Generation
- **Natural Language to Workflow**: Describe your scraping task and get a complete workflow
- **Conversational Editing**: Modify workflows through chat—"Add an AI cleanup step before the webhook"
- **Context-Aware**: AI preserves your existing URLs, credentials, and configurations
- **Real-Time Updates**: Changes appear instantly on the canvas via Server-Sent Events (SSE)

### 🎨 Visual Workflow Editor
- **Drag & Drop Interface**: Built on [@xyflow/react](https://reactflow.dev/) for smooth graph editing
- **20+ Task Types**: Browser automation, AI extraction, data transformation, exports
- **Smart Connections**: Automatic handle assignment and validation
- **Live Preview**: See your workflow structure update in real-time

### 🔧 Comprehensive Task Library

| Category | Tasks |
|----------|-------|
| **Browser** | Launch Browser, Navigate URL, Page to HTML |
| **Extraction** | Extract Text, Extract Data with AI, Read JSON Property |
| **Interaction** | Fill Input, Click Element, Wait for Element, Scroll |
| **AI & Research** | AI Research Assistant, Translate Text, Detect Language, Generate Document |
| **Export** | CSV, Power BI, PDF, Webhook Delivery |
| **Data** | Add JSON Property, Read JSON Property |

### 📊 Execution & Monitoring
- **Phase-Based Execution**: Track progress through each workflow step
- **Detailed Logs**: Per-node input/output inspection
- **Credit Tracking**: Monitor usage per workflow and execution
- **Status Dashboard**: View all runs with success/failure states

### 💳 Billing & Credits
- **Credit System**: Each task has an associated credit cost
- **Stripe Integration**: Purchase credit packs (Small/Medium/Large)
- **Usage Analytics**: Track spending over time periods

### 🔐 Security
- **Clerk Authentication**: Secure user management
- **Encrypted Credentials**: Store API keys and passwords safely
- **Per-User Isolation**: Workflows are scoped to authenticated users

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Next.js App Router                        │
├─────────────────────────────────────────────────────────────────┤
│  UI Layer                                                        │
│  ├─ Landing Page (Hero, Bento Features, Pricing)                │
│  ├─ Dashboard (Analytics, Workflows, Credentials, Billing)      │
│  ├─ Workflow Editor (ReactFlow Canvas, AI Chat Panel)           │
│  └─ Execution Viewer (Phase logs, Node outputs)                 │
├─────────────────────────────────────────────────────────────────┤
│  API Routes                                                      │
│  ├─ /api/ai/chat     → AI streaming + conversation persistence  │
│  ├─ /api/workflows   → CRUD + SSE broadcast                     │
│  ├─ /api/ws          → SSE subscribe/broadcast channel          │
│  └─ /api/stripe      → Webhook for purchases                    │
├─────────────────────────────────────────────────────────────────┤
│  Server Actions                                                  │
│  ├─ runWorkflow      → Execute workflow phases                  │
│  ├─ analytics        → Dashboard stats                          │
│  ├─ credentials      → Encrypted secret management              │
│  └─ billings         → Credit balance operations                │
├─────────────────────────────────────────────────────────────────┤
│  Core Libraries                                                  │
│  ├─ lib/workflow-ai.ts    → Robust JSON parsing & reconstruction│
│  ├─ lib/openrouter.tsx    → AI provider integration             │
│  ├─ lib/prompts.ts        → System prompts for workflow gen     │
│  └─ lib/workflow/         → Task registry, executors, builders  │
├─────────────────────────────────────────────────────────────────┤
│  Data Layer                                                      │
│  └─ Prisma ORM → PostgreSQL (Neon)                              │
│     ├─ Workflow, WorkflowExecution, ExecutionPhase, ExecutionLog│
│     ├─ AiConversation, Credential, UserBalance, UserPurchase    │
│     └─ Unique constraint: (userId, workflowName)                │
├─────────────────────────────────────────────────────────────────┤
│  Execution Engine                                                │
│  └─ Puppeteer-driven task execution                             │
│     Launch → Navigate → Extract → AI Transform → Deliver        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript (strict mode) |
| **Styling** | Tailwind CSS + shadcn/ui + Radix primitives |
| **Graph Editor** | @xyflow/react |
| **Authentication** | Clerk |
| **Database** | PostgreSQL (Neon) via Prisma ORM |
| **Payments** | Stripe |
| **Browser Automation** | Puppeteer |
| **AI Provider** | OpenRouter (OpenAI-compatible streaming) |
| **Real-Time** | Server-Sent Events (SSE) |

---

## 📦 Installation

### Prerequisites

- Node.js 18+ 
- npm/yarn/pnpm
- PostgreSQL database (recommend [Neon](https://neon.tech))
- Clerk account for auth
- Stripe account for billing
- OpenRouter API key for AI

### Setup

```bash
# Clone the repository
git clone https://github.com/QusaiSak/WebExtract.git
cd WebExtract/web-extract

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Configure your environment variables (see below)

# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

---

## ⚙️ Environment Variables

Create a `.env` file in the `web-extract` directory:

```env
# Database (Neon PostgreSQL)
DATABASE_URL="postgresql://user:password@host/db?sslmode=require"
# Optional: Direct URL for migrations (bypasses pgbouncer)
DIRECT_DATABASE_URL="postgresql://user:password@host/db?sslmode=require"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
API_SECRET=your-32-byte-hex-secret

# Encryption (for stored credentials)
ENCRYPTION_KEY=your-32-byte-hex-key

# AI Provider
OPENROUTER_API_KEY=sk-or-v1-...

# Stripe Billing
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_SMALL_PACK_PRICE_ID=price_...
STRIPE_MEDIUM_PACK_PRICE_ID=price_...
STRIPE_LARGE_PACK_PRICE_ID=price_...
```

---

## 🗄️ Data Model

### Key Tables

| Table | Purpose |
|-------|---------|
| `Workflow` | Stores workflow definition (nodes/edges JSON), status, unique per (userId, name) |
| `WorkflowExecution` | Runtime tracking for workflow runs |
| `ExecutionPhase` | Individual step results within an execution |
| `ExecutionLog` | Detailed logs per phase |
| `AiConversation` | Chat history with AI (JSON messages array) |
| `Credential` | Encrypted API keys/passwords for tasks |
| `UserBalance` | Available credits per user |
| `UserPurchase` | Stripe purchase audit trail |

---

## 🧩 Task Types

All available task types from the `TaskType` enum:

```typescript
// Browser Tasks
LAUNCH_BROWSER        // Entry point - opens browser to URL
PAGE_TO_HTML          // Serialize current DOM
NAVIGATE_URL          // Change page location

// Extraction Tasks  
EXTRACT_TEXT_FROM_ELEMENT  // CSS selector-based text extraction
EXTRACT_DATA_WITH_AI       // LLM-driven structured extraction
READ_PROPERTY_FROM_JSON    // Access nested JSON properties
ADD_PROPERTY_TO_JSON       // Enrich JSON data

// Interaction Tasks
FILL_INPUT            // Fill form fields
CLICK_ELEMENT         // Click buttons/links
WAIT_FOR_ELEMENT      // Wait for selector
SCROLL_TO_ELEMENT     // Scroll into view

// AI & Research Tasks
AI_RESEARCH_ASSISTANT // Search for relevant URLs
TRANSLATE_TEXT        // Multi-language translation
DETECT_LANGUAGE       // Identify text language
GENERATE_DOCUMENT     // Create reports/papers from data

// Export Tasks
EXPORT_TO_CSV         // CSV file generation
EXPORT_TO_POWERBI     // Power BI compatible export
EXPORT_TO_PDF         // PDF rendering
DELIVER_VIA_WEBHOOK   // POST results to external API
```

---

## 🔄 Real-Time Update Flow

1. **User makes change** (via AI chat or direct edit)
2. **PUT `/api/workflows`** persists updated definition
3. **Server broadcasts** `{ type: 'workflow.updated', payload }` to `/api/ws` SSE channel
4. **FlowEditor `EventSource`** receives event and applies updates instantly
5. **Canvas updates** with `fitView()` — no page reload needed

---

## 🧠 AI Parsing & Resilience

The `lib/workflow-ai.ts` module implements a multi-layer JSON extraction strategy:

1. **Pattern Detection**: Fenced ```json blocks, generic fences, explicit workflow objects
2. **Normalization**: Smart quotes → standard quotes, comment stripping, trailing comma removal
3. **Structural Balancing**: Brace/bracket depth tracking, quote balancing
4. **Repair Passes**: Insert missing property quotes, single → double quote conversion
5. **Reconstruction**: Extract balanced nodes/edges arrays even from broken text
6. **Fallback Synthesis**: URL-based minimal workflow guarantees non-empty result

---

## 💰 Credits & Billing

| Pack | Credits | Price |
|------|---------|-------|
| Small | 1,000 | $9.99 |
| Medium | 5,000 | $39.99 |
| Large | 10,000 | $69.99 |

Credit costs are defined per task in the `TaskRegistry`. Executions aggregate consumed credits by phase.

---

## 🚀 Deployment

### Production Checklist

- [ ] Use Node.js runtime for routes touching Prisma (not Edge)
- [ ] Set `sslmode=require` in DATABASE_URL for Neon
- [ ] Configure `DIRECT_DATABASE_URL` for migrations (bypasses pgbouncer)
- [ ] Set `NEXT_PUBLIC_APP_URL` to production origin
- [ ] Run `npx prisma migrate deploy` in CI before app start
- [ ] Configure Stripe webhook endpoint for `/api/stripe/webhook`

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

---

## 🧪 Development

```bash
# Run development server
npm run dev

# Type checking
npm run type-check

# Linting
npm run lint

# Database studio
npx prisma studio

# Generate Prisma client after schema changes
npx prisma generate

# Push schema changes to database
npx prisma db push
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/amazing-feature`)
3. Run lint and type checks (`npm run lint`)
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feat/amazing-feature`)
6. Open a Pull Request

### Guidelines

- Follow TypeScript strict mode
- Update README for new task types or APIs
- Add tests for critical paths
- Keep PRs focused and well-documented

---

## 🗺️ Roadmap

- [ ] Parallel branch execution & conditional nodes
- [ ] Browser extension for selector recording
- [ ] Scheduled/recurring executions with cron UI
- [ ] Role-based access & shared workflows
- [ ] Execution replay & diff viewer for AI changes
- [ ] Fine-grained pricing per task & AI model selection
- [ ] Webhook validation & retry policies
- [ ] Workflow templates marketplace

---

## 🔒 Security Considerations

- **URL/Selector Sanitization**: Always validate user-provided inputs before execution
- **Credential Encryption**: Sensitive values encrypted at rest using `ENCRYPTION_KEY`
- **Puppeteer Limits**: Configure navigation timeouts and resource usage limits
- **Webhook Validation**: Consider allowlists or signature verification for production

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| `PrismaClientInitializationError` | Check DATABASE_URL, ensure `sslmode=require`, verify Neon project is active, avoid Edge runtime |
| Workflow not updating live | Check SSE connection in Network tab, verify broadcast POST returns 200 |
| AI returns empty workflow | Check parser fallback logs, ensure AI provider returns fenced JSON |
| Duplicate workflow name error | Unique constraint on (userId, name) — rename or update existing workflow |
| `Cannot read 'bind'` on upgrade | WebSocket not supported in Next.js dev; use SSE instead |

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React framework
- [ReactFlow](https://reactflow.dev/) - Graph visualization
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [Clerk](https://clerk.com/) - Authentication
- [Prisma](https://prisma.io/) - Database ORM
- [Neon](https://neon.tech/) - Serverless Postgres
- [OpenRouter](https://openrouter.ai/) - AI API gateway
- [Puppeteer](https://pptr.dev/) - Browser automation

---

<div align="center">

**Built with ❤️ by [QusaiSak](https://github.com/QusaiSak)**

[Report Bug](https://github.com/QusaiSak/WebExtract/issues) · [Request Feature](https://github.com/QusaiSak/WebExtract/issues)

</div>