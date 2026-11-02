# Iron Coach v1: build plan

How to use this file: in Claude Code, type **"Do Step 1 from docs/BUILD_PLAN.md"**.
Check the result in the browser, commit, then ask for the next step. Do one step at a time.

---

## Step 1: Scaffold the monorepo

Set up the pnpm monorepo exactly as described in CLAUDE.md: apps/web (Vite React TS with Tailwind v4),
apps/api (Express + TS, run with tsx in dev), packages/core (TS + Vitest).
Root scripts: dev (runs web and api together), test, typecheck, build.
Vite should proxy /api to the API on port 4000. Add .gitignore (node_modules, dist, .env, uploads/).
Add apps/api/.env.example with MONGO_URL, JWT_SECRET, PORT.
Make sure `pnpm dev` starts both, and tell me the URLs.

## Step 2: The rules engine (the most important code)

In packages/core, implement computeState(checkins, weeklyGoal, today) following the rules in CLAUDE.md
exactly. Return { muscles, average, title, streak, skipDays, roastLevel, checkedInToday }.
Dates are "YYYY-MM-DD" strings; write small date helpers, with no date library.
Write thorough Vitest tests: new user, perfect week, one rest day, skipping 1/2/4/8 days, the floor at 10,
the cap at 100, the 7-streak bonus, a comeback after skipping, and every weeklyGoal value.
Run the tests and show me the results.

## Step 3: Coach Iron's roast bank

Create packages/core/src/roasts.ts: a roast bank for every roast level (hype, rest, annoyed, angry,
savage, nuclear, comeback) in 3 languages (en, banglish, bn), 6 lines each, using {name}, {days} and
{muscle} templates. Follow the Coach Iron rules in CLAUDE.md strictly: swearing is fine, but never body,
weight or looks, family, slurs or the other banned topics. Make it funny and escalating: annoyed is
mild, nuclear is dramatic.
Add pickRoast(level, language, vars), plus a test that every template fills correctly and that no line
contains a word from a small banned-words list.
(Afterwards, I will read the roasts myself and edit any line I don't like.)

## Step 4: API (auth and profile)

Build the auth part of apps/api: a Mongoose User model, Zod validation, register/login/logout with
bcrypt and a JWT in an HttpOnly, SameSite=Lax cookie, an auth middleware, and GET/PATCH /api/me
(name, bodyType, weeklyGoal, language). Return clear JSON errors.
Test it with curl and show me the output.

## Step 5: API (check-ins and state)

- POST /api/checkins: multipart with a "selfie" image (multer, max 5 MB, jpeg/png/webp only) and
  "muscles" (an array of the 6 group names, at least 1). The server sets the date in the user's timezone.
  A second check-in on the same day gets a 409. Save files to apps/api/uploads/<userId>/ with a random filename.
- GET /api/checkins?month=YYYY-MM for the calendar.
- GET /api/selfies/:checkinId: only the owner can fetch it.
- GET /api/state: loads the user's check-ins, runs computeState and pickRoast, and returns both.
- DEV ONLY (NODE_ENV !== production): GET /api/state?today=YYYY-MM-DD to fake the date, and
  POST /api/dev/seed to create fake check-ins, so I can test skip days and roasts.
Test it all with curl.

## Step 6: Frontend shell and auth screens

Set up apps/web: React Router routes (/login, /register, /onboarding, /, /checkin, /history, /settings),
an API client with TanStack Query, and a protected-route wrapper that sends logged-out users to /login.
Build the login and register pages in the dark, loud gym style from CLAUDE.md.
Make sure I can register, log in and log out in the browser.

## Step 7: The 3D avatar (build it in a playground first)

Build apps/web/src/avatar/Avatar.tsx with @react-three/fiber and drei, as a procedural, stylised
clay-toy body made of capsules and spheres. Props: bodyType ("male"|"female"), muscles (the 6 scores),
mood ("hype"|"normal"|"slump"|"nuclear"), flexKey (number).
- Each muscle score scales its body parts with scale = 0.75 + (score / 100) * 0.6:
  chest → pec shapes, shoulders → deltoid spheres, arms → upper arm + forearm thickness,
  back → torso width, core → six ab blocks (visible above 50), legs → thigh + calf thickness.
- Male base: wider shoulders, narrow hips, slightly taller. Female base: narrower shoulders, a defined
  waist, wider hips, a softer rounded chest shape. Keep it tasteful.
- Sizes ease toward their targets every frame (no jumping).
- Animations: idle breathing; a flex pose when flexKey changes (arms up, biceps pulse);
  a slumped, head-down pose for "slump"; a small shiver for "nuclear".
- A toon material, soft lighting, a slowly rotating round platform, and OrbitControls (no zoom).
Also make a dev-only page /avatar-lab with sliders for every muscle, body type and mood, plus a
"Flex" button, so I can tune the look.
(Afterwards, I will spend time in /avatar-lab asking for visual fixes before moving on.)

## Step 8: Onboarding and home screen

Build /onboarding (4 steps with Motion transitions): 1) pick a body type, showing two small rotating
avatar previews; 2) the weekly goal as big chips (2–7); 3) the roast language; 4) "Meet Coach Iron":
a dramatic intro line, then go home. Save the choices with PATCH /api/me.

Build the home screen (/): the avatar large in the centre, using /api/state for muscles and mood
(hype if checked in today, slump if skipDays >= 3, nuclear if 5+). At the top, a coach speech bubble
that types the roast letter by letter, with a screen shake on savage and nuclear. Show the streak flame,
the skip-day counter, the title badge, six animated muscle bars and a huge CHECK IN button.
The more skip days, the redder and darker the screen gets.

## Step 9: Selfie check-in

Build /checkin: open the front camera with getUserMedia (no file upload option), show the live video
full-screen with a big shutter button, then a preview with Retake, then six muscle-group toggle chips
and Submit. POST to /api/checkins. On success, go home and play a celebration: the avatar flexes
(bump flexKey), the trained muscles visibly grow, "+6 CHEST" style numbers fly up with Motion, and the
coach shows a hype line. Handle a denied camera permission and the 409 "already checked in today"
with funny coach messages.

## Step 10: History, settings, and testing everything

Build /history: a month calendar with a fire dot on every check-in day; clicking a day shows that selfie
(from /api/selfies/:id) and the muscles trained. Build /settings to change the body type, goal and
language, and to log out.

Then test the whole app: use the dev seed endpoint and ?today= to simulate a perfect week, a 2-day skip,
a 4-day skip and an 8-day skip. Check that the roasts, the avatar's mood and the muscle scores match the
rules. Run pnpm test and pnpm typecheck, fix anything broken, and commit.

---

## Tips

- Keep `pnpm dev` running and the browser open, so you see every change.
- If something breaks, paste the exact error into Claude Code and say what you expected.
- Commit after every step, e.g. `git add -A && git commit -m "step 5: checkins api"`.
- Steps 2 and 7 matter most. Correct rules and a fun avatar make the app, so don't rush them.
