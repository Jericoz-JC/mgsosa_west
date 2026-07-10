# Convex setup

The frontend automatically runs against Convex when `NEXT_PUBLIC_CONVEX_URL` is set, and falls back to a synchronized local demo state when it is not.

## One-time setup

1. Run `pnpm convex dev` (or `npx convex dev`) and complete the browser login. This creates/links the deployment, pushes the functions in this directory, and writes `NEXT_PUBLIC_CONVEX_URL` into `.env.local`.
2. Set two different staff credentials: `pnpm convex env set HOST_PIN <game-master-pin>` and `pnpm convex env set ROOM_PIN <room-staff-pin>`.
3. Seed the event, teams, rooms, and curated 30-clue Jeopardy board: `pnpm convex run seed:event '{"hostPin":"<game-master-pin>"}'`.
4. Start the app with `pnpm dev`. The host console (`/host`) will ask for the PIN; participants join at `/` with event code `WEST26`.

## Deploying to Vercel

1. In the Convex dashboard, create a production deploy key (Settings → Deploy keys) and add it to Vercel as `CONVEX_DEPLOY_KEY`.
2. Set the Vercel build command to `npx convex deploy --cmd 'pnpm build'`. This pushes the Convex functions and injects the production `NEXT_PUBLIC_CONVEX_URL` into the Next.js build.
3. Set both production credentials (`npx convex env set HOST_PIN <game-master-pin> --prod` and `npx convex env set ROOM_PIN <room-staff-pin> --prod`) and run the seed once (`npx convex run seed:event '{"hostPin":"<game-master-pin>"}' --prod`).

Game Master and room-staff authorization use separate deployment secrets. Room staff never receive the Game Master PIN or the Jeopardy answer feed.

The repository also preserves the organized 217-item source inventory in `data/holy-qurbana-source-bank.json`. It is review material, not imported directly into the live board: 43 items still need splitting, 72 need canonical answers, and all entries remain pending MGSOSA West content approval.

Participant room codes are temporary 4–6 digit numeric identifiers and never act as staff credentials.
