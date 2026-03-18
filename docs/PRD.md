# SpaceFlow — Product Requirements Document (PRD)

**Version:** 1.0  
**Last Updated:** March 2026  
**Status:** Active Development

---

## 1. Executive Summary

**SpaceFlow** is a smart workplace platform for SMBs and coworking operators that bridges the gap between what's booked and what's actually used. The product delivers real-time visibility, AI-powered intelligence, and frictionless booking to help organizations optimize space utilization, reduce waste, and maximize ROI.

**Tagline:** *Know what's booked vs what's used.*

---

## 2. Problem Statement

### 2.1 The Space Utilization Gap

- **35% of workplace space is wasted on average** — organizations over-book, under-use, or misallocate spaces.
- Traditional booking systems show *reservations* but not *actual usage*, leading to poor decisions about layout, pricing, and capacity.
- SMBs and coworking operators lack affordable, integrated tools to measure utilization and act on insights.
- Manual tracking is error-prone; spreadsheets and legacy systems don't scale.

### 2.2 Pain Points by Persona

| Persona | Pain Point |
|---------|------------|
| **Facility Manager** | "I don't know if our meeting rooms are actually used when booked." |
| **Coworking Operator** | "We're guessing on pricing and capacity. We need data." |
| **Team Member** | "Booking is clunky. I want one-click, instant confirmation." |
| **Admin** | "Managing users and permissions across tools is a mess." |

---

## 3. Product Vision & Goals

### 3.1 Vision

SpaceFlow becomes the default platform for SMBs and coworking operators to **see**, **book**, and **optimize** their physical spaces — turning utilization data into actionable intelligence.

### 3.2 Strategic Goals

1. **Visibility** — Real-time dashboards showing booked vs used, by space type and time.
2. **Intelligence** — AI recommendations for layout, pricing, and allocation.
3. **Simplicity** — One-click booking, instant confirmations, zero friction.

### 3.3 Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Space utilization improvement | +15% YoY | Utilization rate before/after |
| Booking completion time | < 30 seconds | Time from start to confirmation |
| User satisfaction (NPS) | ≥ 50 | Quarterly survey |
| Admin task time reduction | -40% | Time spent on user/space management |
| Recommendation adoption rate | ≥ 25% | % of recommendations acted upon |

---

## 4. Target Users & Personas

### 4.1 Primary Personas

| Persona | Description | Key Needs |
|---------|-------------|-----------|
| **Facility Manager** | Manages office/coworking space for 20–200 people | Utilization dashboards, reports, space configuration |
| **Coworking Operator** | Runs shared workspace business | Revenue optimization, member experience, capacity planning |
| **Team Member** | Books desks, rooms, zones regularly | Fast booking, availability visibility, mobile access |
| **Admin** | Manages users, roles, permissions | User table, role assignment, search, bulk actions |

### 4.2 Secondary Personas

- **Executive** — High-level utilization and cost reports.
- **IT/Integrator** — API access, SSO, calendar sync.

---

## 5. Core Features

### 5.1 Feature Overview

| Feature | Description | Priority |
|---------|-------------|----------|
| **Home (Public)** | Hero, value pillars, how it works, CTA | P0 |
| **Login & Signup** | Auth flows, validation, error handling | P0 |
| **Dashboard** | Overview cards, charts, recent bookings | P0 |
| **Book Space** | Space picker, filters, calendar/time, confirmation | P0 |
| **My Bookings** | List/grid, cancel, reschedule | P0 |
| **Utilization** | Booked vs used charts, hourly breakdown, time range | P0 |
| **Recommendations** | AI recommendations with confidence, categories | P0 |
| **Admin** | User table, search, edit, roles | P1 |

### 5.2 Feature Specifications

#### 5.2.1 Home (Public)

- **Hero:** Bold headline "Know what's booked vs what's used", subhead, primary CTA (Start Free Trial).
- **Value Pillars:** 3 cards — Visibility, Intelligence, Simplicity — with icons and descriptions.
- **How It Works:** 3 steps — Book → Track → Optimize.
- **Stats:** Key metrics (e.g., 35% wasted, 2.4x faster booking, 89% satisfaction).
- **CTA Section:** Final conversion block.
- **Nav:** Login, Signup. Smooth hover states.

