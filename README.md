<p align="center">
  <img src="https://img.shields.io/badge/SpaceFlow-Smart%20Workspace%20Platform-0d9488?style=for-the-badge" alt="SpaceFlow" />
  <a href="https://spaceflow-v1.vercel.app/"><img src="https://img.shields.io/badge/Live%20Demo-https%3A%2F%2Fspaceflow--v1.vercel.app-22c55e?style=for-the-badge" alt="Live Demo" /></a>
</p>

<h1 align="center">SpaceFlow</h1>
<p align="center">
  <strong>Know what's booked vs what's used — and act on it.</strong>
</p>
<p align="center">
  AI-powered workspace management for SMBs and coworking operators. No sensors required.
</p>
<p align="center">
  <strong>→ <a href="https://spaceflow-v1.vercel.app/">Live Demo</a></strong>
</p>

---

## Why SpaceFlow?

**30% of meeting rooms are booked but empty.** Ghost bookings waste space, frustrate teams, and cost money. SpaceFlow surfaces this automatically — showing you what's booked, what's actually used, and giving you **actionable AI recommendations** to optimize your workplace. Always advisory, never automatic.

| Problem | SpaceFlow |
|---------|-----------|
| Spreadsheets & guesswork | Real-time dashboards with utilization, patterns, and no-show tracking |
| "Who booked this?" | One-click booking, instant confirmations, QR check-in |
| Empty rooms, full calendars | Ghost booking detection: planned vs actual occupancy |
| Manual optimization | AI recommendations (Gemini/GPT) with confidence scores & explainability |
| Expensive sensors | Manual check-in/out — works out of the box |

---

## Features

### Core Experience
- **Space booking** — Desks, meeting rooms, phone booths, collaboration areas. Conflict detection, real-time availability.
- **Check-in / Check-out** — QR code per booking, occupancy tracking. Check-in window: 15 min before → 60 min after start.
- **My Bookings** — View, cancel, reschedule. Stored cancellation reasons for analytics.
- **Smart AI booking** — Natural language: *"Book me a meeting room tomorrow at 2pm"* → AI suggests spaces and times.

### Analytics (Admin & Facilities Manager)
- **Utilization** — Planned vs actual occupancy. Ghost booking detection.
- **Booking Usage** — Booked vs used vs no-shows. Time-range filters.
- **Patterns** — Peak hours, peak days, by space type.
- **Segments** — By floor, building, space type.
- **All Bookings** — Full booking list with filters, export.

### AI Recommendations
- **Gemini 2.5 Flash** or **OpenAI GPT-4o** — Fallback chain: Gemini → OpenAI → rule-based.
- **Full explainability** — Confidence score, data sources, explanation, impact, suggested action.
- **Responsible AI** — Human-in-the-loop, advisory only, no auto-writes.
- **Focus areas** — Utilization, comfort, cost, sustainability.

### AI Chat Widget
- **Role-specific prompts** — Admin: platform health, audit highlights. FM: utilization, no-shows, peak hours. Employee: book space, check-in help.
- **Natural language** — Ask questions, get summaries, trigger bookings.
- **Floating widget** — Available to all authenticated users in the dashboard.

### Admin
- **User management** — Create, edit role, activate/deactivate.
- **Space management** — CRUD for spaces (type, floor, building, capacity).
- **Platform config** — Booking rules, workday settings.
- **Audit log** — All API calls, paginated, filterable.

### Auth & Security
- **JWT** — Access tokens (15 min) + refresh tokens (7 days), rotation on refresh.
- **httpOnly cookies** — SameSite, Secure in production.
- **bcrypt** — Cost 12 password hashing.
- **Rate limiting** — Login: 5/15 min, Signup: 3/hour.
- **Zod validation** — All inputs validated.

### Frontend
- **Framer Motion** — Page transitions, stagger, scroll reveal, container scroll animation.
- **shadcn/ui** — 50+ Radix-based components, Tailwind CSS.
- **Dark/light mode** — Toggle with persistence.
- **Role-based navigation** — Sidebar adapts to Admin, FM, Employee.
- **Skeleton loaders** — Shimmer animation for loading states.
- **Responsive** — Mobile-first, collapsible sidebar.

