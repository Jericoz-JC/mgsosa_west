# Post-event organizer upgrades

These changes implement feedback from the July 11 event.

## Deferred, balanced teams

- New participants check in without receiving a team immediately.
- The Game Master chooses a minimum of 2–8 groups and a target of 4–16 people per group.
- Recommended group count is `max(minimum groups, ceil(participants / target size))`, capped at eight and never greater than attendance.
- Participants are assigned with a deterministic least-loaded algorithm. Large church cohorts are processed first; when groups are tied in size, the next participant goes to the group containing fewer people from that church.
- The complete operation uses one Convex mutation and one write per participant, with at most eight small team-document updates.
- The organizer can copy every roster or an individual roster in a format suitable for Zoom chat or another volunteer.

## Manual Jeopardy

- A general manual score desk can add or deduct any point amount without using a card.
- A selected clue can be awarded to a team, deducted from a team, or closed with no score.
- Manual clue resolution marks the card used and returns to the board in one Convex mutation.
- The synchronized buzzer workflow remains available.

## Reusable Jeopardy sets

- Game Masters can create 1–60-card sets with custom categories, values, clues, and answers.
- Saved sets live in Convex and can be activated later.
- The built-in two-round Holy Qurbana board remains available.
- Switching sets keeps the event score ledger but closes any active clue.

## Free-tier posture

The grouping algorithm does not call an AI model, optimization API, Vercel Function, or background job. Next.js renders the organizer interface; a single Convex mutation performs the assignment. Custom Jeopardy sets store small text documents and are read only with the event's active subscriptions.
