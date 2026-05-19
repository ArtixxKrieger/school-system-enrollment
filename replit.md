# Kurios Enrollment System

A complete school enrollment management platform for a Philippine college, rebuilt from PHP to a modern Node.js + React stack. Manages student records, pre-registration, course enrollment, curriculum, roles, and users.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, proxied at `/api`)
- `pnpm --filter @workspace/enrollment run dev` — run the React frontend (port 18111, proxied at `/`)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run typecheck:libs` — build composite lib packages (run before artifact typechecks)
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/scripts run seed` — seed the database with roles, users, courses, and sample data
- Required env: `DATABASE_URL` — Postgres connection string, `SESSION_SECRET` — session signing key

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 + express-session + bcryptjs
- DB: PostgreSQL + Drizzle ORM
- Frontend: React + Vite + shadcn/ui + Recharts + wouter
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec → React Query hooks + Zod schemas)
- Build: esbuild (CJS bundle for API server)

## Where things live

- `lib/db/src/schema/` — Drizzle ORM schema (source of truth for DB shape)
- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for API contract)
- `lib/api-zod/src/generated/` — generated Zod schemas from OpenAPI
- `lib/api-client-react/src/generated/` — generated React Query hooks from OpenAPI
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/api-server/src/lib/` — auth, session, logger helpers
- `artifacts/enrollment/src/pages/` — React page components
- `artifacts/enrollment/src/contexts/auth-context.tsx` — auth state + session management
- `scripts/src/seed.ts` — database seed script

## Vercel Deployment (plug-and-play)

The project is fully configured for Vercel + Supabase. Just connect your GitHub repo to Vercel and set the following environment variables in the Vercel dashboard:

| Variable | Description |
|---|---|
| `DATABASE_URL` | Supabase PostgreSQL connection string (from Supabase → Settings → Database → Connection String → URI) |
| `SESSION_SECRET` | Any long random string for signing session cookies (e.g. `openssl rand -hex 32`) |
| `NODE_ENV` | Set to `production` |
| `CORS_ORIGIN` | Your Vercel app URL e.g. `https://your-app.vercel.app` (optional, defaults to reflect request origin) |

**No other config needed.** The session table is created automatically in the database on first request.

Vercel build settings (auto-detected from `vercel.json`):
- Build command: `pnpm --filter @workspace/enrollment run build`
- Output directory: `artifacts/enrollment/dist/public`
- API routes: `api/index.ts` (Express app as a single serverless function, handles all `/api/*`)

**Supabase setup:**
1. Create a project at supabase.com
2. Copy the connection string from Settings → Database → URI
3. Run the Drizzle schema push: `DATABASE_URL=<your-url> pnpm --filter @workspace/db run push`
4. Optionally seed: `DATABASE_URL=<your-url> pnpm --filter @workspace/scripts run seed`

## Architecture decisions

- Contract-first API: OpenAPI spec drives both Zod validation on the server and React Query hooks on the client — never written by hand.
- All Zod query param schemas use `snake_case` field names (matching URL conventions); body/response schemas use `camelCase` (matching JS conventions). Routes must destructure accordingly.
- Session auth via express-session with `connect-pg-simple` (PostgreSQL-backed, works in Vercel serverless); `credentials: 'include'` set in custom-fetch so cookies are sent on every request.
- DB lib is a composite TypeScript project — run `pnpm run typecheck:libs` before typechecking artifacts or the declarations won't exist.
- `gpa` is stored as Drizzle `numeric()` (string in DB) but exposed as `number` in the API — coerce with `String(gpa)` on update.
- SSL is automatically enabled when `DATABASE_URL` contains `supabase` or when `NODE_ENV=production`.

## Product

- **Login / Auth** — username or email + password; role-based (superadmin, admin, staff, professor, student)
- **Dashboard** — enrollment stats, recent activity, charts
- **Students** — master list, search/filter, status management, profile edit
- **Pre-Registration** — public form for new applicants, generates pre-reg number
- **Enrollees** — review and approve/reject pre-registrations, convert to enrolled students
- **Courses** — CRUD for course offerings (BSIT, BSCS, etc.)
- **Curriculum** — subject list per course/year/semester
- **Enrollment Settings** — academic year, enrollment status, active semester
- **Role Management** — role CRUD with per-module permission toggles
- **Users** — user CRUD, assign roles
- **Profile** — view/edit own profile, change password
- **Activity Logs** — audit trail of all system actions

## User preferences

- Use `bcryptjs` (not native `bcrypt`) — no native compilation required in Replit
- Do not write console.log in server code — use `req.log` in handlers, `logger` singleton elsewhere

## Gotchas

- After changing `lib/db` schema, run `pnpm --filter @workspace/db run push` then `pnpm run typecheck:libs`.
- After changing `lib/api-spec/openapi.yaml`, run `pnpm --filter @workspace/api-spec run codegen` to regenerate hooks + Zod schemas.
- Zod query param field names are **snake_case** (`course_id`, `year_level`) — destructure that way in routes and pass that way from the frontend.
- The `scripts` package resolves `@workspace/db` via tsconfig `paths` — do not remove that config.
- Restart the API server workflow after any source changes (the dev command rebuilds with esbuild).

## Seed credentials

| Username | Password | Role |
|---|---|---|
| superadmin | superadmin123 | superadmin |
| admin | admin123 | admin |
| staff1 | staff123 | staff |
| professor1 | professor123 | professor |

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