---

## Architecture

### High-Level Overview

```mermaid
flowchart TB
    subgraph Demo["🌐 Live Demo"]
        URL["https://spaceflow-v1.vercel.app/"]
    end

    subgraph Frontend["Frontend (Vite + React)"]
        F1["Vercel · Port 8080 (dev)"]
        F2["TypeScript · Tailwind · shadcn · Framer Motion"]
        F3["Public: Index, Login, Signup, Pricing"]
        F4["Dashboard: Admin, FM, Employee"]
    end

    subgraph Backend["Backend (Node.js + Express)"]
        B1["Port 4000 · Prisma ORM · JWT · Audit · Rate Limit"]
        B2["/api/auth, spaces, bookings, occupancy"]
        B3["/api/analytics, recommendations, ai, admin"]
    end

    subgraph Data["Data & AI"]
        DB[(PostgreSQL<br/>Docker / Supabase<br/>Port 5432)]
        AI["AI (optional)<br/>Gemini 2.5 Flash → OpenAI GPT-4o<br/>Rule-based fallback"]
    end

    Demo --> Frontend
    Frontend -->|"REST API · credentials: include · CORS"| Backend
    Backend --> DB
    Backend --> AI
```

### Deployment Flow

```mermaid
flowchart LR
    subgraph Client
        Browser["Browser (Client)"]
    end

    subgraph Hosting
        Vercel["Vercel (Frontend)"]
        API["Backend (API)"]
    end

    subgraph Storage
        PG[(PostgreSQL)]
    end

    subgraph External
        LLM["Gemini / OpenAI"]
    end

    Browser -->|"HTTPS"| Vercel
    Vercel -->|"REST · JWT in httpOnly cookies"| API
    API --> PG
    API --> LLM
```

