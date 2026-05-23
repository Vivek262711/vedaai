# VedaAI – AI Assessment Creator

VedaAI is a full-stack, enterprise-grade AI-powered assessment generation platform designed for educators to easily create structured, customizable question papers. Leveraging queue-based processing and real-time WebSocket communication, VedaAI delivers a responsive, reliable generation experience even under varying server loads.

---

## Features

- **Dynamic Assignment Planner:** Interactive forms allowing configuration of question formats (MCQs, Short Answer, True/False) and automatic balancing of difficulty distribution.
- **Robust Queue-Based Workloads:** Offloads intensive AI generations to BullMQ background workers backed by Redis, ensuring reliability and zero HTTP request timeouts.
- **Real-Time Progress Tracking:** Instant UI updates via WebSockets (Socket.IO) indicating generation progress percentages (e.g., plan, generate, structure, finalize).
- **Responsive Exam-Paper Rendering:** A beautiful, responsive student-view layout showing structured sections, difficulty badges, mark allocations, and MCQ grids.
- **High-Fidelity PDF Export:** Headless-browser print engine that exports generated assessments to print-ready A4 PDF documents.

---

## Tech Stack

### Frontend
- **Framework:** Next.js (App Router, TypeScript)
- **State Management:** Zustand (with draft persistence to localStorage)
- **Styles:** Tailwind CSS, Radix UI (shadcn/ui primitives)
- **Server State:** TanStack React Query (v5)
- **Real-Time Client:** Socket.IO Client

### Backend
- **Framework:** Node.js, Express (TypeScript)
- **Database:** MongoDB (Mongoose ODM)
- **Message Queue & Cache:** Redis (IORedis), BullMQ
- **Real-Time Server:** Socket.IO
- **PDF Engine:** Puppeteer (Headless Chrome)

### AI & Prompt Engineering
- **Engine:** Google Gemini API (gemini-1.5-flash) with Ollama fallback
- **Validation:** Zod schemas for structured JSON outputs
- **Reliability:** Built-in JSON regex cleaner and repair fallback mechanisms

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         Next.js UI                          │
│        Zustand Client State + React Query + Socket.IO       │
└─────────────────┬───────────────────────┬───────────────────┘
                  │ API Request           │ WebSocket Update
                  ▼                       ▼
┌─────────────────────────────────────────────────────────────┐
│                       Express Backend                       │
│        CORS / Rate Limit / Zod Schema Validation            │
├─────────────────┬───────────────────────┬───────────────────┤
│    Database     │      Job Queue        │    Sockets Room   │
│   MongoDB Atlas │     Redis / BullMQ    │     Socket.IO     │
└────────┬────────┴───────────┬───────────┴─────────▲─────────┘
         │ Writes Metadata    │ Enqueues Job        │ Progress Updates
         ▼                    ▼                     │
┌─────────────────────────────┴─────────────────────┴─────────┐
│                     BullMQ Background Worker                │
│       Gemini AI Generation ➔ MongoDB Save ➔ PDF Render      │
└─────────────────────────────────────────────────────────────┘
```

---

## System Flow

### 1. Frontend Flow
- **Form Configuration:** The teacher fills out the assessment setup form (validated via React Hook Form and Zod).
- **Draft Persistence:** Unsubmitted configurations are saved locally via Zustand.
- **Real-Time Progress:** Upon submission, the UI routes to `/assignments/[id]` and connects to Socket.IO, displaying progress percentages emitted by the backend worker.
- **Output:** Once finished, the UI routes to `/results/[id]`, displaying the formatted exam paper.

### 2. Backend Flow
- **API Request:** The API route receives the generation trigger and creates a `QueueJobMeta` tracking document in MongoDB.
- **Queueing:** The controller enqueues an asynchronous generation job onto the BullMQ `assessment` queue in Redis.
- **Worker Execution:** The BullMQ background worker retrieves the job, sets up room-based WebSocket updates, and initializes prompt generation.
- **AI Processing:** Worker queries the AI service to build questions, validates the structure against Zod models, saves the parsed `GeneratedPaper` to MongoDB, and triggers Puppeteer for PDF pre-rendering.
- **Broadcast:** The worker broadcasts a "completed" event via Socket.IO, instructing the frontend to resolve page redirection.

### 3. AI Flow
- **Prompt Engineering:** Formulates highly structured system instructions dictating question formats, difficulty distributions, and JSON schema boundaries.
- **Structured JSON Parsing:** Enforces JSON responses, and utilizes regular expressions and repair functions to resolve trailing commas or markdown backtick enclosures before validation.
- **Tagging:** Categorizes sections and labels questions with difficulty tags (Easy/Medium/Hard) and marks allocation.

---

## Folder Structure

```
apps/
  web/                  # Next.js Frontend Application
    src/
      app/              # App Router Pages
      components/       # UI Primitives & Layout wrappers
      hooks/            # React Query & WebSocket connection hooks
      services/         # Axios API client & socket bindings
      store/            # Zustand global stores
  server/               # Express Backend API
    src/
      config/           # Environment, DB, Redis & Logger configs
      controllers/      # Request handlers & Queue triggers
      middleware/       # CORS, Error handling, Rate limiting, Uploads
      models/           # Mongoose Schemas (Assignment, Paper)
      queues/           # BullMQ queues & workers
      services/         # Gemini API, Prompt builder & Puppeteer PDF services
