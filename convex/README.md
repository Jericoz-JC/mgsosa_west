# Convex setup

The frontend automatically uses Convex when `NEXT_PUBLIC_CONVEX_URL` is set and falls back to synchronized local demo state when it is not.

## One-time setup

1. Run `pnpm convex dev` and complete browser authorization. This links the deployment, pushes the functions in this directory, and writes the development URL into `.env.local`.
2. Set the Game Master credential: `pnpm convex env set HOST_PIN <game-master-pin>`.
3. Seed the event, teams, rooms, and curated 30-clue Jeopardy board: `pnpm convex run seed:event '{"hostPin":"<game-master-pin>"}'`.
4. Start the app with `pnpm dev`. `/host` asks for the Game Master PIN; participants join at `/` with event code `WEST26`.

Only the Game Master uses a PIN. The Game Master console issues short-lived, revocable, room-scoped private links for volunteers. The backend stores only a SHA-256 hash of each bearer token, and a room-host link can operate only its assigned room.

## Deploying to Vercel

This repository uses an explicit backend-first release so a frontend build cannot get ahead of its Convex functions:

1. Deploy and verify the Convex functions with `pnpm convex deploy`.
2. Set the production Game Master credential with `pnpm convex env set HOST_PIN <game-master-pin> --prod` and seed once with `pnpm convex run seed:event '{"hostPin":"<game-master-pin>"}' --prod`.
3. In Vercel Production, set `NEXT_PUBLIC_CONVEX_URL` to the production Convex URL and `NEXT_PUBLIC_EVENT_CODE` to `WEST26`.
4. In Vercel Preview, use a seeded development Convex URL so testing cannot alter production.
5. Deploy Vercel only after the matching Convex functions are live.

The repository preserves the organized 217-item source inventory in `data/holy-qurbana-source-bank.json`. It is review material, not imported directly into the live board: 43 items still need splitting, 72 need canonical answers, and all entries remain pending MGSOSA West content approval.

Participant room codes are temporary 4–6 digit numeric identifiers. They join a room session and never act as staff credentials.
