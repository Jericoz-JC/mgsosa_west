# Convex setup

The frontend automatically runs against Convex when `NEXT_PUBLIC_CONVEX_URL` is set, and falls back to a synchronized local demo state when it is not.

## One-time setup

1. Run `pnpm convex dev` (or `npx convex dev`) and complete the browser login. This creates/links the deployment, pushes the functions in this directory, and writes `NEXT_PUBLIC_CONVEX_URL` into `.env.local`.
2. Set the host PIN on the deployment: `pnpm convex env set HOST_PIN <your pin>`.
3. Seed the event, teams, rooms, and question bank: `pnpm convex run seed:event '{"hostPin":"<your pin>"}'`.
4. Start the app with `pnpm dev`. The host console (`/host`) will ask for the PIN; participants join at `/` with event code `WEST26`.

## Deploying to Vercel

1. In the Convex dashboard, create a production deploy key (Settings → Deploy keys) and add it to Vercel as `CONVEX_DEPLOY_KEY`.
2. Set the Vercel build command to `npx convex deploy --cmd 'pnpm build'`. This pushes the Convex functions and injects the production `NEXT_PUBLIC_CONVEX_URL` into the Next.js build.
3. Set `HOST_PIN` on the production deployment (`npx convex env set HOST_PIN <pin> --prod`) and run the seed once against production (`npx convex run seed:event '{"hostPin":"<pin>"}' --prod`).

Participant room codes are temporary 4–6 digit numeric identifiers. Host authorization is separate (the `HOST_PIN` deployment secret) and must never be represented by a room code.