packages/
  shared/               # Shared Types and Utilities
    src/
      types/            # Common TypeScript interfaces & enums
```

---

## Installation & Setup

### Prerequisites
- Node.js >= 20.x
- pnpm >= 9.x
- Docker (for local Redis/MongoDB instances)

### 1. Clone the Repository & Install Dependencies
```bash
git clone https://github.com/vivekkumarprasad271104/vedaai.git
cd vedaai
pnpm install
```

### 2. Run Local Infrastructure Services
```bash
docker-compose up -d
```
This launches a local MongoDB, Redis, and a Redis Commander console UI.

### 3. Configure Environment Files
Follow the examples below to create your local configurations.

---

## Environment Variables

### Backend (`apps/server/.env`)
Create a `.env` file in `apps/server/`:
```env
PORT=4000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/vedaai
REDIS_URL=redis://localhost:6379
GEMINI_API_KEY=your_gemini_api_key_here
CORS_ORIGIN=http://localhost:3000
```

### Frontend (`apps/web/.env.local`)
Create a `.env.local` file in `apps/web/`:
```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_WS_URL=http://localhost:4000
```

---

## Running Locally

To run the entire workspace concurrently (Frontend + Backend + Shared dependencies):
```bash
pnpm dev
```
- **Frontend Dashboard:** `http://localhost:3000`
- **Backend API Server:** `http://localhost:4000`
- **Redis Commander UI:** `http://localhost:8081`

---

## Queue & WebSocket Flow

```
   [ Teacher Submit ]
           │
           ▼
[ Express API Route ] ──► (Create Job Meta in Mongo)
           │
           ▼
 [ Enqueue on BullMQ ] ──► (Job placed in Redis queue)
           │
           ▼
 [ Background Worker ] ──► (Worker picks up task)
           │
           ├──► [ Prog: 10% ]  ──► Emit WebSocket ──► [ Frontend: Setup ]
           ├──► [ Prog: 30% ]  ──► Emit WebSocket ──► [ Frontend: Query LLM ]
           ├──► [ Prog: 70% ]  ──► Emit WebSocket ──► [ Frontend: Save MDB ]
           └──► [ Prog: 100% ] ──► Emit WebSocket ──► [ Frontend: Completed ]
```

---

## AI Generation Flow

1. **Prompt Assembly:** Backend constructs system instructions utilizing user parameters (topic, sections count, difficulty metrics).
2. **LLM Query:** Sends a request to Google Gemini API requesting strict JSON conforming to Zod schemas.
3. **Response Repair:** In case of failure or malformed text blocks, the response passes through a regex repair utility to strip markdown wrappers and fix object structure issues.
4. **Zod Validation:** The response JSON is validated against strict model structures; fallback LLMs are queried automatically if validation fails.
5. **Storage:** Upon successful validation, the assessment structure is written to MongoDB.

---

## Deployment Instructions

### Frontend (Vercel)
The client application is built to deploy seamlessly on Vercel:
1. Connect your repository to Vercel.
2. Set the **Root Directory** settings under project configuration to `apps/web`.
3. Select **Next.js** as the framework preset.
4. Configure production environment variables: `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_WS_URL` targeting your deployed backend.

### Backend (Render / Railway)
The backend containerizes easily and can run on any platform supporting Node.js or Docker:
1. Link your repository to Render or Railway.
2. Use the provided Dockerfile in `apps/server/Dockerfile` or configure the build directory to root with build command: `pnpm install` and start command: `pnpm --filter @vedaai/server start`.
3. Provide environment credentials (`MONGO_URI`, `REDIS_URL`, `GEMINI_API_KEY`).

---

## Future Improvements

- **Interactive Question Regenerator:** Allow instructors to select individual questions to regenerate or modify manually on-the-fly.
- **Collaborative Workspaces:** Real-time multi-instructor editing of assessment rubrics and question templates.
- **Extended PDF Layout Options:** Choice of typography, headers, page layouts, and formatting presets before export.

---

## License

Distributed under the MIT License. See `LICENSE` for more information.