#### 5.2.2 Login & Signup

- Centered forms, strong CTAs.
- Success: redirect with smooth transition.
- Error: inline message with gentle shake animation.
- Focus states on inputs.

#### 5.2.3 Dashboard (Authenticated)

- **Overview Cards:** Utilization %, active bookings, team members, avg. duration — with change indicators.
- **Charts:** Weekly utilization (bar), monthly trend (line).
- **Recent Bookings:** Table with space, user, time, status (Active/Upcoming/Completed).
- **Sidebar:** Nav with active state, collapsible on mobile.

#### 5.2.4 Book Space

- **Space Picker:** Grid of space cards (name, type, floor, capacity, availability).
- **Filters:** Type (meeting, desk, phone, lounge), Floor.
- **Availability:** Real-time available/occupied status.
- **Confirmation:** Success overlay with checkmark animation.

#### 5.2.5 My Bookings

- List or card grid of user's bookings.
- Each item: space, time, status. Actions: Cancel, Reschedule.
- Staggered load animation, hover highlight.

#### 5.2.6 Utilization

- **Booked vs Used:** Bar chart by day.
- **Hourly Breakdown:** Area chart by space type (desks, rooms, lounges).
- **Time Range:** Today, This Week, This Month.

#### 5.2.7 Recommendations

- Card list of AI recommendations.
- Each card: title, description, confidence %, category (Cost Saving, Optimization, Revenue).
- "View details" CTA.

#### 5.2.8 Admin (Admin Role)

- User table: Name, Email, Role, Status, Bookings.
- Search by name/email.
- Edit modal: Name, Email, Role.
- Sortable, hover rows.

---

## 6. User Stories

### 6.1 Epic: Visibility

| ID | Story | Acceptance Criteria |
|----|-------|---------------------|
| V1 | As a facility manager, I want to see utilization by day and space type so I can identify underused areas. | Dashboard shows utilization %, charts with time range selector |
| V2 | As an operator, I want to compare booked vs used so I can see no-shows and overbooking. | Utilization page shows Booked vs Used chart |
| V3 | As a manager, I want hourly breakdown by space type so I can plan staffing and cleaning. | Hourly Breakdown area chart with desks, rooms, lounges |

### 6.2 Epic: Intelligence

| ID | Story | Acceptance Criteria |
|----|-------|---------------------|
| I1 | As a facility manager, I want AI recommendations to reduce waste so I can cut costs. | Recommendations page shows actionable cards with confidence |
| I2 | As an operator, I want recommendations categorized (Cost, Optimization, Revenue) so I can prioritize. | Each recommendation has category badge |
| I3 | As a manager, I want to see confidence levels so I can decide which to act on. | Confidence % displayed per recommendation |

### 6.3 Epic: Simplicity

| ID | Story | Acceptance Criteria |
|----|-------|---------------------|
| S1 | As a team member, I want to book a space in one click so I can reserve quickly. | Book Space: select space → Book Now → confirmation |
| S2 | As a team member, I want to filter by type and floor so I can find the right space. | Filters for type and floor work correctly |
| S3 | As a team member, I want to see my bookings and cancel/reschedule so I can manage my schedule. | My Bookings: list, cancel, reschedule actions |

### 6.4 Epic: Administration

| ID | Story | Acceptance Criteria |
|----|-------|---------------------|
| A1 | As an admin, I want to search users by name or email so I can find them quickly. | Search filters user table |
| A2 | As an admin, I want to edit user name, email, role so I can manage permissions. | Edit modal saves changes |
| A3 | As an admin, I want to see user status and booking count so I can assess activity. | Table shows Status, Bookings columns |

---

## 7. Technical Architecture

### 7.1 Current Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, TypeScript |
| Styling | Tailwind CSS, shadcn/ui |
| Animation | Framer Motion |
| Charts | Recharts |
| State | TanStack Query (React Query) |
| Routing | React Router v6 |
| Forms | React Hook Form, Zod |

### 7.2 Architecture Principles

