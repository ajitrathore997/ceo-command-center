# CEO Command Center

CEO Command Center is an internal executive dashboard for a real-estate company leadership team. It gives the CEO a single view of key department performance across Sales, Operations, Finance, Marketing, and HR, along with a limited set of real executive actions that update the database.

The project is built as a full-stack Next.js application using Prisma and PostgreSQL. It prioritizes real data access, authenticated access, role-based authorization, and a practical leadership dashboard experience rather than mock UI-only state.

## Features

### Sales
- Total active deals
- Pipeline value this month
- Deals closed this week
- Mark a deal as won or lost

### Operations
- Tasks overdue
- Tasks completed today
- Team members active right now
- Reassign an overdue task

### Finance
- Monthly revenue vs target percentage
- Pending invoice count
- Pending invoice total value
- Approve a pending invoice

### Marketing
- Active campaigns count
- Leads generated this week
- Top lead source
- Pause or activate a campaign

### HR
- Total headcount
- Open positions
- Attendance today percentage
- Approve a leave request

### Shared dashboard features
- Expandable department cards
- Loading states and error states
- Success and failure feedback for actions
- Mobile-first responsive layout
- Authentication and authorization checks
- Polling-based dashboard refresh
- Critical department alert bar
- Light/dark mode toggle with persistent preference

## Bonus features implemented

### Polling
The dashboard polls the existing REST dashboard endpoint every 30 seconds. This keeps the executive summary up to date without requiring a full page refresh. Polling reuses the same API layer as the dashboard and prevents duplicate requests while an in-flight refresh is already running.

### Critical alert
A critical alert is shown when one or more departments fall into a critical condition. The alert is derived from actual department metrics and status logic, not a hardcoded banner. If multiple departments are critical, the alert uses a deterministic priority order.

### Dark mode
The application includes a light/dark mode toggle across the login and dashboard flows. The selected theme is persisted in localStorage so it remains after refresh. The dark theme maintains readability across cards, inputs, buttons, tables, alerts, and status indicators without redesigning the product.

## Tech stack

- Next.js: app framework and route handlers
- React: UI rendering and client interactions
- TypeScript: type-safe frontend and backend code
- Tailwind CSS: styling system
- PostgreSQL: relational data store
- Prisma: ORM and database access layer
- JWT: authentication token generation and verification
- bcryptjs: password hashing and verification

## Architecture

Browser
↓
Next.js / React UI
↓
Next.js Route Handlers (REST API)
↓
Authentication / Authorization helpers
↓
Prisma
↓
PostgreSQL

The dashboard data is fetched from REST endpoints implemented in Next.js route handlers. Prisma is used for database reads and writes. Authentication is cookie-based and uses a JWT stored in an HTTP-only cookie. Mutation endpoints enforce CEO-only authorization. Status values are calculated centrally from live metrics before the UI renders them.

## Project structure

```text
app/
  api/
    auth/
    dashboard/
    finance/
    hr/
    marketing/
    operations/
    sales/
  dashboard/
  login/
  globals.css
  layout.tsx
  page.tsx
components/
  CriticalAlert.tsx
  DepartmentCard.tsx
  DepartmentDetails.tsx
  ErrorState.tsx
  LoadingState.tsx
  LogoutButton.tsx
  StatusBadge.tsx
  ThemeToggle.tsx
lib/
  auth.ts
  dashboard-config.ts
  prisma.ts
  status.ts
prisma/
  schema.prisma
  seed.ts
public/
```

Notable folders:
- `app/`: app routes, page entry points, and API endpoints
- `components/`: reusable UI for cards, details, alerts, loading, and auth actions
- `lib/`: shared auth, config, status logic, and Prisma access helpers
- `prisma/`: Prisma schema and local seed script
- `public/`: static assets

## Database and schema

The project uses PostgreSQL with Prisma.

Why PostgreSQL was chosen for this assessment:
- the data model is relational and connected across departments
- the dashboard requires aggregated reporting and reporting-style queries
- Prisma works well with relational constraints and type-safe data access
- the schema is straightforward to manage for a single internal executive dashboard

### Important models in the Prisma schema

- `User`
- `Deal`
- `Employee`
- `Task`
- `Invoice`
- `Campaign`
- `LeaveRequest`

These models are defined in `prisma/schema.prisma` and cover the real estate sales, operations, finance, marketing, and HR workflow for the dashboard.

## Database setup

This project uses Prisma and PostgreSQL. The exact commands are intended to be run via pnpm.

1. Install dependencies:

```bash
corepack pnpm install
```

2. Configure PostgreSQL and set the required environment variables in a local `.env` file.

3. Generate the Prisma client and push the schema:

```bash
corepack pnpm prisma generate
corepack pnpm prisma db push
```

4. Seed the database with realistic demo data:

```bash
corepack pnpm tsx prisma/seed.ts
```

5. Start the development server:

```bash
corepack pnpm dev
```

6. Build for production:

```bash
corepack pnpm build
```

7. Lint the project:

```bash
corepack pnpm lint
```

### Seed script note
The seed script is intentionally destructive for local/demo development. It clears and repopulates data using `deleteMany()` calls before creating the seeded records. This is useful for resetting the dashboard to a known, meaningful state while evaluating the assessment.

## Environment variables

The project requires the following environment variables:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE"
JWT_SECRET="replace-with-a-long-random-secret"
MONTHLY_REVENUE_TARGET=1500000
OPEN_POSITIONS=8
```

### Required variables

- `DATABASE_URL`: PostgreSQL connection string for Prisma and app data access
- `JWT_SECRET`: secret used to sign JWTs for authentication
- `MONTHLY_REVENUE_TARGET`: used by the finance summary and target comparison logic
- `OPEN_POSITIONS`: used by the HR dashboard summary

## Demo login

The seed script creates a CEO user for local/demo use.

### Demo credentials
- Email: `ceo@commandcenter.local`
- Password: `CEO123!secure`

These credentials are intended for local development and evaluation of the seeded dashboard state.

## Authentication and authorization

### Authentication flow
- Email/password login is handled by `app/api/auth/login/route.ts`
- User passwords are verified with `bcrypt.compare` in `lib/auth.ts`
- JWTs are generated with `jsonwebtoken` and expire after 8 hours
- The JWT is stored in an HTTP-only cookie named `ceo_command_center_token`
- The token is not returned in the login response body

### Authorization flow
- The dashboard route checks the authenticated user before allowing access
- Mutation APIs require the authenticated user to have the `CEO` role
- Unauthenticated requests are rejected with `401`
- Authenticated non-CEO users are rejected with `403`
- Logout clears the authentication cookie via `POST /api/auth/logout`

The root route (`/`) redirects authenticated users to the dashboard and unauthenticated users to the login page.

## API endpoints

| Method | Endpoint | Purpose | Auth | Notes |
|---|---|---|---|---|
| POST | /api/auth/login | Sign in with email and password | No | Sets auth cookie |
| POST | /api/auth/logout | Sign out and clear auth cookie | No | Clears session |
| GET | /api/dashboard | Fetch overall dashboard summary and status | Yes | Main dashboard data source |
| GET | /api/sales | Fetch sales summary and records | Yes | Sales details |
| PATCH | /api/sales/[id] | Mark a deal as won or lost | Yes, CEO-only | Real database mutation |
| GET | /api/operations | Fetch operations summary and task list | Yes | Operations details |
| PATCH | /api/operations/tasks/[id]/reassign | Reassign an overdue task | Yes, CEO-only | Real database mutation |
| GET | /api/finance | Fetch finance summary and invoice list | Yes | Finance details |
| PATCH | /api/finance/invoices/[id]/approve | Approve an invoice | Yes, CEO-only | Real database mutation |
| GET | /api/marketing | Fetch marketing summary and campaigns | Yes | Marketing details |
| PATCH | /api/marketing/campaigns/[id]/status | Pause/activate a campaign | Yes, CEO-only | Real database mutation |
| GET | /api/hr | Fetch HR summary and leave requests | Yes | HR details |
| PATCH | /api/hr/leave-requests/[id]/approve | Approve a leave request | Yes, CEO-only | Real database mutation |

## Status logic

Status is centralized in `lib/status.ts` and calculated from real metrics before rendering in the UI.

### Sales
- Green: `activeDeals >= 20` and `dealsClosedThisWeek >= 5`
- Amber: `activeDeals >= 10` or `dealsClosedThisWeek >= 3`
- Red: otherwise

### Operations
- Green: `overdueTasks <= 3`
- Amber: `overdueTasks <= 8`
- Red: otherwise

### Finance
- Green: `revenueAchievementPercentage >= 90`
- Amber: `revenueAchievementPercentage >= 70`
- Red: otherwise

### Marketing
- Green: `leadsGeneratedThisWeek >= 100`
- Amber: `leadsGeneratedThisWeek >= 50`
- Red: otherwise

### HR
- Green: `attendancePercentage >= 90`
- Amber: `attendancePercentage >= 80`
- Red: otherwise

The UI consumes these calculated statuses rather than hardcoding colors or states in the display layer.

## Loading and error handling

The application includes practical loading and error states:
- initial dashboard loading state while the first fetch is in progress
- API error handling for failed requests
- retry actions for dashboard and details fetches
- mutation buttons are disabled while an action is in progress
- success messages and error messages are shown after actions
- polling failures do not wipe previously valid dashboard data; the next successful poll refreshes the dashboard state

## Responsive design

The interface is designed to work on mobile screens without sacrificing usability. Department cards stack neatly on smaller screens, and action controls remain accessible for key tasks. The design keeps the existing visual structure intact while adapting to smaller viewports.

## Polling design decision

Polling was chosen because the application needs near-real-time updates without the added complexity of a WebSocket layer. The dashboard already exposes robust REST endpoints, and the existing route structure supports a lightweight 30-second polling mechanism that is reliable for an executive dashboard workflow.

## Tradeoffs

1. PostgreSQL + Prisma
   - relational integrity and type-safe access are a good fit for this domain
2. Next.js route handlers
   - keeps the frontend and API together in one project without a separate Express server
3. Polling instead of WebSockets
   - simpler infrastructure and sufficient for a leadership dashboard use case
4. JWT in HTTP-only cookie
   - avoids exposing the token to browser JavaScript directly
5. Seeded demo data
   - makes the dashboard immediately meaningful and easy to evaluate locally
6. Centralized status logic
   - consistent status rules and easy review of thresholds

## Known limitations / future improvements

Activity history: Department cards currently focus on current KPIs and actions; a richer activity/history view could be added to show events such as approved invoices, won deals, campaign changes, and approved leave requests. Task reassignment history should specifically record the previous owner, new owner, person who made the change, timestamp, optional reason, and any due-date change so administrative actions remain traceable.

Mutation safety: Department actions currently update the latest record directly. Production improvements should add conditional updates, optimistic locking, and append-only audit events to prevent stale concurrent changes from overwriting newer decisions.

Test coverage: Additional automated tests could be added for API routes, authentication, and user interactions.

Authentication: A more advanced session model could use short-lived access tokens, such as 15 minutes, with long-lived refresh tokens, such as 7 to 30 days.

Secure refresh sessions: Refresh tokens could be stored in HTTP-only, Secure cookies with refresh-token rotation and revocation support.

Real-time updates: Polling could be replaced with WebSockets or server-sent events if true real-time collaboration is required.

Scalability: Caching, rate limiting, and additional observability could be introduced as usage grows.

These are not defects in the current assessment, just sensible future extensions.

## Getting started

### 1. Clone the repository

```bash
git clone <repository-url>
cd ceo-command-center
```

### 2. Install dependencies

```bash
corepack pnpm install
```

### 3. Create environment variables

Create a `.env` file in the project root with the required values:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE"
JWT_SECRET="replace-with-a-long-random-secret"
MONTHLY_REVENUE_TARGET=1000000
OPEN_POSITIONS=3
```

