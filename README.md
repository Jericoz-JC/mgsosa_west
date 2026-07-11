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

## Live website and access

- Event website: [mgsosa-west.vercel.app](https://mgsosa-west.vercel.app)
- Game Master console: [mgsosa-west.vercel.app/host](https://mgsosa-west.vercel.app/host)
- Shared display: [mgsosa-west.vercel.app/display](https://mgsosa-west.vercel.app/display)
- Event code for participants: `WEST26`

The production Game Master PIN is stored in Convex and is intentionally not committed to this public repository. An authorized organizer can retrieve it with:

```bash
pnpm exec convex env get HOST_PIN --prod
```

To rotate the PIN, run `pnpm exec convex env set HOST_PIN --prod`, enter the new value privately, and give it only to the Game Master and designated backup. Room Hosts and participants never need the Game Master PIN.

## Game Master instructions

### Before the event

1. Join Zoom 30 minutes early and open the [Game Master console](https://mgsosa-west.vercel.app/host).
2. Enter the Game Master PIN once. Keep this tab private; do not screen share it because it contains answers and volunteer controls.
3. Open the [shared display](https://mgsosa-west.vercel.app/display) in a separate tab. This is the only website tab that should be screen shared.
4. Open **Breakout rooms** from the Game Master navigation.
5. Select each room, press **Generate new code**, and confirm a 4–6 digit participant code appears.
6. Press **Create + copy link** for each room and privately send that link only to its assigned Room Host. Replacing a link invalidates the previous link.
7. Ask each Room Host to open the link and confirm that it shows the correct room. Test one participant join from a phone.

### During breakout rotations

1. On **Event control**, select **Rotation one** when the first breakouts begin. Participants will then see the room-code entry screen.
2. Tell each Room Host to share only their room's temporary numeric code inside the matching Zoom breakout.
3. Watch Zoom for timing and transitions. The Room Host link shows the live web roster for its room.
4. At 6:00 PM, select **Room switch** and return everyone to the main Zoom room.
5. Open **Breakout rooms**, generate fresh codes if desired, and confirm the second-room assignments.
6. At 6:05 PM, select **Rotation two**. Old room membership is no longer treated as current.
7. At 6:25 PM, select **Score check** and confirm that each Room Host submitted no more than one 200-point result for the rotation.

### Running Bible Jeopardy

1. Select **Bible Jeopardy** on Event control, then open **Jeopardy** from the Game Master navigation.
2. Keep the public display tab screen shared. Keep the Game Master Jeopardy tab private because it shows the accepted answer.
3. Select a category/value tile and read the clue aloud.
4. Press **Open buzzers**. The first valid participant buzz locks the question to that participant and team.
5. Press **Correct** to award the clue value, or **Incorrect** to lock out that team.
6. After an incorrect response, press **Reopen for other teams** if another team may answer.
7. Press **Close clue** to return to the board. If a clue stalls, reveal the answer and move on.
8. At the end, select **Winners + close** on Event control and use the shared display for the final standings.

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

1. Go to [mgsosa-west.vercel.app](https://mgsosa-west.vercel.app), enter `WEST26`, a first name, and church, then press **Enter the lobby**.
2. Keep the page open. It updates automatically when the Game Master changes phases.
3. During a breakout rotation, enter the 4–6 digit code shared by that Room Host in Zoom.
4. During Jeopardy, use the website buzzer only after the Game Master says the buzzers are open.
