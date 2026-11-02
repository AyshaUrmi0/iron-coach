# Iron Coach

A gym motivation web app: Coach Iron roasts you when you skip the gym, and your 3D avatar's
muscles grow with every selfie check-in and shrink when you slack off.

## Start here

1. Unzip this folder and open a terminal inside it.
2. Start a local MongoDB with Docker:
   ```bash
   docker run -d --name iron-mongo -p 27017:27017 mongo:7
   ```
   (Already created it before? Use `docker start iron-mongo` instead.)
3. Run `git init`, then start Claude Code by typing `claude`.
4. Tell Claude Code: **"Read CLAUDE.md and docs/DESIGN.md, then do Step 1 from docs/BUILD_PLAN.md"**.
5. After each step, check it in the browser, commit, and ask for the next step.

## Files

- `CLAUDE.md`: project rules that Claude Code reads automatically
- `docs/DESIGN.md`: the full design (rules, coach, screens, avatar, API, roadmap)
- `docs/BUILD_PLAN.md`: the 10 build steps for v1
