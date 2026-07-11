# MGSOSA West Game Console

An online event console for MGSOSA West game nights: lightweight participant joining, breakout-room guidance, room-host tools, realtime Jeopardy buzzing, scoring, and a dedicated screen-share display.

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

Copy `.env.example` to `.env.local`. When `NEXT_PUBLIC_CONVEX_URL` is empty, the interface runs on synchronized demo state. To connect the hosted realtime backend, follow [convex/README.md](convex/README.md); `pnpm convex dev` fills in the development URL automatically.

## Deploying to Vercel

The current release uses a backend-first deployment: deploy and verify Convex functions, then build Vercel against that deployment with `NEXT_PUBLIC_CONVEX_URL` and `NEXT_PUBLIC_EVENT_CODE`. See [convex/README.md](convex/README.md) for the exact order.

## Roles

- Participant: joins with event code, name, and church; enters temporary breakout codes during rotations; uses the Jeopardy buzzer.
- Room Host: opens one private room-scoped link, runs the assigned activity, and reports the result.
- Game Master: controls the event timeline, volunteer links, Jeopardy board, scores, and shared display.
- Display: read-only screen-share surface with no private information.