### 4. Configure PostgreSQL
Make sure PostgreSQL is running and the `DATABASE_URL` points to a reachable local or remote database instance.

### 5. Generate Prisma client and push schema

```bash
corepack pnpm prisma generate
corepack pnpm prisma db push
```

### 6. Seed the database

```bash
corepack pnpm tsx prisma/seed.ts
```

### 7. Start the app

```bash
corepack pnpm dev
```

Then open the application in the browser at:

```text
http://localhost:3000
```

## Production build

The project build command is:

Local build:
corepack pnpm build

Render production build:
pnpm install --frozen-lockfile &&
pnpm exec prisma generate &&
pnpm exec prisma migrate deploy &&
pnpm run build

## Deployment

The assessment is deployed using Render.

### Render PostgreSQL

A PostgreSQL database is hosted on Render.

### Render Web Service

The Next.js application is deployed as a Render Web Service.

Build command:

```bash
pnpm install --frozen-lockfile && pnpm exec prisma generate && pnpm exec prisma migrate deploy && pnpm run build
```

## Quality summary

This project was built as a practical full-stack assessment focused on:
- end-to-end functionality
- real PostgreSQL-backed data
- secure authentication and authorization
- data-driven dashboard status logic
- responsive UI for executive use
- API-driven actions and validation
- live polling and critical alerting
- dark mode usability

The implementation is intentionally straightforward and reviewable rather than over-engineered.
