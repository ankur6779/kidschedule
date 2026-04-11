# Workspace

## Overview

AmyNest — an AI-powered daily routine planner for parents. Parents can create child profiles, generate AI-structured daily schedules, track behavior, and view a summary dashboard.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite + Tailwind + shadcn/ui (artifacts/kidschedule)
- **API framework**: Express 5 (artifacts/api-server)
- **Database**: PostgreSQL + Drizzle ORM (lib/db)
- **Auth**: Clerk (`@clerk/react` frontend, `@clerk/express` backend) — proxy at `/api/__clerk`
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec in lib/api-spec)
- **AI**: OpenAI via Replit AI Integrations (gpt-5.2 for routine generation)
- **Build**: esbuild (CJS bundle)

## Features

- **Auth** — Clerk login with email + Google OAuth; landing page for signed-out users, protected routes for signed-in users
- **Dashboard** — time-based personalized greeting, summary stats, recent routines, behavior highlights by child
- **Children** — add/edit/delete child profiles with age, school times, travel mode, wake/sleep times, goals, and babysitter assignment
- **Parent Profile** — role (Mother/Father), work type (WFH/WFO/Homemaker), work hours, free availability slots, food preferences (veg/non-veg) and allergies
- **Babysitter Management** — add/remove babysitters with name, mobile number, and notes; assign to children
- **AI Routine Generator** — generates full daily schedule using child profile + parent work availability + babysitter assignment + behavior history + food preferences + fridge items
- **Smart Nutrition** — AI suggests 2-3 meal options per meal slot in generated routines; each option is tappable to view a full AI recipe (ingredients, steps, prep/cook times, parent tips)
- **Fridge-Based Meals** — optionally enter available fridge ingredients before generating; AI only suggests meals using those items
- **Recipe Viewer** — on-demand AI-generated recipes for any meal suggestion in a routine detail dialog
- **Routine Detail** — task status tracking (Complete/Delay/Skip) with auto-shift on delay, progress bar, browser notifications, and Share button; inline task editing with time-cascade (pencil icon on hover); Regenerate Remaining Day button (keeps completed tasks, re-generates pending ones via AI); Add Activity dialog to inject a new activity and have AI refit the schedule
- **Next-Day Auto-Generation** — marking a sleep/bedtime task as complete triggers a dialog offering to auto-generate tomorrow's routine (weekend detection auto-sets hasSchool=false)
- **Partial Regeneration** — `POST /api/routines/:id/partial-regenerate` endpoint keeps completed tasks and regenerates all pending tasks from current time; supports `newActivity` body param to inject a new activity
- **Share Routine** — copy routine as a formatted message or open directly in WhatsApp to send to babysitter
- **Behavior Tracker** — log positive/negative/neutral behaviors per child per day
- **AI Parenting Assistant** — full chat interface at `/assistant` with suggested questions; get warm, practical parenting advice on sleep, food, behavior, anxiety, screen time, etc.
- **Mobile-friendly** — responsive layout with bottom nav (Dashboard, Routines, Progress, Assistant) on mobile, full sidebar on desktop
- **Weekly Calendar View** — Routines page has Calendar tab (default) with Mon–Sun week grid, navigation arrows, color-coded day indicators (green = has routine, primary = today, muted = weekend), and click-to-navigate
- **Progress & Insights Dashboard** — `/progress` page with 🔥 streak tracker (consecutive days with routines), overall completion donut chart, 7-day bar chart, per-child breakdown with progress bars
- **AI Insights** — POST `/api/insights` generates AI parenting insights based on routine completion/skip/delay patterns; displayed on the Progress page
- **Weekend Auto-Detection** — generate page detects Sat/Sun from selected date, auto-sets hasSchool=false and shows "🏖️ Weekend auto-detected" badge
- **Today's Schedule Card** — Dashboard shows current + upcoming activities from today's routine, highlighting the "NOW" slot in real time
- **Streak Teaser on Dashboard** — Compact 🔥 streak card on dashboard links to /progress page
- **Age-Based Intelligence** — child profiles now include `ageMonths` (0–11) in addition to `age` (years); age group is auto-classified as Infant/Toddler/Preschool/School Age/Pre-Teen; `getAgeGroup()` + `getAgeGroupInfo()` + `formatAge()` in `age-groups.ts`
- **Infant Mode** — when a child's age group is "Infant", the generate page replaces the routine form with a full care guidance panel (feeding tips, vaccination schedule, sleep guidance, potty training), lullaby music player (Web Audio API, 3 tracks, looping), and parent tasks checklist
- **Skill Focus Section** — shown on generate page for all non-infant children; displays 4 age-appropriate skill activities based on age group
- **Story Section** — age-appropriate moral stories with "Read Aloud" TTS button (SpeechSynthesis API); toddlers/preschoolers get 2 stories, older children get 2 with thematic titles
- **Parent Tasks Section** — checkable daily parent task list on generate page based on age group
- **Age Group Badge** — profile summary on generate page shows emoji + age group label + formatted age (e.g. "7y 3m")
- **AI Prompt Age Context** — age group classification injected into AI routine generation prompt with tailored instructions per group (infant care, toddler play, school study blocks, pre-teen independence)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## DB Schema

- `children` — child profiles (name, age, school times, goals)
- `routines` — saved daily routines (linked to child, contains JSONB items array)
- `behaviors` — behavior logs (linked to child, date, type: positive/negative/neutral)

## API Routes

- `GET/POST /api/children` — list and create child profiles
- `GET/PATCH/DELETE /api/children/:id` — manage individual profiles
- `GET/POST /api/routines` — list and create routines
- `GET/DELETE /api/routines/:id` — view and delete routine
- `POST /api/routines/generate` — AI-generate a routine for a child
- `POST /api/insights` — AI-generate weekly parenting insights from routine stats
- `POST /api/routines/:id/partial-regenerate` — keep completed tasks, regenerate pending tasks from now; optional `newActivity: {name, duration}` in body
- `GET/POST /api/behaviors` — list and log behavior entries
- `DELETE /api/behaviors/:id` — remove a behavior log
- `GET /api/dashboard/summary` — stats for dashboard
- `GET /api/dashboard/recent-routines` — recent 5 routines
- `GET /api/dashboard/behavior-stats` — per-child behavior counts

## Environment Variables

- `AI_INTEGRATIONS_OPENAI_BASE_URL` — auto-set by Replit AI Integrations
- `AI_INTEGRATIONS_OPENAI_API_KEY` — auto-set by Replit AI Integrations
- `DATABASE_URL` — auto-set by Replit database
