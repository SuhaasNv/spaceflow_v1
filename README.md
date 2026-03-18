<p align="center">
  <img src="https://img.shields.io/badge/SpaceFlow-Smart%20Workspace%20Platform-0d9488?style=for-the-badge" alt="SpaceFlow" />
</p>

<h1 align="center">SpaceFlow</h1>
<p align="center">
  <strong>Know what's booked vs what's used — and act on it.</strong>
</p>
<p align="center">
  AI-powered workspace management for SMBs and coworking operators. No sensors required.
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

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Vite + React)                   │
│  Port 8080  │  TypeScript  │  Tailwind  │  shadcn  │  Framer   │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    │ REST API (credentials: include)
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                     BACKEND (Node.js + Express)                   │
│  Port 4000  │  Prisma ORM  │  JWT Auth  │  Audit  │  Rate Limit │
└─────────────────────────────────────────────────────────────────┘
                    │                           │
                    ▼                           ▼
┌──────────────────────────┐    ┌──────────────────────────────────┐
│   PostgreSQL (Docker)    │    │   AI (optional)                   │
│   Port 5432              │    │   Gemini 2.5 Flash → OpenAI GPT-4o│
└──────────────────────────┘    └──────────────────────────────────┘
```

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
| `GEMINI_MODEL` | Gemini model name | `gemini-2.5-flash-preview-04-17` |
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

## License

Proprietary. All rights reserved.

---

<p align="center">
  <sub>Built for teams who want to see their space clearly.</sub>
</p>
