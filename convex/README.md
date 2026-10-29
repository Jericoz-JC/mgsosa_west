# Convex setup

The frontend automatically uses Convex when `NEXT_PUBLIC_CONVEX_URL` is set and falls back to synchronized local demo state when it is not.

## One-time setup

1. Run `pnpm convex dev` and complete browser authorization. This links the deployment, pushes the functions in this directory, and writes the development URL into `.env.local`.
2. Set the Ask the Clergy moderator PIN: `pnpm convex env set QA_ADMIN_PIN <moderator-pin>`.
3. When a game night is coming up, set the Game Master PIN with `pnpm convex env set HOST_PIN <game-master-pin>`. Then seed and activate the event from `lib/game/event-config.ts` with `pnpm convex run seed:event '{"eventCode":"WINTER27"}'`. Turn Game Mode off afterward with `pnpm convex run seed:endEvent`.
4. Start the app with `pnpm dev`. Participants join at `/game` with the live event's code; `/host` asks for the Game Master PIN.

Staff PINs exist only as Convex environment variables. Signing in exchanges a PIN for a 12-hour session token, stored as a SHA-256 hash in `staffSessions`. The browser keeps the token, never the PIN, and 10 failed attempts in 15 minutes lock sign-in for that role. Seeding and activating events are internal functions, callable only from the CLI or dashboard.

Only the Game Master uses a PIN. The Game Master console issues short-lived, revocable, room-scoped private links for volunteers. The backend stores only a SHA-256 hash of each bearer token, and a room-host link can operate only its assigned room.

## Deploying to Vercel

This repository uses an explicit backend-first release so a frontend build cannot get ahead of its Convex functions:

1. Deploy and verify the Convex functions with `pnpm convex deploy`.
2. Set `QA_ADMIN_PIN` with `pnpm convex env set QA_ADMIN_PIN --prod`. No event or Game Master PIN is needed to launch; set `HOST_PIN` and run `seed:event` with `--prod` when there's a game night.
3. In Vercel Production, set `NEXT_PUBLIC_CONVEX_URL` to the production Convex URL. `NEXT_PUBLIC_EVENT_CODE` is no longer used and can be removed.
4. In Vercel Preview, use a seeded development Convex URL so testing cannot alter production.
5. Deploy Vercel only after the matching Convex functions are live.

The repository preserves the organized 217-item source inventory in `data/holy-qurbana-source-bank.json`. It is review material, not imported directly into the live board: 43 items still need splitting, 72 need canonical answers, and all entries remain pending MGSOSA West content approval.

Participant room codes are temporary 4–6 digit numeric identifiers. They join a room session and never act as staff credentials.
