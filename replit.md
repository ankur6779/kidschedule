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
- **Parenting Hub** — 7-section collapsible layout: (1) Ask Amy AI quick prompts, (2) Research-based Parenting Articles (15 in-app articles with modal reader, category filter, age matching, save/helpful, continue-reading, all localStorage), (3) Daily Tips (Amy AI personalization), (4) Emotional Support cards → /assistant, (5) Activities & Learning (existing infant/toddler/preschool/older content), (6) **Smart Olympiad Zone** for ages 3–15 — Daily 5 MCQs + Practice + Progress tabs, 4 subjects (Math/Science/Reasoning/GK) × 3 age bands × 3 difficulties (~108-question static bank in `lib/olympiad-questions.ts`), adaptive difficulty, weekly 20-question test, 12 badges, persisted in localStorage as `olympiad:v1:{childId}`, (7) **Life Skills Mode** for ages 2–15 — daily real-life skill tasks for 4 age bands (toddler 2–4 / preschool 5–6 / kid 7–10 / teen 11–15) across 8 categories (hygiene, social, responsibility, emotional, money, time, self-care, chores) with easy/medium/hard difficulty (5/10/15 pts), deterministic daily picker (date + childId seed), Mark Done / Skip actions, per-category progress bars, rule-based Amy AI insight, tri-lingual (English / Hindi / Hinglish) with in-section language toggle, persisted in localStorage / AsyncStorage as `lifeskills:v1:{childId}`. **Shipped on BOTH web and mobile** with shared workspace lib `@workspace/life-skills` (`lib/life-skills/src/index.ts`) holding tasks, types, picker, insight builder and UI label dictionary; mobile section lives in `artifacts/amynest-mobile/components/LifeSkillsZone.tsx` and is rendered as the 6th `Section` of `app/(tabs)/hub.tsx`.
- **Routine Generator** — rule-based full-day schedule engine (`routine-templates.ts`); age-appropriate templates for 5 groups; handles school/no-school, mood, parent availability, food type — zero API cost
- **Smart Nutrition** — 5 veg + 5 non-veg options per meal type (breakfast/lunch/snack/dinner/tiffin) with seeded rotation for daily variety; each option is tappable to view a static recipe
- **Regional Meal Localization** — parents pick a regional cuisine in their profile (North Indian / South Indian / Bengali / Gujarati / Maharashtrian / Punjabi / Global / Pan-Indian default). Both rule-based and AI-generated routines tailor breakfast/lunch/dinner/snack/tiffin suggestions to that region, with safe fallback to pan-Indian for any missing entries. Implemented end-to-end: `parent_profiles.region` column, `mealsFor(region, key)` helper in routine-templates, region threading in `/routines/generate`, `/routines/generate-ai` (incl. AI-failure fallback), and `/routines/:id/partial-regenerate`, plus region selector on web parent profile and mobile profile screens.
- **Recipe Viewer** — static recipe database (`recipe-database.ts`) with keyword matching; 8 veg + 5 non-veg full recipes with ingredients, steps, prep/cook times, tips
- **Routine Detail** — task status tracking (Complete/Delay/Skip) with auto-shift on delay, progress bar, browser notifications, and Share button; inline task editing with time-cascade (pencil icon on hover); Regenerate Remaining Day button (keeps completed tasks, re-generates pending ones via AI); Add Activity dialog to inject a new activity and have AI refit the schedule
- **Next-Day Auto-Generation** — marking a sleep/bedtime task as complete triggers a dialog offering to auto-generate tomorrow's routine (weekend detection auto-sets hasSchool=false)
- **Partial Regeneration** — `POST /api/routines/:id/partial-regenerate` endpoint keeps completed tasks and regenerates all pending tasks from current time; supports `newActivity` body param to inject a new activity
- **Share Routine** — copy routine as a formatted message or open directly in WhatsApp to send to babysitter
- **Behavior Tracker** — log positive/negative/neutral behaviors per child per day
- **Family Routine System** — multi-child generation with handler types (Mom/Dad/Grandparent/Babysitter); routine output is auto-simplified per handler (grandparent: skip study/creative, cap 9, "Easy:" prefix; babysitter: skip study, cap 11, "Step:" prefix; essentials always preserved). Family-mode results show 3 extra cards: **Amy AI Suggests** (sync suggestions across siblings — meal alignment, wake stagger, age-gap care, bonding moments), **Family Points** (per-child possible points + +20 family bonus), and **Shared Family Activities** (3 picks from an 8-item catalog filtered by sibling age range). Shipped on BOTH web (`artifacts/kidschedule/src/pages/routines/generate.tsx`) and mobile (`artifacts/amynest-mobile/app/routines/generate.tsx`) via shared workspace lib `@workspace/family-routine` (`lib/family-routine/src/index.ts` — `HANDLER_TYPES`, `simplifyForHandler`, `appendHandlerToPlans`, `buildSyncSuggestions`, `computeFamilyPoints`, `pickSharedActivities`).
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
- **AI Daily Question Limit** — 5 AI questions/day enforced **server-side** via `aiUsageGate` middleware (atomic reserve-then-check using `usage_daily` table; rollback on quota exceed or non-2xx). Web/mobile assistant + coach pages derive remaining count from `/api/subscription` entitlements
- **Freemium Subscription** — plans: free / monthly ₹199 / six_month ₹999 / yearly ₹1599; 3-day trial; free caps: 5 AI/day, 1 child, 2 routines, 3 hub articles
  - Backend: `/api/subscription` (entitlements + plan cards), `/api/subscription/start-trial`, `/api/subscription/checkout` + `/api/subscription/rc-config` (return RevenueCat offering/entitlement/appUserId), `POST /api/subscription/webhook` (RevenueCat events → activates / cancels subscription, gated by `REVENUECAT_WEBHOOK_SECRET` in production). Subscription router is mounted **before** the global `requireAuth` so the webhook is reachable; protected endpoints inside attach `requireAuth` per-route. `isPremiumNow` keeps premium until `currentPeriodEnd` for `canceled`/`past_due`. Cap enforcement on `POST /children` and `POST /routines` (with ownership check); 402 returned on any cap or quota breach
  - **Razorpay (web + Android)** — second payment provider for India (UPI / cards / netbanking / wallets) using Razorpay Subscriptions (mandates / UPI Autopay). iOS continues to use RevenueCat / Apple IAP only.
    - Backend: `POST /api/subscription/razorpay/create-subscription` (auth required, returns `{subscriptionId, keyId}`; stamps `notes.userId` so we can check ownership later), `POST /api/subscription/razorpay/verify` (HMAC-SHA256 verify of `{paymentId|subscriptionId}` + fetches the subscription from Razorpay and enforces `notes.userId === auth.userId` and `razorpayPlanIdToPlan(sub.plan_id) === planFromBody` to block cross-account replay; persists ONLY the provider linkage and returns `{ok, pending: true}` — does NOT flip status to active), `POST /api/subscription/razorpay/webhook` (verifies `X-Razorpay-Signature`, requires `application/json` content type so the rawBody hook is guaranteed to have run, idempotent on `event.id` with the seen-set updated only after successful processing, returns 500 on processing failures so Razorpay retries; mounted before global `requireAuth`). Webhook returns 503 in production when `RAZORPAY_WEBHOOK_SECRET` unset.
    - Lifecycle mapping: `subscription.activated` / `.charged` / `.resumed` → `activateSubscription(plan, periodEnd, provider="razorpay")` (this is the canonical activation event — the verify endpoint never flips status itself); `subscription.cancelled` / `.completed` / `.expired` / `.paused` → `canceled` (premium kept until `currentPeriodEnd`); `subscription.halted` → `past_due` (kept distinct from `canceled` so we can show a "payment failed, please update" UI rather than a hard cancel — Razorpay halts after repeated failed retries). `subscription.authenticated` is intentionally NOT mapped to activation: it fires when the mandate is approved but before the first payment is captured, so we wait for `.activated` / `.charged` instead.
    - Express `express.json({ verify })` captures the raw request body for the webhook path so HMAC verification works.
    - Web paywall uses `checkout.razorpay.com/v1/checkout.js` (lazy-loaded). Mobile (Android only) uses `react-native-razorpay` (native module, requires dev/production build — not Expo Go; gated via `Platform.OS === "android"` + try/require).
    - Seed script: `pnpm --filter @workspace/api-server exec tsx scripts/seedRazorpay.ts` creates the 3 Razorpay Plans matching `PLAN_PRICES`.
    - **Required secrets** (user must provide before going live): `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `RAZORPAY_PLAN_ID_MONTHLY`, `RAZORPAY_PLAN_ID_SIX_MONTH`, `RAZORPAY_PLAN_ID_YEARLY`, plus client-side public keys `VITE_RAZORPAY_KEY_ID` (web) and `EXPO_PUBLIC_RAZORPAY_KEY_ID` (mobile). See `docs/android-internal-testing.md` for the dashboard + webhook setup.
  - **Access control:** all `/routines/*` endpoints (`generate`, `generate-ai`, `check`, `GET/PATCH/DELETE /:id`, `partial-regenerate`) require auth and verify ownership via join `routines → children.userId`; cross-tenant access returns 404 to avoid existence disclosure
  - Web: `useSubscription()` hook, `<PaywallProvider>` + `<PaywallModal>` + `<SubscriptionEventBridge>` listening to `amynest:open-paywall` / `amynest:refresh-subscription` window events; `/pricing` route; assistant + ai-coach handle 402 by opening paywall
  - Mobile: `useSubscriptionStore` (Zustand), `useSubscription()` hook, `<PremiumLock>`, `<AiQuotaBanner>`, `app/paywall.tsx` sheet with plan cards + trial CTA + checkout
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

## Reels App (artifacts/reels)

Standalone YouTube Shorts / Instagram Reels-style vertical video player that streams from a Google Drive folder.

- **Preview path**: `/reels/`
- **Folder ID**: `1rZqwBYoSIxnDIXBO4XvIqN5b4UBnbQD3`
- **Backend routes** (added to api-server, no auth required):
  - `GET /api/reels/videos?offset=0&batch=5` — returns paginated randomized video list
  - `GET /api/reels/stream/:fileId` — streams video from Google Drive (handles Range requests)
- **Frontend**: React, full-screen scroll-snap feed, IntersectionObserver autoplay, mute-by-default, lazy loading in batches of 5
- **Video cache**: In-memory, 10-minute TTL; shuffled once on first load; handles 3000+ videos

## AmyNest Mobile App (artifacts/amynest-mobile)

Expo React Native app (iOS + Android) mirroring the web product.

- **Preview path**: `/amynest-mobile/`
- **Bundle ID**: `com.amynest.ai` (iOS + Android)
- **Auth**: `@clerk/clerk-expo` with `expo-secure-store` token cache
- **Navigation**: 5-tab Expo Router — Home, Children, Routines, Coach, Profile
- **Theme**: Indigo/purple (`#6366F1` primary, `#A855F7` accent, `#F8F7FF` background)
- **Fonts**: `@expo-google-fonts/inter` (400/500/600/700)
- **API**: connects to existing Express API server via `EXPO_PUBLIC_DOMAIN`; uses `setBaseUrl` + `setAuthTokenGetter` from `@workspace/api-client-react`
- **Screens**:
  - `app/sign-in.tsx`, `app/sign-up.tsx` — Clerk email auth
  - `app/onboarding.tsx` — Amy chat-style onboarding (child profiles + parent info)
  - `app/(tabs)/index.tsx` — Home dashboard with today's timeline + quick actions
  - `app/(tabs)/children.tsx` — Children list + `app/children/[id].tsx` detail/edit + `app/children/new.tsx` add
  - `app/(tabs)/routines.tsx` — Calendar/List view toggle, week-grid navigator with day cells (today/has-routine/weekend states + completion bars), child filter chips, gradient Generate CTA, "This Week's Routines" inline list, full list view with progress bars (mirrors web `routines/index.tsx` pixel-parity) + `app/routines/[id].tsx` detail
  - `app/(tabs)/coach.tsx` — Full 4-phase Amy Coach (mirrors web `ai-coach.tsx`): 6 categorized goal grid + search + sub-category goal picker (29 goals w/ gradient cards), 5-question flow with gradient progress bar, violet→pink loading screen, horizontal swipeable Win-card pager (12 wins) with progress dots, plan header + ROOT CAUSE + WHY THIS WORKS + DO THIS + REAL EXAMPLE + MISTAKE TO AVOID + MICRO-TASK + duration chip + science reference, yes/somewhat/no feedback with frozen-denominator progress %, adaptive extension (3 fresh wins on "no"), Share API, haptics throughout
  - `app/(tabs)/profile.tsx` — Full parent profile (mirrors web `parent-profile.tsx`): avatar with camera upload (expo-image-picker → Clerk `setProfileImage`), Personal Info (name/role/gender/mobile), Work Schedule (work type + start/end times), Free/Available Slots (add/remove HH:MM ranges), Food Preferences (diet type + allergies textarea), Save + Sign Out
- **Key hooks**: `hooks/useAuthFetch.ts`, `hooks/useColors.ts`
- **Constants**: `constants/colors.ts` — AmyNest design tokens

## Environment Variables

- `AI_INTEGRATIONS_OPENAI_BASE_URL` — auto-set by Replit AI Integrations
- `AI_INTEGRATIONS_OPENAI_API_KEY` — auto-set by Replit AI Integrations
- `DATABASE_URL` — auto-set by Replit database
- `GOOGLE_API_KEY` — required for Reels app; Google Drive API key (add via Secrets tab)
- `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` — Clerk publishable key for mobile app (same as `VITE_CLERK_PUBLISHABLE_KEY`)