### Request Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant DB as PostgreSQL
    participant AI as Gemini/OpenAI

    U->>F: Login / Signup
    F->>B: POST /api/auth/login
    B->>DB: Validate credentials
    B-->>F: JWT (httpOnly cookie)
    F-->>U: Authenticated

    U->>F: API request (e.g. book space)
    F->>B: Request + credentials: include
    B->>B: Validate JWT
    B->>DB: Read/Write
    B-->>F: Response
    F-->>U: Updated UI

    U->>F: AI request (recommendations, chat)
    F->>B: POST /api/ai/*
    B->>AI: LLM call
    AI-->>B: Response
    B->>DB: Log / persist
    B-->>F: AI response
    F-->>U: Result
```

### Request Flow (Summary)

1. **Authentication** — Login/Signup → JWT issued, stored in httpOnly cookie.
2. **API calls** — Frontend sends `credentials: include`; backend validates JWT.
3. **AI features** — Recommendations, chat, smart booking → backend calls Gemini/OpenAI.
4. **Audit** — All API calls logged with user, timestamp, action.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Vite, React 18, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion, TanStack Query, React Router |
| **Backend** | Node.js, Express, Prisma ORM |
| **Database** | PostgreSQL 16 |
| **AI** | Google Gemini 2.5 Flash (primary), OpenAI GPT-4o (fallback) |
| **Auth** | JWT, bcrypt, httpOnly cookies |

---

## Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- (Optional) Gemini or OpenAI API key for AI features

### 1. Clone & install

```bash
git clone <repo-url>
cd spaceflow_v1
npm install
```

### 2. Start the database

```bash
docker compose up -d
```

### 3. Backend setup

```bash
cd server
cp .env.example .env   # Edit with your secrets
npm install
npm run db:migrate     # Run migrations
npm run db:seed        # Seed admin + sample spaces
npm run dev            # Starts on http://localhost:4000
```

### 4. Frontend

```bash
# From project root
npm run dev            # Starts on http://localhost:8080
```

### 5. Default admin login
- **Email:** `admin@spaceflow.local`
- **Password:** `Admin@SpaceFlow1!`

*(Override in `server/.env` via `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD`)*

---

## Environment Variables

### Frontend (`.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base URL | `http://localhost:4000` |

### Backend (`server/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://spaceflow:spaceflow@localhost:5432/spaceflow` |
| `JWT_SECRET` | Access token signing secret | *(required)* |
| `JWT_REFRESH_SECRET` | Refresh token signing secret | *(required)* |
| `PORT` | API server port | `4000` |
| `FRONTEND_URL` | CORS origin | `http://localhost:8080` |
| `GEMINI_API_KEY` | Google AI API key | *(optional)* |
| `GEMINI_MODEL` | Gemini model name | `gemini-2.5-flash` |
| `OPENAI_API_KEY` | OpenAI API key (fallback) | *(optional)* |
| `OPENAI_MODEL` | OpenAI model name | `gpt-4o` |
| `SEED_ADMIN_EMAIL` | Seed admin email | `admin@spaceflow.local` |
| `SEED_ADMIN_PASSWORD` | Seed admin password | `Admin@SpaceFlow1!` |

**Without AI keys:** SpaceFlow uses rule-based recommendations automatically. No AI required to run.

---

## Project Structure

```
spaceflow_v1/
├── src/                          # Frontend (Vite + React)
│   ├── components/
│   │   ├── ui/                   # shadcn components (50+)
│   │   │   ├── container-scroll-animation.tsx
│   │   │   ├── glassmorphism-hero.tsx
│   │   │   ├── mock-dashboard.tsx   # Landing page dashboard mock
│   │   │   ├── testimonial-cards.tsx
│   │   │   └── ...
│   │   ├── AIChatWidget.tsx      # Floating AI assistant
│   │   ├── DashboardLayout.tsx
│   │   ├── PublicNav.tsx
│   │   └── ...
│   ├── contexts/                 # AuthContext
│   ├── hooks/
│   ├── lib/                      # api.ts, utils
│   ├── pages/                    # Route components
│   └── App.tsx
├── server/
│   ├── prisma/
│   │   └── schema.prisma         # User, Space, Booking, OccupancyRecord, etc.
│   └── src/
│       ├── routes/               # auth, spaces, bookings, occupancy, analytics, admin, recommendations, ai
│       ├── middleware/          # auth, audit, errorHandler
│       └── lib/                  # prisma, jwt, aiClient, seed
├── docker-compose.yml            # PostgreSQL
└── package.json
```

---

## Roles & Permissions

| Role | Capabilities |
|------|--------------|
| **Admin** | All features + user management, space CRUD, platform config, audit log |
| **Facilities Manager** | Analytics, utilization, recommendations, booking management, spaces |
| **Employee** | Book spaces, My Bookings, check-in/out |

---

## API Overview

| Prefix | Description |
|--------|-------------|
| `POST /api/auth/login` | Login (email, password) |
| `POST /api/auth/signup` | Register |
| `POST /api/auth/refresh` | Refresh access token |
| `POST /api/auth/logout` | Logout |
| `GET /api/spaces` | List spaces (with filters) |
| `GET /api/spaces/:id` | Space details |
| `GET /api/bookings` | List bookings (user or all) |
| `POST /api/bookings` | Create booking |
| `PATCH /api/bookings/:id` | Update/cancel booking |
| `POST /api/occupancy/check-in` | Check in to booking |
| `POST /api/occupancy/check-out` | Check out |
| `GET /api/analytics/*` | Utilization, patterns, segments |
| `GET /api/recommendations` | AI or rule-based recommendations |
| `POST /api/ai/smart-booking` | Natural language → booking intent |
| `POST /api/ai/chat` | AI chat completion |
| `GET /api/admin/*` | User CRUD, config, audit |

---

## Scripts

### Frontend
| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (port 8080) |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run test` | Run Vitest |
| `npm run lint` | ESLint |

### Backend
| Command | Description |
|---------|-------------|
| `npm run dev` | Start API (port 4000) |
| `npm run build` | Compile TypeScript |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:seed` | Seed admin + sample data |
| `npm run db:studio` | Open Prisma Studio |

---

## Deployment

1. **Database:** Provision PostgreSQL (e.g. Supabase, Railway, Neon).
2. **Backend:** Set env vars, run migrations, deploy to Node host (Railway, Render, Fly.io).
3. **Frontend:** Build with `npm run build`, serve `dist/` via static host (Vercel, Netlify, Cloudflare Pages).
4. **CORS:** Set `FRONTEND_URL` to your frontend origin.
5. **Cookies:** Use HTTPS in production for Secure cookies.

---

## Roadmap — Future AI Additions

SpaceFlow is built to evolve. Every new AI feature follows the same principles: **advisory, explainable, human-in-the-loop**. Below are planned additions, prioritized by impact and feasibility.

### High Impact

| Feature | USP | Example | Implementation |
|---------|-----|---------|----------------|
| **Natural Language Analytics** | Ask in plain English, get charts and tables — no dashboards to learn. | *"Show utilization for Building A last month"* → structured data + AI summary | `POST /api/ai/analytics-query` — maps NL to existing analytics APIs |
| **Smart Rescheduling** | One click to see the best alternatives. AI ranks by preference, availability, and past behavior. | User clicks "Reschedule" → 3–5 slots with explanations (*"Similar time, same floor"*) | `POST /api/ai/reschedule-suggestions` — bookingId + user history → ranked suggestions |
| **Natural Language Reports** | Turn data into executive-ready summaries. No analyst needed. | *"Generate a monthly utilization report for leadership"* → PDF or markdown | `POST /api/ai/generate-report` — report type → full analytics → AI-written summary |

### Medium Impact

| Feature | USP | Example | Implementation |
|---------|-----|---------|----------------|
| **Personalized Dashboard Insights** | Proactive tips that match how you work. | *"You usually book in the morning. Conference Room 2 is often free 9–10am."* | `GET /api/ai/dashboard-insights` — user history + availability → 1–2 insight strings |
| **Audit Log Summaries** | Admins see what matters in seconds, not scrolls. | *"Last 7 days: 12 failed logins, 3 new users, 45 bookings. Unusual: User X made 8 calls in 2 min."* | `GET /api/ai/audit-summary` — days → paginated logs → summary + anomaly flags |
| **Anomaly Detection** | Catch issues before they become problems. | *"User X booked 15 spaces in one day"*, *"Space Y has 0 check-ins but 20 bookings"* | `GET /api/ai/anomalies` or extend Recommendations with "Anomalies" tab |
| **Proactive No-Show Reminders** | Reduce ghost bookings by nudging users to release unused slots. | 15 min after start, no check-in → *"Release this slot so others can use it?"* | Background job: score no-show likelihood → in-app notification |
| **AI-Powered Onboarding** | Role-specific walkthroughs that get users productive faster. | *"As an Employee, you can book spaces and check in. Try booking a meeting room for tomorrow."* | `GET /api/ai/onboarding-tips` — role → tips; integrate with Onboarding flow |

### Quick Wins (Low Effort, High UX)

| Feature | USP | Example | Implementation |
|---------|-----|---------|----------------|
| **Cancellation Reason Autocomplete** | Less typing, better data. Suggestions based on what others chose. | Focus textarea → *"Meeting moved"*, *"Double-booked"*, *"Meeting cancelled"* | `GET /api/ai/cancellation-suggestions` — cluster existing reasons or AI from sample; cache 1h |
| **Space Name Suggestion** | Consistent naming without manual rules. | Type=MEETING_ROOM, floor=2, building=North → *"North 2 Meeting Room A"* | `POST /api/ai/space-name-suggestion` or inline in space creation form |

---

## License

Proprietary. All rights reserved.

---

<p align="center">
  <sub>Built for teams who want to see their space clearly.</sub>
</p>
