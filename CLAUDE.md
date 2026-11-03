# Iron Coach: project rules

Web app: a savage gym coach roasts users who skip the gym, and an avatar's body grows with
selfie check-ins and shrinks when they skip. Users: me and my friends. The UI is in English.

Full design: docs/DESIGN.md. Build steps: docs/BUILD_PLAN.md. Only do the step I ask for.

## Stack
pnpm monorepo:
- apps/web: React + Vite + TypeScript + Tailwind v4 + React Router + TanStack Query + Motion
- apps/api: Node + Express + TypeScript + Mongoose + Zod + bcrypt + JWT in an HttpOnly cookie + multer
- packages/core: pure TypeScript rules and roasts, tested with Vitest

MongoDB: mongodb://localhost:27017/iron-coach. Timezone for "today": Asia/Dhaka.

## Rules (packages/core)
- weeklyGoal is 2–7. Allowed rest days between sessions: 2→3, 3→2, 4/5/6→1, 7→0.
- skipDays = days since the last check-in − 1 − allowedRest (min 0). No check-ins yet → 0.
- streak = consecutive check-ins whose gap stayed within the allowed rest.
- 6 muscle groups: chest, back, shoulders, arms, core, legs. Scores run 0–100. They start from the body picked in onboarding: heavy 10, lean 20, muscular 60.
- Check-in (max 1 per day): +6 to trained groups, +1 to the others, capped at 100.
- Each skip day (between check-ins and up to today): −2 to all groups, never below 10.
- Every 7-check-in streak: +3 to all groups.
- Titles by average score: <25 Noodle, 25–44 Gym Rookie, 45–64 Lifter, 65–84 Beast, 85+ Iron Legend.
- Roast level: checked in today → hype; skipDays 0 → rest; 1 → annoyed; 2 → angry;
  3–4 → savage; 5+ → nuclear; first check-in after skipping → comeback.
- State is recomputed from check-in history with computeState(checkins, weeklyGoal, today).

## Coach Iron
Coach Iron is a foul-mouthed, screaming, old-school hardcore gym coach (an original character,
not any real person). He swears hard and constantly: fuck, fucking, shit, bullshit, damn, hell,
ass, lazy ass, dumbass, pathetic, useless, soft, weak, coward — all allowed, especially at
savage and nuclear level. So are piece of sh*t, a**hole, d**khead, b*stard, son of a b***h and
mother****er, written masked like this in the bank. He is brutal about LAZINESS, EXCUSES, SKIPPING and BROKEN PROMISES.
He mocks your excuses, your couch, your phone, your snooze button and your "I'll start Monday".
He makes you feel the shame of skipping, then dares you to prove him wrong.
When you DO show up, he hypes you up just as loud: you're a beast, a killer, unstoppable.
Putting the gym off? The home screen's "I'm procrastinating" button gets you a fresh insult on demand.
There is no word filter. The lines are hand-written and aim at laziness and excuses, so the bank has
no slurs; no insults about religion, race, gender, caste; no sexual insults; nothing on weight, body
shape or looks; nothing on death, suicide or self-harm ("kill yourself" etc.); no threats of real violence.
Languages: en only for now. The banglish and bn lines wait in the bank.

## Data
User: { name, email, passwordHash, bodyType: "male"|"female", startBody: "heavy"|"lean"|"muscular", weeklyGoal, language, timezone,
isDemo, demoExpiresAt }
Check-in: { userId, date "YYYY-MM-DD" (unique per user), takenAt, muscles[], selfiePath, isSample }
Selfies are private: only the owner can fetch them. Camera capture only, no file picker.
Stored in private Vercel Blob when deployed (BLOB_READ_WRITE_TOKEN set), on local disk otherwise.

## Demo mode
Anyone can explore without an account. Each visitor gets their own temporary account, never a
shared one, deleted after 7 days. It starts with sample check-ins. Demo photos are never stored.
Signing up from a demo keeps the same account and the visitor's own check-ins; samples are removed.

## Style
A dark hardcore-gym look: near-black background, bold condensed headings, one loud accent
(electric red #ff2d2d) plus warning yellow #ffd60a. Over-the-top and poster-like.

## Working rules
- Run pnpm typecheck and pnpm test after every change and fix anything that fails.
- Keep changes small and explain what you changed in plain, simple English.
- Never commit .env files or the uploads/ folder.
