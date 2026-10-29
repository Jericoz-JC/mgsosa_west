# Set up a new event

There are two kinds of events. Every event gets a public page. Game nights also get a Game Mode entry.

## 1. Public event page

Add an entry to `siteEvents` in `lib/site/events.ts`:

- `slug` becomes the URL: `/events/<slug>`.
- `startDate` (and `endDate` for multi-day events) controls Upcoming vs Past. An event stays upcoming through its last day, in Pacific time.
- `status`: `"proposed"` shows a "Date proposed" tag until the regional team votes on the date. Switch it to `"confirmed"` once it's decided. Use `"recurring"` for things like the monthly Bible study.
- Optional: `theme`, `highlights`, `schedule`, `cta`, and `conferenceSlug`, which links the page to its Ask the Clergy filter.

For a conference, also add it to `conferences` in `lib/qa/conferences.ts` so questions can be tagged with it and filtered.

## 2. Game Mode (game nights only)

1. Add an entry to `gameEvents` in `lib/game/event-config.ts` with a new uppercase `code` (for example `SPRING27`), the run of show, and the breakout `rooms` to seed. Each room's `game` must be a breakout game id from `lib/games/registry.ts`, and room codes must be unique 4–6 digit numbers.
2. Set `gameEventCode` on the matching public event page and `eventSlug` on the config, so the two link to each other.
3. Seed it in Convex. It's safe to re-run, and scores and participants are kept:

   ```bash
   pnpm exec convex run seed:event '{"hostPin":"<game-master-pin>","eventCode":"SPRING27"}' --prod
   ```

4. In Vercel, set `NEXT_PUBLIC_EVENT_CODE=SPRING27` and redeploy. Game Mode, the Game Master console, and the display all switch to the new event. Previous events stay in the database.
5. Run `pnpm test`. The config tests check room games, codes, and links between pages.

`DEFAULT_EVENT_CODE` in `lib/game/event-config.ts` is used when `NEXT_PUBLIC_EVENT_CODE` is unset, such as in local demo mode.

## Current events

| Code | Event | Status |
| --- | --- | --- |
| `WEST26` | Summer Game Night, July 11, 2026 | Past |
| `WINTER27` | Winter Game Night, Saturday, January 9, 2027, 5:30–7:30 PM PT | Proposed, waiting on the team's vote. Debuts Bible Who Am I? |
