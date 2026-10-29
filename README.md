# MGSOSA West website + Game Mode

The website for MGSOSA West, the Western Region of the Mor Gregorios Syriac Orthodox Students Association. It has three parts:

- **Public site.** Home, About, Events, Conferences, Churches, and the Game library.
- **Ask the Clergy** (`/qa`). A moderated, forum-style conference Q&A. Anyone can ask, admins approve, and answers are published only after a priest, bishop, or guest speaker verifies them. Each answer shows either the clergy member's name or just their role ("Verified by a priest").
- **Game Mode** (`/game`). The live online game-night console: participant joining, breakout-room codes, room-host tools, realtime Jeopardy buzzing, scoring, and a screen-share display.

## Stack

- Next.js (App Router) + TypeScript
- Convex for realtime game state and the Q&A forum
- Vitest for domain and UI tests
- MGSOSA West-owned visual assets

## Project map

| Path | What lives there |
| --- | --- |
| `app/(site)/` | Public pages, wrapped in the site header and footer |
| `app/(site)/qa/` | Ask the Clergy forum and the `/qa/admin` moderator console |
| `app/(game)/` | Game Mode: `/game`, `/play`, `/room`, `/host/*`, `/display` |
| `lib/site/` | Site copy: organization info, parishes, events |
| `lib/qa/` | Conferences, topics, Q&A filters and validation (shared with Convex) |
| `lib/games/registry.ts` | The game library. Breakout games here run in Game Mode automatically |
| `lib/game/event-config.ts` | One entry per game night: event code, run of show, seeded rooms |
| `convex/` | Backend functions (`qa.ts`, `events.ts`, `rooms.ts`, `jeopardy.ts`, `seed.ts`) |

Guides: [set up a new event](docs/NEW-EVENT.md) · [add a game](docs/ADDING-A-GAME.md) · [moderate Ask the Clergy](docs/ASK-THE-CLERGY.md) · [event runbook](docs/EVENT-RUNBOOK.md) · [role pathways](docs/UX-FLOWS.md)

## Local development

```bash
pnpm install
pnpm dev
```

Copy `.env.example` to `.env.local`. When `NEXT_PUBLIC_CONVEX_URL` is empty, everything runs on local demo state: Game Mode syncs across tabs, and Ask the Clergy shows clearly labeled sample questions saved only in your browser. To connect the hosted backend, follow [convex/README.md](convex/README.md).

For a full local backend without a Convex account, run `CONVEX_AGENT_MODE=anonymous pnpm exec convex dev`. It starts a local deployment on `127.0.0.1:3210` and writes `.env.local`. Then set `HOST_PIN` and `QA_ADMIN_PIN` with `pnpm exec convex env set` and, to try Game Mode, run `pnpm exec convex run seed:event '{"eventCode":"WINTER27"}'`.

Checks: `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm build`.

## Deploying to Vercel

The current release uses a backend-first deployment: deploy and verify Convex functions, then build Vercel against that deployment with `NEXT_PUBLIC_CONVEX_URL`. That is the only frontend setting: staff PINs and the live event are server-side Convex settings, so the site deploys and runs with no event scheduled. See [convex/README.md](convex/README.md) for the exact order.

## Roles

- Visitor: browses the site and asks or upvotes questions in Ask the Clergy. No account needed.
- Q&A moderator: uses `/qa/admin` with the moderator PIN to approve, answer, hide, or delete questions.
- Participant: enters Game Mode with the event code, name, and church; enters temporary breakout codes during rotations; uses the Jeopardy buzzer.
- Room Host: opens one private room-scoped link, runs the assigned activity, and reports the result.
- Game Master: controls the event timeline, volunteer links, Jeopardy board, scores, and shared display.
- Display: read-only screen-share surface with no private information.

## Live website and access

