# Iron Coach

A gym motivation web app. Coach Iron roasts you when you skip the gym, and your avatar's body grows
with every selfie check-in and shrinks when you slack off.

**Language warning:** the coach swears a lot. That's the point.

## Features

- **Selfie check-ins:** prove each gym visit with a live camera photo and pick the muscles you trained. One per day.
- **Avatar:** pick a starting shape (heavy, lean or muscular). Your body then changes with your average muscle score.
- **Coach Iron:** the roasts get harsher with every skip day, and he hypes you when you show up.
- **"I'm procrastinating" button:** ask for an insult when you're putting the gym off.
- **Protein tracking:** log meals, tap saved foods to log them again, and track a daily protein goal.
- **History:** a calendar of your check-ins, selfies, meals and protein totals.
- **Demo mode:** try it without an account. Each visitor gets a private account that's deleted after 7 days.

Selfies are private: only their owner can fetch them.

## Tech stack

A pnpm monorepo:

| Folder | What it is | Built with |
| --- | --- | --- |
| `apps/web` | The website | React, Vite, TypeScript, Tailwind v4, React Router, TanStack Query, Motion |
| `apps/api` | The API | Node, Express, TypeScript, Mongoose, Zod, JWT in an HttpOnly cookie, multer |
| `packages/core` | Shared rules and coach lines | Pure TypeScript, tested with Vitest |

Data is stored in MongoDB. When deployed on Vercel, selfies go in private Vercel Blob storage.

## Run it locally

You need Node 24, pnpm and Docker.

1. Install the dependencies:
   ```bash
   pnpm install
   ```
2. Start MongoDB:
   ```bash
   docker run -d --name iron-mongo -p 27017:27017 mongo:7
   ```
   If you've created it before, use `docker start iron-mongo` instead.
3. Create the API's settings file:
   ```bash
   cp apps/api/.env.example apps/api/.env
   ```
4. Generate a secret, and paste it after `JWT_SECRET=` in `apps/api/.env`:
   ```bash
   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
   ```
5. Start the website and the API:
   ```bash
   pnpm dev
   ```

Open http://localhost:5173. The API runs on port 4000.

## Checks

Run these from the project root:

```bash
pnpm typecheck
pnpm test
pnpm build
```

The API also has curl checks. They need `pnpm dev` and the `iron-mongo` container running:

```bash
bash apps/api/scripts/smoke-auth.sh
bash apps/api/scripts/smoke-checkins.sh
bash apps/api/scripts/smoke-demo.sh
bash apps/api/scripts/smoke-meals.sh
```

GitHub Actions runs all of these on every pull request.

## Deployment

`vercel.json` deploys the website and the API as two services on Vercel. It also runs a daily job that
deletes expired demo accounts. See `apps/api/.env.example` for the settings it needs.

## More docs

- [`docs/DESIGN.md`](docs/DESIGN.md): the full design, including rules, coach, screens, avatar, API and roadmap
- [`docs/BUILD_PLAN.md`](docs/BUILD_PLAN.md): the steps the app was built in
- [`CLAUDE.md`](CLAUDE.md): project rules for Claude Code
