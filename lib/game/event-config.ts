import type { EventPhase } from "./types";

/**
 * Game Mode event configuration. Each live game night is one entry here:
 * the event code participants type, the run of show, and the breakout rooms
 * the Convex seed creates. Imported by the Convex backend, so keep relative
 * imports only.
 *
 * To set up a new game night, add an entry, point NEXT_PUBLIC_EVENT_CODE at
 * it, and run the seed. See docs/NEW-EVENT.md.
 */

export interface RunOfShowItem {
  phase: EventPhase;
  time: string;
  label: string;
  message: string;
}

export interface RoomTemplate {
  name: string;
  game: string;
  code: string;
  rotationGroups: string[];
}

export interface GameEventConfig {
  code: string;
  title: string;
  /** Slug of the matching public page under /events. */
  eventSlug: string;
  dateLabel: string;
  dayLabel: string;
  timeLabel: string;
  timezone: string;
  format: string;
  headline: [string, string, string];
  summary: string;
  runOfShow: RunOfShowItem[];
  rooms: RoomTemplate[];
  followUp?: { label: string; url: string };
}

export const gameEvents: Record<string, GameEventConfig> = {
  WEST26: {
    code: "WEST26",
    title: "MGSOSA West Game Night",
    eventSlug: "summer-game-night-2026",
    dateLabel: "July 11, 2026",
    dayLabel: "Saturday",
    timeLabel: "5:30–7:30 PM",
    timezone: "Pacific time",
    format: "Online • Zoom + web",
    headline: ["One night.", "Three games.", "All West."],
    summary: "Find the Imposter, Gartic Phone, and a live Bible Jeopardy finale—organized in one simple console built for phones and screen sharing.",
    runOfShow: [
      { phase: "lobby", time: "5:30", label: "Welcome + lobby", message: "Welcome • Check your team and rotation" },
      { phase: "rotation-one", time: "5:40", label: "Rotation one", message: "Rotation 1 • Join your assigned breakout room" },
      { phase: "switching", time: "6:00", label: "Room switch", message: "Return to main room • New assignments in 5 minutes" },
      { phase: "rotation-two", time: "6:05", label: "Rotation two", message: "Rotation 2 • Join your assigned breakout room" },
      { phase: "intermission", time: "6:25", label: "Score check", message: "Main room • Short break and score check" },
      { phase: "jeopardy", time: "6:35", label: "Bible Jeopardy", message: "Main event • Bible Jeopardy" },
      { phase: "closing", time: "7:20", label: "Winners + close", message: "Winners, announcements, and closing prayer" },
    ],
    rooms: [
      { name: "Imposter • Pacific", game: "imposter", code: "48215", rotationGroups: ["A", "C"] },
      { name: "Gartic • Sierra", game: "gartic", code: "73106", rotationGroups: ["B", "D"] },
      { name: "Imposter • Desert", game: "imposter", code: "62514", rotationGroups: ["B", "D"] },
      { name: "Gartic • Valley", game: "gartic", code: "84632", rotationGroups: ["A", "C"] },
    ],
    followUp: { label: "August interest form", url: "https://docs.google.com/forms/d/1Q8AQwIE6hgDy6nSb5RqD4arkExgOSmRPbDzK6LAEs1w/viewform" },
  },
  WINTER27: {
    code: "WINTER27",
    title: "MGSOSA West Winter Game Night",
    eventSlug: "winter-game-night-2027",
    dateLabel: "January 9, 2027",
    dayLabel: "Saturday",
    timeLabel: "5:30–7:30 PM",
    timezone: "Pacific time",
    format: "Online • Zoom + web",
    headline: ["New year.", "New games.", "All West."],
    summary: "Kick off 2027 with Bible Who Am I?, Find the Imposter, Gartic Phone, and a Bible Jeopardy finale with a live buzzer on every phone.",
    runOfShow: [
      { phase: "lobby", time: "5:30", label: "Opening prayer + lobby", message: "Welcome • Opening prayer, then check your team" },
      { phase: "rotation-one", time: "5:45", label: "Rotation one", message: "Rotation 1 • Join your assigned breakout room" },
      { phase: "switching", time: "6:05", label: "Room switch", message: "Return to main room • New assignments in 5 minutes" },
      { phase: "rotation-two", time: "6:10", label: "Rotation two", message: "Rotation 2 • Join your assigned breakout room" },
      { phase: "intermission", time: "6:30", label: "Score check", message: "Main room • Short break and score check" },
      { phase: "jeopardy", time: "6:40", label: "Bible Jeopardy", message: "Main event • Bible Jeopardy" },
      { phase: "closing", time: "7:20", label: "Winners + close", message: "Winners, announcements, and closing prayer" },
    ],
    rooms: [
      { name: "Who Am I? • Pacific", game: "who-am-i", code: "31742", rotationGroups: ["A", "C"] },
      { name: "Imposter • Sierra", game: "imposter", code: "58263", rotationGroups: ["B", "D"] },
      { name: "Gartic • Desert", game: "gartic", code: "64918", rotationGroups: ["A", "C"] },
      { name: "Who Am I? • Valley", game: "who-am-i", code: "27085", rotationGroups: ["B", "D"] },
    ],
  },
};

/** The newest configured event; used when NEXT_PUBLIC_EVENT_CODE is unset. */
export const DEFAULT_EVENT_CODE = "WINTER27";

export function getGameEventConfig(code: string | undefined): GameEventConfig {
  const normalized = code?.trim().toUpperCase();
  return (normalized && gameEvents[normalized]) || gameEvents[DEFAULT_EVENT_CODE];
}

export const activeEventCode = (process.env.NEXT_PUBLIC_EVENT_CODE?.trim().toUpperCase() || DEFAULT_EVENT_CODE);

export const activeGameEvent = getGameEventConfig(activeEventCode);
