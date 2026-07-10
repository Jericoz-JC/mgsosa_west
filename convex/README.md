# Convex setup

The frontend runs with a synchronized local demo state until a Convex deployment is connected.

1. Run `pnpm convex dev` and complete the browser login.
2. Set the deployment secret with `pnpm convex env set HOST_PIN`.
3. Seed the event with `pnpm convex run seed:event '{"hostPin":"<your pin>"}'`.
4. Move the frontend provider from the local demo adapter to the generated Convex API hooks.

Participant room codes are temporary 4–6 digit numeric identifiers. Host authorization is separate and must never be represented by a room code.
