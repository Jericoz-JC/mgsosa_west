# MGSOSA West role pathways

The console intentionally gives each person only the information needed for their current job.

## Participant

1. Open the shared link or scan the event QR code.
2. Enter the temporary event code, first name, and church.
3. Receive a team and rotation group.
4. Follow the current activity card to the assigned breakout room.
5. During Jeopardy, use one large buzzer and watch the shared Zoom display.
6. Reconnect automatically after a refresh through the private browser session token.

Participants do not create accounts and never receive host controls, private answer keys, or another player’s Imposter assignment.

## Room admin

1. Open `/room` and unlock the assigned staff session.
2. Select the assigned room.
3. Copy or regenerate its temporary 4–6 digit numeric code.
4. Follow the activity steps, timer, roster, and voting/reveal prompts.
5. Submit the round winner to the shared score ledger.

Temporary room codes identify rooms only. They never grant Game Master access.

## Game Master

1. Open `/host` with the private host credential.
2. Advance the live event phase so every participant sees the same instruction.
3. Monitor teams, room codes, attendance, and the run of show.
4. Open `/host/jeopardy` to select clues, open buzzing, judge answers, reopen after misses, and undo scoring mistakes.
5. Keep `/display` in a separate screen-shared tab.

## Display

The display is read-only and contains only public information: event code, board, clue, accepted buzz winner, and leaderboard. It never receives question answers, host controls, private tokens, or Imposter words.

## Shared state

The local implementation uses a typed reducer plus `BroadcastChannel` so multiple tabs can demonstrate the synchronized behavior. Convex supplies the production state layer. The first-buzz mutation reads and claims one buzz window atomically, and private data is returned only after validating the participant session or staff secret.