- **Mobile-first responsive design**
- **Progressive enhancement** — core flows work without JS where possible
- **Accessibility** — focus states, aria-labels, prefers-reduced-motion support
- **Performance** — lazy loading, skeleton loaders, optimized animations

### 7.3 Planned Backend (Future)

- REST or GraphQL API for auth, bookings, utilization, recommendations
- Real-time utilization data ingestion (sensors, check-in, calendar sync)
- AI/ML pipeline for recommendations

---

## 8. Design & UX Requirements

### 8.1 Design Principles

- **Avoid generic AI aesthetics:** No Inter, Roboto, Arial, or purple-on-white gradients.
- **Distinctive typography:** Bold display font (Clash Display, Satoshi, Syne, Geist) + clean sans for body.
- **Cohesive color palette:** One dominant, one accent, strong contrast. Dark mode for app, light for public.
- **8px grid, generous spacing, clear hierarchy.**

### 8.2 Animation Requirements (Critical)

| Element | Animation |
|---------|-----------|
| Page transitions | Fade + slide-up, 300–400ms |
| Hero / cards on load | Staggered fade + slide, 60–100ms delay |
| Buttons hover | Scale 1.02–1.05, 200ms |
| Cards hover | translateY(-2px), shadow increase |
| Scroll behavior | `scroll-behavior: smooth` |
| Scroll-triggered sections | Fade-in + slide-up on viewport enter |
| Skeleton loaders | Shimmer gradient |
| Form focus | Ring transition, label float |
| Success state | Checkmark scale-in |
| Charts | Animate bars/lines on load |

### 8.3 What to Avoid

- Centered card stacks with identical spacing
- Purple/violet gradients as primary
- Instant page changes with no transition
- Static, non-animated charts
- Cluttered layouts — prioritize clarity and whitespace

---

## 9. Roles & Permissions

| Role | Dashboard | Book | My Bookings | Utilization | Recommendations | Admin |
|------|------------|------|-------------|-------------|-----------------|-------|
| Member | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| Manager | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| Admin | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

---

## 10. Roadmap

### Phase 1: MVP (Current)

- [x] Public home, login, signup
- [x] Dashboard with overview, charts, recent bookings
- [x] Book Space with filters and confirmation
- [x] My Bookings
- [x] Utilization (booked vs used, hourly)
- [x] Recommendations (AI cards)
- [x] Admin (user management)

### Phase 2: Backend & Data

- [ ] Auth API (JWT, sessions)
- [ ] Bookings API (CRUD)
- [ ] Utilization data pipeline
- [ ] Recommendations engine (ML)

### Phase 3: Enhanced UX

- [ ] Calendar/time picker for booking
- [ ] Mobile app or PWA
- [ ] Email notifications
- [ ] Export reports (PDF, CSV)

### Phase 4: Scale & Integrations

- [ ] SSO (SAML, OIDC)
- [ ] Calendar sync (Google, Outlook)
- [ ] IoT/sensor integration for real-time occupancy
- [ ] API for third-party integrations

---

## 11. Open Questions & Assumptions

### Assumptions

- SMBs and coworking operators are willing to pay for utilization insights.
- Utilization data can be derived from bookings + check-in (or sensors) without heavy hardware.
- AI recommendations will improve with more data over time.

### Open Questions

- How will utilization data be captured? (Manual check-in, sensors, calendar sync?)
- Pricing model: per-seat, per-space, or tiered?
- Multi-tenant vs single-tenant architecture?

---

## 12. Appendix

### A. Glossary

| Term | Definition |
|------|------------|
| **Utilization** | % of time a space is actually used vs available |
| **Booked** | Space has a reservation |
| **Used** | Space was physically occupied (verified) |
| **SMB** | Small and medium-sized business |

### B. References

- [LOVABLE_FRONTEND_PROMPT.md](../LOVABLE_FRONTEND_PROMPT.md) — Frontend design and animation spec
- [create-skill SKILL.md](https://cursor.com/docs/skills) — Cursor skill authoring guide (for AI-assisted development)

---

*This PRD is a living document. Update as product evolves.*