- Website: [mgsosawest.com](https://mgsosawest.com)
- Game Mode (participants join here): [mgsosawest.com/game](https://mgsosawest.com/game)
- Ask the Clergy: [mgsosawest.com/qa](https://mgsosawest.com/qa) · moderators: [mgsosawest.com/qa/admin](https://mgsosawest.com/qa/admin)
- Game Master console: [mgsosawest.com/host](https://mgsosawest.com/host)
- Shared display: [mgsosawest.com/display](https://mgsosawest.com/display)
- Event code for participants: whichever event is live on the server (see [set up a new event](docs/NEW-EVENT.md)). With no live event, every Game Mode page shows "No game night is live right now" and the rest of the site works normally.

Staff PINs live only in Convex environment variables and are never committed or stored in a browser. Signing in sends the PIN once to the server, which returns a 12-hour session token for that tab. **Lock console** ends the session, and 10 wrong PINs in 15 minutes lock sign-in for that role. The production Game Master PIN is intentionally not committed to this public repository. An authorized organizer can retrieve it with:

```bash
pnpm exec convex env get HOST_PIN --prod
```

To rotate the PIN, run `pnpm exec convex env set HOST_PIN --prod`, enter the new value privately, and give it only to the Game Master and designated backup. Room Hosts and participants never need the Game Master PIN.

## Game Master instructions

### Before the event

1. Join Zoom 30 minutes early and open the [Game Master console](https://mgsosawest.com/host).
2. Enter the Game Master PIN once. Keep this tab private; do not screen share it because it contains answers and volunteer controls.
3. Open the [shared display](https://mgsosawest.com/display) in a separate tab. This is the only website tab that should be screen shared.
4. Open **Breakout rooms** from the Game Master navigation.
5. Select each room, press **Generate new code**, and confirm a 4–6 digit participant code appears.
6. Press **Create + copy link** for each room and privately send that link only to its assigned Room Host. Replacing a link invalidates the previous link.
7. Ask each Room Host to open the link and confirm that it shows the correct room. Test one participant join from a phone.

### Safe testing reset

- Participant cleanup is under **Check-in → Clear test participants** in the Game Master overview.
- It unlocks only while the event is in **Lobby** and requires typing `CLEAR PARTICIPANTS` exactly.
- It removes participant sessions and room joins only. Teams, room configuration, volunteer links, scores, question usage, and both Jeopardy rounds stay intact.
- The server rechecks the participant count before deleting anything, so a new arrival cannot be cleared by a stale confirmation.

### During breakout rotations

Times below are from the July 11 (`WEST26`) run of show; the Game Master timeline always shows the active event's times. Selecting the phase that is already live does nothing, so a stray tap can't reset rooms. Use **Score corrections** on the overview to fix a mistaken award.

1. On **Event control**, select **Rotation one** when the first breakouts begin. Participants will then see the room-code entry screen.
2. Tell each Room Host to share only their room's temporary numeric code inside the matching Zoom breakout.
3. Treat each website room as one parallel Zoom breakout. The code is only the door key for the web session; Zoom still controls who is moved where.
4. Keep rooms at 8–12 participants when possible. The console starts with the four rooms in the event's config (`WINTER27`: two Bible Who Am I?, one Imposter, one Gartic), supports up to eight, and allows a 4–16 person limit per room.
5. Watch Zoom for timing and transitions. The Room Host link shows the live web roster for its room.
6. At 6:00 PM, select **Room switch** and return everyone to the main Zoom room.
7. Open **Breakout rooms**, generate fresh codes if desired, and confirm the second-room assignments.
8. At 6:05 PM, select **Rotation two**. Old room membership is no longer treated as current.
9. At 6:25 PM, select **Score check** and confirm that each Room Host submitted no more than one 200-point result for the rotation.

### Running Bible Jeopardy

1. Select **Bible Jeopardy** on Event control, then open **Jeopardy** from the Game Master navigation.
2. Keep the public display tab screen shared. Keep the Game Master Jeopardy tab private because it shows the accepted answer.
3. Select a category/value tile and read the clue aloud.
4. Press **Open buzzers**. The first valid participant buzz locks the question to that participant and team.
5. Press **Correct** to award the clue value, or **Incorrect** to subtract the clue value and lock out that team.
6. After an incorrect response, press **Reopen for other teams** if another team may answer.
7. Press **Close clue** to return to the board. If a clue stalls, reveal the answer and move on.
8. At the end, select **Winners + close** on Event control and use the shared display for the final standings.
9. If the first board runs short, return to the board and select **Round 2**. It adds 30 new age-balanced clues and preserves every team score. Round 1 can be reopened the same way.

## Bible Who Am I? Room Host instructions

1. Open the private Room Host link and paste the visible participant code into the assigned Zoom breakout chat.
2. Open **Bible figures** in the side rail. It is host-only, so never screen share the console.
3. Privately DM one participant a Bible figure. Everyone else asks yes-or-no questions, up to 20 per figure.
4. Press **Start Question round** for the 5-minute timer, then **Start Lightning round** for one last figure.
5. Tally correct guesses by team, press **Start Tally + score**, and award 200 to the winning team once.

## Find the Imposter Room Host instructions

1. Open the private Room Host link sent by the Game Master. Do not forward it; it unlocks only your assigned room.
2. Join the assigned Zoom breakout and keep your camera on. Do not screen share.
3. Copy the visible participant code and paste it into that breakout's Zoom chat. Participants enter it on their `/play` page.
4. Confirm names appear under **Live attendance**. If the code was shared in the wrong room, press **Generate new code** and share the replacement.
5. Privately DM each participant their prepared word in Zoom. One participant receives the imposter word or a blank. The website does not send secret words.
6. Choose a fixed speaking order. Use the website's steps and timer for clue round one, clue round two, 60-second open discussion, and the simultaneous vote.
7. Count down “3, 2, 1, send” for the Zoom chat vote, reveal the result, and advance the website to the result step.
8. Under **Award 200**, select the winning team once. Duplicate submissions for the same room and rotation are blocked.
9. Press **Reset round** before beginning another round. Use **Exit room console** when finished, especially on a shared computer.

## Gartic Phone Room Host instructions

1. Open the private Room Host link sent by the Game Master. Do not forward it.
2. Copy the visible participant code into the assigned Zoom breakout chat and confirm participants appear under **Live attendance**.
3. Press **Open Gartic Phone**, create a room, and paste the Gartic room link into Zoom chat.
4. Use Normal mode, 60–90 second turns, and Adult mode OFF. Ask participants to use `first name + church` as their nickname.
5. Remind everyone that the opening sentence must use a New Testament subject. Mute during drawing rounds.
6. Screen share only for the album reveal so the room can react together.
7. Press **Finish reveal + vote**. Ask everyone to vote in Zoom chat for a favorite album.
8. Under **Award 200**, select the winning team once. Duplicate submissions are blocked.
9. If Gartic Phone fails, use Skribbl and keep the same website room code. Press **Reset round** before another game and **Exit room console** when finished.

## Floater or backup Room Host

The floater follows the instructions for whichever activity they are assigned. The Game Master should create a new private link for the replacement host rather than forwarding another volunteer's link. Creating a replacement immediately invalidates the old link.

## Participant instructions to announce

1. Go to [mgsosawest.com/game](https://mgsosawest.com/game) (or press **Game Mode** on any page), enter the event code, a first name, and church, then press **Enter the lobby**.
2. Keep the page open. It updates automatically when the Game Master changes phases.
3. During a breakout rotation, enter the 4–6 digit code shared by that Room Host in Zoom.
4. During Jeopardy, use the website buzzer only after the Game Master says the buzzers are open.
