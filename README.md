# MGSOSA West Game Console

An online event console for MGSOSA West game nights: lightweight participant joining, rotation guidance, room-host tools, realtime Jeopardy buzzing, scoring, and a dedicated screen-share display.

## Stack

- Next.js + TypeScript
- Convex for synchronized game state
- Vitest for typed domain and UI tests
- MGSOSA West-owned visual assets

## Local development

```bash
pnpm install
pnpm dev
```

Copy `.env.example` to `.env.local`. When `NEXT_PUBLIC_CONVEX_URL` is empty the interface runs on a local demonstration state so the role pathways can be reviewed without a backend. To connect the hosted realtime backend, follow [convex/README.md](convex/README.md) — running `pnpm convex dev` fills in `NEXT_PUBLIC_CONVEX_URL` automatically.

## Deploying to Vercel

See [convex/README.md](convex/README.md): add a `CONVEX_DEPLOY_KEY` environment variable in Vercel and set the build command to `npx convex deploy --cmd 'pnpm build'`, then set `HOST_PIN` and seed the production deployment once.

## Roles

- Participant: joins with event code, name, and church; follows rotations and uses the Jeopardy buzzer.
- Room Admin: runs an assigned breakout room and reports results.
- Game Master: controls the event timeline, Jeopardy board, scores, and shared display.
- Display: read-only screen-share surface with no private information.
