# Iron Coach: project rules

Web app: a savage gym coach roasts users who skip the gym, and a 3D avatar's muscles grow with
selfie check-ins and shrink when they skip. Users: me and my friends. The UI is in English.

Full design: docs/DESIGN.md. Build steps: docs/BUILD_PLAN.md. Only do the step I ask for.

## Stack
pnpm monorepo:
- apps/web: React + Vite + TypeScript + Tailwind v4 + React Router + TanStack Query + Motion
  + @react-three/fiber + @react-three/drei
- apps/api: Node + Express + TypeScript + Mongoose + Zod + bcrypt + JWT in an HttpOnly cookie + multer
- packages/core: pure TypeScript rules and roasts, tested with Vitest

MongoDB: mongodb://localhost:27017/iron-coach. Timezone for "today": Asia/Dhaka.

## Rules (packages/core)
- weeklyGoal is 2–7. Allowed rest days between sessions: 2→3, 3→2, 4/5/6→1, 7→0.
- skipDays = days since the last check-in − 1 − allowedRest (min 0). No check-ins yet → 0.
- streak = consecutive check-ins whose gap stayed within the allowed rest.
- 6 muscle groups: chest, back, shoulders, arms, core, legs. Scores run 0–100 and start at 20.
- Check-in (max 1 per day): +6 to trained groups, +1 to the others, capped at 100.
- Each skip day (between check-ins and up to today): −2 to all groups, never below 10.
- Every 7-check-in streak: +3 to all groups.
- Titles by average score: <25 Noodle, 25–44 Gym Rookie, 45–64 Lifter, 65–84 Beast, 85+ Iron Legend.
- Roast level: checked in today → hype; skipDays 0 → rest; 1 → annoyed; 2 → angry;
  3–4 → savage; 5+ → nuclear; first check-in after skipping → comeback.
- State is recomputed from check-in history with computeState(checkins, weeklyGoal, today).

## Coach Iron (an original character, not any real person)
Loud and swears (damn, hell, ass, bullshit and "lazy ass" are fine), at full volume for everyone.
He roasts EFFORT and EXCUSES only. Never: weight, body or looks; family insults (no maa-bon
galagali); slurs; religion, gender or caste; sexual content; threats; death or self-harm jokes.
Languages: en only for now (banglish and bn later). Templates use {name}, {days}, {muscle}.

## Data
User: { name, email, passwordHash, bodyType: "male"|"female", weeklyGoal, language, timezone }
Check-in: { userId, date "YYYY-MM-DD" (unique per user), takenAt, muscles[], selfiePath }
Selfies are private: only the owner can fetch them. Camera capture only, no file picker.

## Style
A dark hardcore-gym look: near-black background, bold condensed headings, one loud accent
(electric red #ff2d2d) plus warning yellow #ffd60a. Over-the-top and poster-like.

## Working rules
- Run pnpm typecheck and pnpm test after every change and fix anything that fails.
- Keep changes small and explain what you changed in plain, simple English.
- Never commit .env files or the uploads/ folder.
