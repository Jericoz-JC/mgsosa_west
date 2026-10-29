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
3. Deploy, then seed and activate the event from the Convex CLI. It's safe to re-run, and scores and participants are kept:

   ```bash
   pnpm exec convex run seed:event '{"eventCode":"SPRING27"}' --prod
   ```

   Seeding is an internal Convex function, so only someone with deployment access can run it. No PIN is passed, and nothing in a browser can call it. Game Mode, the Game Master console, and the display switch to the new event immediately, with no Vercel change or redeploy. Add `"activate": false` to prepare an event without making it live yet.
4. After the event, turn Game Mode off. `/game` then shows "No game night is live right now" with a link to the next event:

   ```bash
   pnpm exec convex run seed:endEvent --prod
   ```

5. Run `pnpm test`. The config tests check room games, codes, and links between pages.

The Game Master PIN (`HOST_PIN`) only needs to be set before the event night. Without it, sign-in on `/host` says Game Master access isn't set up yet. `DEMO_EVENT_CODE` in `lib/game/event-config.ts` is the event local demo mode previews.

## Current events

| Code | Event | Status |
| --- | --- | --- |
| `WEST26` | Summer Game Night, July 11, 2026 | Past |
| `WINTER27` | Winter Game Night, Saturday, January 9, 2027, 5:30–7:30 PM PT | Proposed, waiting on the team's vote. Configured but not live until seeded. Debuts Bible Who Am I? |
