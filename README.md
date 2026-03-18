# SpaceFlow — Smart Workspace Platform

> **"Know what's booked vs what's used — and act on it."**

SpaceFlow is a lightweight, AI-powered workspace management platform built for SMBs and coworking operators. It shows you what's booked, what's actually used, and gives actionable AI recommendations — always advisory, never automatic.

---

## Architecture

- **Frontend:** Vite + React + TypeScript + Tailwind CSS + shadcn/ui + Framer Motion
- **Backend:** Node.js + Express + Prisma ORM
- **Database:** PostgreSQL (Docker)
- **AI:** Google Gemini 2.5 Flash (with rule-based fallback)
- **Auth:** Custom JWT with bcrypt, httpOnly cookies, refresh token rotation

## Roles

| Role | Capabilities |
|------|-------------|
| **Admin** | All features + manage users, spaces, platform config, audit log |
| **Facilities Manager** | Analytics, utilization, recommendations, booking management |
| **Employee** | Book spaces, view own bookings, check in/out |

## Quick Start

### 1. Start the database

```bash
docker compose up -d
```

### 2. Setup the backend

```bash
cd server
cp .env.example .env   # edit .env with your secrets
npm install
npm run db:migrate     # run migrations
npm run db:seed        # seed admin user + sample spaces
npm run dev            # starts on port 4000
```

**Default admin credentials (from `.env`):**
- Email: `admin@spaceflow.local`  
- Password: `Admin@SpaceFlow1!`

### 3. Start the frontend

```bash
# In the root directory
npm install
npm run dev            # starts on port 8080
```

### 4. Configure Gemini AI (optional)

In `server/.env`:
```
GEMINI_API_KEY=your-key-here
GEMINI_MODEL=gemini-2.0-flash
```

Without a Gemini key, SpaceFlow uses rule-based recommendations automatically.

---

## Features

### Core
- ✅ Space booking with conflict detection
- ✅ Check-in / check-out for occupancy tracking
- ✅ My Bookings with cancellation
- ✅ Real-time availability checking

### Analytics (Admin/FM)
- ✅ Utilization: planned vs actual (ghost booking detection)
- ✅ Booking usage: booked vs used vs no-shows
- ✅ Patterns: peak hours, peak days, by space type
- ✅ Segments: by floor, building, space type

### AI Recommendations
- ✅ Gemini 2.5 Flash integration with rule-based fallback
- ✅ Full explainability: confidence score, data sources, explanation, impact, suggested action
- ✅ Responsible AI: human-in-loop, advisory only, no auto-writes
- ✅ Focus areas: utilization, comfort, cost, sustainability

### Admin
- ✅ User management (create, edit role, activate/deactivate)
- ✅ Space management (CRUD)
- ✅ Platform config (booking rules, workday settings)
- ✅ Audit log (all API calls, paginated, filterable)

### Auth
- ✅ bcrypt cost 12 password hashing
- ✅ JWT access tokens (15min) + refresh tokens (7 days)
- ✅ Token rotation on refresh
- ✅ httpOnly cookies (SameSite, Secure in prod)
- ✅ Rate limiting (login: 5/15min, signup: 3/hour)
- ✅ Zod validation on all inputs

### Frontend
- ✅ Framer Motion animations (page transitions, stagger, scroll reveal)
- ✅ Skeleton loaders with shimmer
- ✅ Role-based navigation (sidebar adapts to role)
- ✅ Dark/light mode toggle
- ✅ Responsive design

---

## Environment Variables

**Frontend (`.env`):**
```
VITE_API_URL=http://localhost:4000
```

**Backend (`server/.env`):**
```
DATABASE_URL="postgresql://spaceflow:spaceflow@localhost:5432/spaceflow"
JWT_SECRET="long-random-secret-64-chars"
JWT_REFRESH_SECRET="another-long-random-secret"
PORT=4000
FRONTEND_URL=http://localhost:8080
GEMINI_API_KEY=""
GEMINI_MODEL="gemini-2.0-flash"
SEED_ADMIN_EMAIL="admin@spaceflow.local"
SEED_ADMIN_PASSWORD="Admin@SpaceFlow1!"
```
