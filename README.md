# 🧠 VedaAI – AI Assessment Creator

> Create professional AI-powered question papers and assessments in seconds. Built for educators.

![Stack](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
![Stack](https://img.shields.io/badge/Express-4-green?logo=express)
![Stack](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Stack](https://img.shields.io/badge/MongoDB-7-green?logo=mongodb)
![Stack](https://img.shields.io/badge/Redis-7-red?logo=redis)
![Stack](https://img.shields.io/badge/BullMQ-5-purple)
![Stack](https://img.shields.io/badge/Socket.IO-4-black?logo=socketdotio)

---

## 📋 Table of Contents

- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Setup Instructions](#setup-instructions)
- [Environment Variables](#environment-variables)
- [Queue Flow](#queue-flow)
- [WebSocket Flow](#websocket-flow)
- [PDF Generation](#pdf-generation)
- [API Reference](#api-reference)
- [Project Structure](#project-structure)
- [Deployment](#deployment)
- [Future Improvements](#future-improvements)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                            │
│              Next.js 15 + TailwindCSS + Zustand             │
│         React Hook Form + Zod + Socket.IO Client            │
└─────────────────┬───────────────────────┬───────────────────┘
                  │ REST API              │ WebSocket
                  ▼                       ▼
┌─────────────────────────────────────────────────────────────┐
│                         Backend                             │
│              Express + TypeScript + Socket.IO               │
├─────────────┬─────────────┬──────────────┬──────────────────┤
│  Controllers│   Routes    │  Middleware   │   Validators     │
├─────────────┴─────────────┴──────────────┴──────────────────┤
│                      Services Layer                         │
│         AI Service │ PDF Service │ Prompt Service            │
├─────────────────────────────────────────────────────────────┤
│                      Queue Layer                            │
│              BullMQ Queue + Assessment Worker               │
├──────────────────┬──────────────────────────────────────────┤
│     MongoDB      │              Redis                       │
│  (Assignments,   │  (Queue state, job tracking,             │
│   Papers, Jobs)  │   caching)                               │
└──────────────────┴──────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| Next.js 15 (App Router) | React framework with SSR |
| TypeScript | Type safety |
| TailwindCSS | Utility-first CSS |
| shadcn/ui (Radix) | Accessible UI primitives |
| Zustand | State management with persistence |
| React Hook Form + Zod | Form validation |
| TanStack Query | Server state management |
| Socket.IO Client | Real-time updates |
| Framer Motion | Animations |
| Sonner | Toast notifications |

### Backend
| Technology | Purpose |
|---|---|
| Express | HTTP server |
| TypeScript | Type safety |
| MongoDB + Mongoose | Document database |
| Redis + IORedis | Caching & queue backend |
| BullMQ | Job queue with retries |
| Socket.IO | Real-time WebSocket events |
| Puppeteer | PDF generation |
| OpenAI SDK | AI question generation |
| Winston | Structured logging |
| Zod | Request validation |
| Helmet + CORS | Security |

---

## 🚀 Setup Instructions

### Prerequisites

- Node.js >= 20
- pnpm >= 9
- Docker & Docker Compose (for MongoDB + Redis)

### 1. Clone & Install

```bash
git clone <repo-url> vedaai
cd vedaai
pnpm install
```

### 2. Start Infrastructure

```bash
docker-compose up -d
```

This starts:
- MongoDB on `localhost:27017`
- Redis on `localhost:6379`
- Redis Commander UI on `localhost:8081`

### 3. Configure Environment

```bash
# Backend
cp apps/server/.env.example apps/server/.env
# Edit apps/server/.env and add your OPENAI_API_KEY

# Frontend
cp apps/web/.env.local.example apps/web/.env.local
```

### 4. Run Development

```bash
# Run everything (frontend + backend) via Turbo
pnpm dev

# Or individually:
cd apps/server && pnpm dev    # Backend on :4000
cd apps/web && pnpm dev       # Frontend on :3000
```

### 5. Verify

- Frontend: http://localhost:3000
- Backend Health: http://localhost:4000/api/health
- Redis Commander: http://localhost:8081

---

## 🔐 Environment Variables

### Backend (`apps/server/.env`)

| Variable | Description | Default |
|---|---|---|
| `PORT` | Server port | `4000` |
| `NODE_ENV` | Environment | `development` |
| `CORS_ORIGIN` | Allowed CORS origin | `http://localhost:3000` |
| `MONGO_URI` | MongoDB connection string | Required |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `OPENAI_API_KEY` | OpenAI API key | Required |
| `AI_PROVIDER` | AI provider (`openai`/`claude`) | `openai` |
| `AI_MODEL` | Model name | `gpt-4o` |
| `QUEUE_CONCURRENCY` | Worker concurrency | `3` |
| `JOB_TIMEOUT` | Job timeout (ms) | `120000` |
| `JOB_MAX_RETRIES` | Max retry attempts | `3` |
| `PDF_STORAGE_PATH` | PDF file storage path | `./storage/pdfs` |

### Frontend (`apps/web/.env.local`)

| Variable | Description | Default |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:4000/api` |
| `NEXT_PUBLIC_WS_URL` | WebSocket URL | `http://localhost:4000` |

---

## 🔄 Queue Flow

```
1. POST /api/assignments          → Create assignment in MongoDB
2. POST /api/assignments/:id/generate → Validate + create BullMQ job
3. BullMQ enqueues job            → Redis stores job state
4. Worker picks up job            → Emits "processing" via Socket.IO
5. Worker calls OpenAI API        → AI generates structured JSON
6. Worker validates with Zod      → Strict schema enforcement
7. Worker saves to MongoDB        → GeneratedPaper document
8. Worker emits "completed"       → Socket.IO broadcasts to room
9. Frontend auto-updates          → React Query invalidation
10. User sees generated paper     → Professional exam-paper UI
```

**Retry Logic:**
- 3 attempts with exponential backoff (2s, 4s, 8s)
- Failed jobs retained for 7 days
- Completed jobs retained for 24 hours

---

## 📡 WebSocket Flow

### Events

| Event | Direction | Description |
|---|---|---|
| `join:room` | Client → Server | Join assignment-specific room |
| `leave:room` | Client → Server | Leave assignment room |
| `job:queued` | Server → Client | Job added to queue |
| `job:processing` | Server → Client | Worker started processing |
| `job:progress` | Server → Client | Progress update (0-100%) |
| `job:completed` | Server → Client | Generation complete |
| `job:failed` | Server → Client | Generation failed |

### Client Usage

```typescript
// Join room for real-time updates
useAssignmentSocket(assignmentId);

// Access job state from Zustand store
const jobState = useSocketStore(s => s.jobStates[assignmentId]);
```

---

## 📄 PDF Generation

- **Engine:** Puppeteer (headless Chromium)
- **Template:** Professional exam-paper HTML with proper typography
- **Features:**
  - Student info section (Name, Roll No, Section)
  - Numbered questions with marks
  - MCQ options grid
  - Difficulty badges
  - Proper A4 pagination
  - Section separators
- **Storage:** Generated PDFs saved to `storage/pdfs/`

---

## 📚 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/assignments` | Create assignment (multipart) |
| `GET` | `/api/assignments` | List assignments (paginated) |
| `GET` | `/api/assignments/:id` | Get assignment by ID |
| `POST` | `/api/assignments/:id/generate` | Start AI generation |
| `GET` | `/api/results/:id` | Get generated paper |
| `GET` | `/api/results/:id/pdf` | Download PDF |
| `GET` | `/api/results/assignment/:id` | Get paper by assignment |
| `POST` | `/api/results/:id/regenerate` | Regenerate paper |

---

## 📁 Project Structure

```
vedaai/
├── apps/
│   ├── web/                          # Next.js 15 Frontend
│   │   ├── src/
│   │   │   ├── app/                  # App Router pages
│   │   │   │   ├── (app)/           # Dashboard layout group
│   │   │   │   │   ├── dashboard/   # Dashboard page
│   │   │   │   │   ├── assignments/ # Assignment pages
│   │   │   │   │   └── results/     # Result pages
│   │   │   │   ├── layout.tsx       # Root layout
│   │   │   │   ├── providers.tsx    # React Query + Toaster
│   │   │   │   └── globals.css      # Theme + utilities
│   │   │   ├── components/
│   │   │   │   ├── ui/             # shadcn/ui components
│   │   │   │   ├── layout/         # Sidebar, Header, AppShell
│   │   │   │   └── shared/         # EmptyState, StatusBadge
│   │   │   ├── modules/
│   │   │   │   └── assignments/    # AssignmentForm
│   │   │   ├── store/              # Zustand stores
│   │   │   ├── hooks/              # React Query + Socket hooks
│   │   │   ├── services/           # API + Socket.IO clients
│   │   │   ├── lib/                # Utilities (cn)
│   │   │   └── types/              # Shared type re-exports
│   │   ├── tailwind.config.ts
│   │   ├── next.config.ts
│   │   └── components.json         # shadcn config
│   │
│   └── server/                       # Express Backend
│       ├── src/
│       │   ├── config/              # env, database, redis, logger
│       │   ├── controllers/         # Request handlers
│       │   ├── routes/              # Express routes
│       │   ├── models/              # Mongoose schemas
│       │   ├── middleware/          # Error, auth, validate, upload
│       │   ├── validators/          # Zod schemas
│       │   ├── services/            # AI, PDF, Prompt
│       │   ├── queues/              # BullMQ queue + connection
│       │   ├── workers/             # Assessment worker
│       │   ├── socket/              # Socket.IO setup
│       │   ├── utils/               # ApiError, ApiResponse
│       │   ├── app.ts               # Express app factory
│       │   └── index.ts             # Bootstrap entry
│       ├── storage/                 # Uploads + PDFs
│       └── Dockerfile
│
├── packages/
│   └── shared/                       # Shared TypeScript types
│       └── src/types/               # Assignment, API, Socket types
│
├── docker-compose.yml               # MongoDB + Redis
├── turbo.json                       # Turborepo config
├── pnpm-workspace.yaml
└── package.json
```

---

## 🚢 Deployment

### Frontend → Vercel

1. Connect repo to Vercel
2. Set root directory to `apps/web`
3. Framework: Next.js
4. Add environment variables:
   - `NEXT_PUBLIC_API_URL` = your backend URL + `/api`
   - `NEXT_PUBLIC_WS_URL` = your backend URL

### Backend → Render / Railway

1. Use `apps/server/Dockerfile` or `render.yaml`
2. Add environment variables (see table above)
3. Ensure MongoDB Atlas + Redis Cloud are provisioned

### Database → MongoDB Atlas

1. Create free M0 cluster
2. Get connection string
3. Set as `MONGO_URI`

### Cache → Redis Cloud

1. Create free Redis instance
2. Get connection URL
3. Set as `REDIS_URL`

---

## 🔮 Future Improvements

- [ ] **Authentication** – JWT-based teacher/admin auth
- [ ] **Answer Keys** – Separate answer key generation
- [ ] **Bulk Export** – Export multiple papers at once
- [ ] **Template Library** – Save and reuse exam templates
- [ ] **Analytics** – Track question difficulty and usage
- [ ] **Multi-language** – Support non-English assessments
- [ ] **Collaborative Editing** – Multiple teachers on one paper
- [ ] **Custom Branding** – School logo and header in PDFs
- [ ] **Question Bank** – Store and reuse generated questions
- [ ] **Claude/Gemini Support** – Multi-provider AI backends

---

## 📝 License

MIT

---

Built with ❤️ by VedaAI
