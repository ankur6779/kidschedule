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
- **Routine Engine**: Fully rule-based, zero-cost (no OpenAI calls) — `lib/routine-templates.ts`
- **Build**: esbuild (CJS bundle)

## Features

- **Amy AI Brand** — cute SVG character (AmyIcon), floating assistant button (AmyFab), Amy avatars in chat, Amy AI copy throughout all pages
- **Auth** — Clerk login with email + Google OAuth; landing page for signed-out users, protected routes for signed-in users
- **Dashboard** — time-based personalized greeting, summary stats, recent routines, behavior highlights by child
- **Children** — add/edit/delete child profiles with DOB-based age detection, smart school logic, conditional school/travel fields, wake/sleep times, goals, and babysitter assignment; new columns: `dob` (text), `isSchoolGoing` (boolean)
- **Parent Profile** — role (Mother/Father), work type (WFH/WFO/Homemaker), work hours, free availability slots, food preferences (veg/non-veg) and allergies
- **Babysitter Management** — add/remove babysitters with name, mobile number, and notes; assign to children
- **Parenting Hub** — 5-section collapsible layout: (1) Ask Amy AI quick prompts, (2) Research-based Parenting Articles (15 in-app articles with modal reader, category filter, age matching, save/helpful, continue-reading, all localStorage), (3) Daily Tips (Amy AI personalization), (4) Emotional Support cards → /assistant, (5) Activities & Learning (existing infant/toddler/preschool/older content)
- **Routine Generator** — rule-based full-day schedule engine (`routine-templates.ts`); age-appropriate templates for 5 groups; handles school/no-school, mood, parent availability, food type — zero API cost
- **Smart Nutrition** — 5 veg + 5 non-veg options per meal type (breakfast/lunch/snack/dinner/tiffin) with seeded rotation for daily variety; each option is tappable to view a static recipe
- **Recipe Viewer** — static recipe database (`recipe-database.ts`) with keyword matching; 8 veg + 5 non-veg full recipes with ingredients, steps, prep/cook times, tips
- **Routine Detail** — task status tracking (Complete/Delay/Skip) with auto-shift on delay, progress bar, browser notifications, and Share button; inline task editing with time-cascade (pencil icon on hover); Regenerate Remaining Day button (keeps completed tasks, re-generates pending ones via AI); Add Activity dialog to inject a new activity and have AI refit the schedule
- **Next-Day Auto-Generation** — marking a sleep/bedtime task as complete triggers a dialog offering to auto-generate tomorrow's routine (weekend detection auto-sets hasSchool=false)
- **Partial Regeneration** — `POST /api/routines/:id/partial-regenerate` endpoint keeps completed tasks and regenerates all pending tasks from current time; supports `newActivity` body param to inject a new activity
- **Share Routine** — copy routine as a formatted message or open directly in WhatsApp to send to babysitter
- **Behavior Tracker** — log positive/negative/neutral behaviors per child per day
- **AI Parenting Assistant** — full chat interface at `/assistant` with suggested questions; get warm, practical parenting advice on sleep, food, behavior, anxiety, screen time, etc.
- **Mobile-friendly** — responsive layout with bottom nav (Dashboard, Routines, Progress, Assistant) on mobile, full sidebar on desktop
- **Weekly Calendar View** — Routines page has Calendar tab (default) with Mon–Sun week grid, navigation arrows, color-coded day indicators (green = has routine, primary = today, muted = weekend), and click-to-navigate
- **Progress & Insights Dashboard** — `/progress` page with 🔥 streak tracker (consecutive days with routines), overall completion donut chart, 7-day bar chart, per-child breakdown with progress bars
- **Smart Insights** — POST `/api/insights` generates rule-based parenting insights from real completion/skip/delay data (`generateRuleBasedInsights()`); no API cost
- **Weekend Auto-Detection** — generate page detects Sat/Sun from selected date, auto-sets hasSchool=false and shows "🏖️ Weekend auto-detected" badge
- **Today's Schedule Card** — Dashboard shows current + upcoming activities from today's routine, highlighting the "NOW" slot in real time
- **Streak Teaser on Dashboard** — Compact 🔥 streak card on dashboard links to /progress page
- **Age-Based Intelligence** — child profiles now include `ageMonths` (0–11) in addition to `age` (years); age group is auto-classified as Infant/Toddler/Preschool/School Age/Pre-Teen; `getAgeGroup()` + `getAgeGroupInfo()` + `formatAge()` in `age-groups.ts`
- **Infant Mode** — when a child's age group is "Infant", the generate page replaces the routine form with a full care guidance panel (feeding tips, vaccination schedule, sleep guidance, potty training), lullaby music player (Web Audio API, 3 tracks, looping), and parent tasks checklist
- **Skill Focus Section** — shown on generate page for all non-infant children; displays 4 age-appropriate skill activities based on age group
- **Story Section** — age-appropriate moral stories with "Read Aloud" TTS button (SpeechSynthesis API); toddlers/preschoolers get 2 stories, older children get 2 with thematic titles
- **Parent Tasks Section** — checkable daily parent task list on generate page based on age group
- **Age Group Badge** — profile summary on generate page shows emoji + age group label + formatted age (e.g. "7y 3m")
- **Hybrid AI Architecture** — `IS_PREMIUM = false` flag in `ai-limits.ts`; rule-based system is always free; AI features are opt-in and rate-limited:
  - `POST /ai/assistant-ai` — OpenAI-powered parenting assistant (gpt-5.2); falls back to static FAQ on error
  - `POST /routines/generate-ai` — OpenAI-powered routine generation with JSON mode; falls back to rule-based on error
  - `POST /api/insights` — still rule-based, but cached weekly in localStorage
- **AI Daily Question Limit** — 5 AI questions/day tracked in localStorage (`amynest_ai_q_{date}`); shown as dot progress bar in assistant header
- **Weekly Insights Cache** — insights stored in `amynest_insights_{year}_w{weekNum}` in localStorage; auto-loaded on page visit; "Refresh" button clears cache and regenerates
- **Smart AI Routine Button** — secondary violet button on generate page; shows "AI Feature" badge; triggers `/routines/generate-ai`; loading overlay turns purple with Brain icon
- **"AI Feature" Badges** — violet gradient badges on Assistant page header, AI Insights section title, Smart AI Routine button
- **Parenting Assistant** — calls `/ai/assistant-ai` (OpenAI) while limit allows; stops with "Daily limit reached" message; falls back gracefully
- **Static Activity Library** — 5 age-group pools of afternoon activities + 8 bonding activities; seeded shuffle ensures daily variety without repetition

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
