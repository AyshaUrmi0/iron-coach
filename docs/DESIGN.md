# Iron Coach: design

Iron Coach is a web app with two characters: an avatar of you that grows muscle when you train,
and a loud, savage coach, Coach Iron, who roasts you when you skip.

You prove each gym visit with a live selfie and say which muscles you trained, and the avatar's
body grows. Miss your weekly target and the coach starts roasting, getting harsher every
day you skip, while the avatar slowly loses its gains.

## Decisions

| Topic | Decision |
| --- | --- |
| Name | Iron Coach |
| Platform | Web app first (works in phone browsers too) |
| Gym proof | Live selfie from the camera, not an upload |
| Avatar | 2D frames cut from our own video, one male body for now. Each user still picks a body type, ready for female art later |
| Roast language | The user picks English, Banglish or Bangla |
| Roast strength | Full volume for everyone, aimed at laziness and excuses |
| Users | Me and my friends; private accounts, no social features yet |
| Coach | An original character, "Coach Iron", in the old-school hardcore gym style, not any real YouTuber |

## The daily loop

Every day ends one of three ways:
1. **Checked in:** a selfie plus the muscles trained. Those muscles grow and the coach hypes you.
2. **Allowed rest day:** a calm warning, and no decay.
3. **Skipped:** skip days +1, every muscle −2 (never below 10), and the coach roasts harder.

## Rules

The avatar grows faster than it shrinks: one workout is worth about three skipped days for the
muscles you trained.

| Weekly goal | Rest days allowed between sessions |
| --- | --- |
| 2 days | 3 |
| 3 days | 2 |
| 4, 5 or 6 days | 1 |
| 7 days | 0 |

- **Skip days** = days since the last check-in − 1 − allowed rest days. 0 means you're on track.
- **Streak** = check-ins in a row that stayed within the allowed rest.
- **Muscles:** chest, back, shoulders, arms, core, legs. Scores run 0–100. They start from the body the user picks in onboarding: heavy 10, lean 20 (the default) or muscular 60.

| Event | Effect |
| --- | --- |
| Check-in (max one per day) | +6 to each trained group, +1 to all others, capped at 100 |
| Each skip day | −2 to every group, never below 10 |
| Streak of 7 check-ins | +3 bonus to every group, plus a coach celebration |

**Titles by average score:** Noodle (under 25), Gym Rookie (25–44), Lifter (45–64), Beast (65–84), Iron Legend (85+).

In v1 the whole state is recalculated from the check-in history when the app loads, using one
pure function. That makes it easy to test, and no scheduled job is needed.

## The coach

| Skip days | Mood | Example (English) |
| --- | --- | --- |
| 0, checked in today | Hype | "THAT'S what I'm talking about, {name}! {muscle} day DONE. Again tomorrow." |
| 0, rest day | Calm warning | "Rest day. Enjoy it. Tomorrow your ass is back under that bar." |
| 1 | Annoyed | "One day off. ONE. Don't you dare make it two." |
| 2 | Angry | "Two days, {name}? Your dumbbells are collecting dust and your excuses are collecting interest." |
| 3–4 | Savage | "{days} days. Your biceps filed a missing person report. Get your lazy ass up." |
| 5+ | Nuclear | "I'm not even mad anymore. I'm DISAPPOINTED. Your muscles packed their bags. Go win them back." |
| First check-in after skipping | Comeback | "Look who crawled back. Good. Now earn it." |

The same energy in the other languages:
- Banglish: "Bhai, gym er membership ki shudhu wallet e rakhar jonno kinchili? {days} din hoye gelo!"
- Bangla: "আজও জিম মিস? তোর মাসলগুলো রাগ করে বাড়ি চলে গেছে।"

**On demand:** the home screen's "I'm procrastinating" button shows a fresh insult from a separate
set of 20 lines, on any day the user hasn't checked in yet.

**No word filter.** The lines are hand-written and stay on laziness and excuses, so the bank has no
comments on weight, body shape or looks; no slurs, and nothing about religion, gender, caste or
appearance; nothing sexual, no threats, and no jokes about death or self-harm. Swearing is allowed.

