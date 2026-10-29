# MGSOSA West role pathways

The console intentionally gives each person only the information needed for their current job.

## Visitor (public site)

1. Browse events, conferences, churches, and the game library. No account needed.
2. In Ask the Clergy, filter answers by conference (or browse everything), topic, and who verified the answer.
3. Ask a question. It's anonymous by default and goes to a private review queue. Upvote questions you've wondered about too.

## Q&A moderator

1. Open `/qa/admin` with the moderator PIN.
2. Approve or hide submissions, enter questions asked live at sessions, and publish answers verified by a priest, bishop, or guest speaker. Each answer shows the clergy member's name or only their role.

## Participant

1. Open the shared link (`/game`), press **Game Mode** in the site header, or scan the event QR code.
2. Enter the event code, first name, and church.
3. Receive a team and rotation group.
4. During each rotation, enter the 4–6 digit code shared in the Zoom breakout room.
5. See the assigned game, room-specific instructions, and live confirmation.
6. During Jeopardy, use one large buzzer and watch the shared Zoom display.
7. Reconnect automatically after a refresh through the private browser session token.

Participants do not create accounts and never receive host controls, private answer keys, or another player’s Imposter assignment.

## Room host

1. Open the private link sent by the Game Master. No PIN is required.
2. Land directly in the one assigned room; other rooms and Game Master controls are unavailable.
3. Copy or regenerate that room’s temporary 4–6 digit participant code.
4. Follow the activity steps, timer, live joined roster, and voting/reveal prompts.
5. Submit the round winner to the shared score ledger.

Temporary numeric codes let participants join a room session only. Volunteer links are high-entropy, room-scoped, revocable, and stored as hashes in Convex.

## Game Master

1. Open `/host` with the private Game Master PIN.
2. Advance the event phase so every participant sees the same instruction.
3. Generate or revoke volunteer links and rotate participant room codes.
4. Open `/host/jeopardy` to select clues, open buzzing, judge answers, reopen after misses, and undo scoring mistakes.
5. Keep `/display` in a separate screen-shared tab.

## Display

The display is read-only and contains only public information: event code, board, clue, accepted buzz winner, and leaderboard. It never receives answers, room codes, volunteer tokens, or Imposter words.

## Shared state

The local implementation uses a typed reducer plus `BroadcastChannel` so multiple tabs can demonstrate synchronized behavior. Convex supplies production state. First-buzz claims are atomic, participant room membership is scoped to the active rotation, and private room or answer data is returned only after validating the participant session, Game Master PIN, or one-room volunteer grant.
