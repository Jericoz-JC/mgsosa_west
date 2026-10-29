# Add a game

Every game lives in one place: the `games` array in `lib/games/registry.ts`. The public `/games` library, the Game Master's "Add breakout room" picker, the room-host console, and the participant room card all read from it. The Convex backend imports it too, to validate room types.

## Formats

- `breakout`: runs in a Zoom breakout with the live console. It needs `hostStages` and `participantSteps`.
- `main-stage`: everyone together, like Bible Jeopardy. Listed in the library.
- `in-person`: conference and retreat games. Listed in the library with how-to and supplies.

## Breakout game checklist

```ts
{
  id: "bible-charades",            // stable; stored on rooms in Convex
  name: "Bible Charades",
  tagline: "One line that sells it.",
  format: "breakout",
  icon: "users",                   // see GameIcon in the registry
  players: { min: 4, ideal: "6–12" },
  minutes: 20,
  setting: "online",
  howToPlay: ["…"],                // shown on /games
  materials: ["…"],
  scoring: "Winning team earns 200.",
  participantSteps: [              // shown after a participant enters the room code
    { title: "Stay in this Zoom breakout.", detail: "…" },
  ],
  hostStages: [                    // room-host run of round; the LAST stage awards points
    { id: "lobby", title: "Room lobby", instruction: "…", seconds: 0 },
    { id: "play", title: "Act it out", instruction: "…", seconds: 240 },
    { id: "results", title: "Score the round", instruction: "…", seconds: 0 },
  ],
  hostPrompts: { label: "Prompts", items: ["…"] }, // optional, host-only
}
```

- `seconds > 0` shows a countdown for that stage.
- `externalTool` on a stage adds a button that opens an outside site, like Gartic Phone.
- Points are awarded from the last stage, once per room per rotation. The server blocks duplicates.

Then:

1. Run `pnpm test`. The registry tests check ids, stages, and event configs.
2. Add rooms for it in an event's `rooms` in `lib/game/event-config.ts`, or have the Game Master add them live from **Breakout rooms → Add breakout room**.
3. Deploy Convex functions before the frontend, so the backend accepts the new game id.