**v1:** a roast bank in `roasts.ts`, 8 lines per level per language, picked at random.
**AI roasts (off for now):** the code can ask Groq, then OpenRouter, but real replies included a violent threat and body insults in testing, and nothing filters them. It stays off unless `AI_ROASTS_ENABLED=true`, so the coach only uses the bank.

## Screens

| Screen | What's on it |
| --- | --- |
| Sign up / log in | Name, email, password. A dark gym look with one loud accent colour |
| Onboarding (4 steps) | 1. Pick a male or female body. 2. Starting shape. 3. Weekly goal chips (2–7). 4. Meet Coach Iron |
| Home | The avatar in the centre (idle breathing). A coach speech bubble typing out today's roast, which shakes on savage and nuclear. Streak flame, skip-day counter, title badge, six muscle bars, today's protein bar, and a huge CHECK IN button |
| Check-in | A full-screen live camera, then snap (with retake), pick muscles and submit. Then the avatar flexes, its body grows, "+6 CHEST" numbers fly up, and the coach hypes you |
| Meals | Log a meal with its protein in whole grams, or tap a saved food. Today's bar against the goal, today's meals, and delete |
| History | A month calendar with a flame on each gym day and the protein total on each day with meals; tap a day to see its selfie, what was trained and what was eaten |
| Settings | Change name, body type, starting shape, weekly goal or protein goal; log out. Roast language returns when there's more than English |

**Protein:** meals only track protein, against a goal the user sets (100 g by default). They never affect the muscle scores or the avatar. From 6pm the coach gets on your case if you're short, and hypes you once the goal is hit.

**Look and feel:** dark, loud and over the top, like a hardcore gym poster. When you're behind, the
home screen gets visibly worse: it turns redder, the avatar darkens and slumps and the coach bubble shakes.

## Avatar

Built from our own 10-second video, kept in `docs/avatar-reference/`. It runs from muscular (3.8s)
to lean (5.7s to 7.2s) to heavy (8.6s). 25 frames from it, with the black background removed, are in
`apps/web/public/avatar/`, numbered from heaviest (0) through lean (10) to most muscular (24).

The body follows the average of the six muscle scores (`avatarFrame` in `packages/core`):

| Average score | Body |
| --- | --- |
| 100 down to 20 | Muscular down to lean, frames 24 to 10 |
| 20 down to 15 | Lean, frame 10 |
| Under 15 | Heavy, frames 3 to 0. Frames 4 to 9 are only passed through, because the trousers are see-through there |

- **Individual muscles:** only the bars show them. The art is one whole body, so a single muscle can't grow alone.
- **Smooth changes:** the body steps through the frames toward its score instead of jumping.
- **Animations:** idle breathing, a flex after a check-in, darker and leaning at 3+ skip days, and a shiver at nuclear.
- **Limits of 2D:** no drag to rotate and no head-down slump pose.
- **Dev page:** `/avatar-lab` tries every body size and mood. It doesn't exist in production.

## API

| Method | Path | Does |
| --- | --- | --- |
| POST | /api/auth/register, /api/auth/login, /api/auth/logout | Account and session |
| GET / PATCH | /api/me | Read or change name, body type, starting shape, weekly goal, protein goal, language |
| POST | /api/checkins | Upload selfie + muscles. A second check-in on the same day gets a 409 |
| GET | /api/checkins?month=YYYY-MM | Check-ins for the calendar |
| GET | /api/meals?month=YYYY-MM | Meals for the calendar and today's total |
| GET | /api/meals/foods | Saved foods: everything logged before, newest first, with its latest protein |
| POST | /api/meals | Log a meal for today. Limited to 30 a day |
| DELETE | /api/meals/:id | Delete one of your own meals |
| GET | /api/state | Muscles, streak, skip days, title, roast level and today's roast |
| GET | /api/selfies/:id | Returns the selfie to its owner only |

## Roadmap

- **v1 (a few hours):** rules + roasts, API, avatar, screens, selfie check-in, history.
- **v2:** AI roasts (Gemini), coach voice (text-to-speech), browser push notifications, an AI check that the selfie looks like a gym.
- **v3, DevOps:** Docker Compose (web, api, mongo, redis), a nightly BullMQ worker, GitHub Actions CI/CD, HTTPS deployment, object storage for selfies.
- **v4:** a real GLB body with shape keys, friends and a leaderboard, step counting in a mobile version.
