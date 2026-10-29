/**
 * The MGSOSA West game library.
 *
 * Every game the website knows about is described here once. Breakout games
 * are playable in the live Game Mode console: the room-host console renders
 * `hostStages`, participants see `participantSteps`, and the Game Master can
 * create rooms for any breakout game in this list. Main-stage and in-person
 * games appear in the public library so planners can reuse them.
 *
 * To add a game, follow docs/ADDING-A-GAME.md. This file is imported by the
 * Convex backend, so keep it free of React and path aliases.
 */

export type GameFormat = "breakout" | "main-stage" | "in-person";

export type GameIcon = "users" | "pencil" | "help" | "grid" | "zap" | "droplet" | "image";

export interface HostStage {
  id: string;
  title: string;
  instruction: string;
  /** Countdown length. 0 means the stage is untimed. */
  seconds: number;
  /** Optional button that opens an external tool for this stage. */
  externalTool?: { label: string; url: string };
}

export interface GameDefinition {
  id: string;
  name: string;
  tagline: string;
  format: GameFormat;
  icon: GameIcon;
  players: { min: number; ideal: string };
  minutes: number;
  /** Where the game works: online over Zoom, in person, or both. */
  setting: "online" | "in-person" | "both";
  howToPlay: string[];
  materials: string[];
  scoring: string;
  fallback?: string;
  /** Shown to participants once they enter a breakout room code. */
  participantSteps?: Array<{ title: string; detail: string }>;
  /** Run-of-round for the room-host console. The last stage awards points. */
  hostStages?: HostStage[];
  /** Private prompts shown only on the room-host console. */
  hostPrompts?: { label: string; items: string[] };
}

export const games: GameDefinition[] = [
  {
    id: "imposter",
    name: "Find the Imposter",
    tagline: "One player has a different word. Find them before they blend in.",
    format: "breakout",
    icon: "users",
    players: { min: 4, ideal: "8–12" },
    minutes: 20,
    setting: "both",
    howToPlay: [
      "The host privately messages each player a secret word. One player gets the imposter word or a blank.",
      "In a fixed speaking order, everyone gives a one-word clue. Two clue rounds total.",
      "Sixty seconds of open discussion, then everyone votes at the same time.",
    ],
    materials: ["Word-pair list (host only)", "Zoom private chat or folded paper slips"],
    scoring: "Caught imposter: 200 to the group’s winning team. Imposter survives: 200 to the imposter’s team.",
    participantSteps: [
      { title: "Stay in this Zoom breakout.", detail: "Your host will set the speaking order." },
      { title: "Watch Zoom private chat.", detail: "Your secret word arrives there." },
      { title: "Keep it secret.", detail: "Give one-word clues only when called." },
    ],
    hostStages: [
      { id: "lobby", title: "Room lobby", instruction: "Confirm names, explain the rules, and make sure nobody is screen sharing.", seconds: 0 },
      { id: "clues", title: "Clue rounds", instruction: "Follow the speaking order. Each person gives one word only.", seconds: 180 },
      { id: "discussion", title: "Open discussion", instruction: "Everyone may discuss who they think the Imposter is.", seconds: 60 },
      { id: "vote", title: "Simultaneous vote", instruction: "Count down 3–2–1, then everyone submits together.", seconds: 20 },
      { id: "results", title: "Reveal + score", instruction: "Reveal the Imposter and submit the winning team points.", seconds: 0 },
    ],
    hostPrompts: {
      label: "Word pairs (normal / imposter)",
      items: [
        "Noah’s Ark / Jonah’s boat",
        "Manna / Loaves and fishes",
        "Thurible / Candle",
        "Nativity / Epiphany",
        "Shepherd / Fisherman",
        "Jordan River / Red Sea",
      ],
    },
  },
  {
    id: "gartic",
    name: "Gartic Phone",
    tagline: "Telephone with drawings. Start with a New Testament sentence and watch it drift.",
    format: "breakout",
    icon: "pencil",
    players: { min: 4, ideal: "8–12" },
    minutes: 20,
    setting: "online",
    howToPlay: [
      "The host creates a Gartic Phone room and pastes the link in Zoom chat.",
      "Everyone writes an opening sentence about a New Testament subject.",
      "Players alternate drawing and describing what they receive.",
      "The host screen shares the album reveal, then the room votes on a favorite.",
    ],
    materials: ["garticphone.com room (Normal mode, 60–90s turns, Adult mode OFF)", "Laptop or tablet recommended"],
    scoring: "The favorite album earns 200 for its creator’s team.",
    fallback: "If Gartic Phone fails, use skribbl.io and keep the same website room code.",
    participantSteps: [
      { title: "Stay in this Zoom breakout.", detail: "Your host will share the Gartic link." },
      { title: "Use first name + church.", detail: "That keeps points easy to track." },
      { title: "New Testament prompts only.", detail: "Unmute together for the album reveal." },
    ],
    hostStages: [
      {
        id: "setup",
        title: "Open the Gartic room",
        instruction: "Create the Gartic room, paste its link into Zoom chat, and confirm every nickname includes first name + church.",
        seconds: 0,
        externalTool: { label: "Open Gartic Phone", url: "https://garticphone.com" },
      },
      { id: "play", title: "Draw + describe", instruction: "Mute during drawing rounds. Remind everyone the opening sentence uses a New Testament subject.", seconds: 0 },
      { id: "results", title: "Choose the favorite", instruction: "Screen share the album reveal, ask everyone to vote in Zoom chat, then award the favorite album.", seconds: 0 },
    ],
  },
  {
    id: "who-am-i",
    name: "Bible Who Am I?",
    tagline: "One player secretly becomes a Bible figure. Twenty yes-or-no questions to guess who.",
    format: "breakout",
    icon: "help",
    players: { min: 4, ideal: "6–12" },
    minutes: 20,
    setting: "both",
    howToPlay: [
      "The host privately messages one player the name of a Bible figure.",
      "Everyone else takes turns asking yes-or-no questions, up to 20 per figure.",
      "The first player to guess correctly picks the next person to receive a name.",
      "In person: stick the name on the guesser’s forehead and reverse the roles.",
    ],
    materials: ["Bible figure list (host only)", "Sticky notes for in-person play"],
    scoring: "The team that guesses the most figures in the round earns 200.",
    participantSteps: [
      { title: "Stay in this Zoom breakout.", detail: "Your host will pick the first player." },
      { title: "Watch Zoom private chat.", detail: "If you receive a name, keep it secret." },
      { title: "Yes-or-no questions only.", detail: "Twenty questions per figure. Guess when you know!" },
    ],
    hostStages: [
      { id: "lobby", title: "Room lobby", instruction: "Confirm names, explain the rules, and choose who receives the first Bible figure.", seconds: 0 },
      { id: "questions", title: "Question round", instruction: "Players ask yes-or-no questions. Keep a tally; stop at 20 questions per figure.", seconds: 300 },
      { id: "lightning", title: "Lightning round", instruction: "One last figure: anyone may shout a guess after each answer.", seconds: 90 },
      { id: "results", title: "Tally + score", instruction: "Count each team’s correct guesses and award the winning team.", seconds: 0 },
    ],
    hostPrompts: {
      label: "Bible figures",
      items: [
        "Noah", "Abraham", "Sarah", "Moses", "Miriam", "Joshua", "Ruth", "David", "Solomon", "Elijah",
        "Daniel", "Esther", "Jonah", "Mary, the Mother of God", "Joseph", "John the Baptist", "Peter",
        "Andrew", "Thomas", "Matthew", "Mary Magdalene", "Martha", "Lazarus", "Zacchaeus", "Paul",
        "Stephen", "Timothy", "Nicodemus",
      ],
    },
  },
  {
    id: "bible-jeopardy",
    name: "Bible Jeopardy",
    tagline: "The main-stage finale: categories, a live buzzer on every phone, and team scores.",
    format: "main-stage",
    icon: "grid",
    players: { min: 8, ideal: "Whole event" },
    minutes: 45,
    setting: "both",
    howToPlay: [
      "The Game Master screen shares the display board and reads each clue.",
      "When buzzers open, the first phone to buzz answers for their team.",
      "A miss locks that team out and the Game Master can reopen for others.",
    ],
    materials: ["Game Master console (private)", "Shared display tab (screen share)"],
    scoring: "Clue value for correct answers. Incorrect answers lock the team out of that clue.",
  },
  {
    id: "human-bingo",
    name: "Human Bingo",
    tagline: "Find someone who has served at the altar, flew in, or can pray in Syriac.",
    format: "in-person",
    icon: "zap",
    players: { min: 10, ideal: "20–60" },
    minutes: 15,
    setting: "in-person",
    howToPlay: [
      "Hand out bingo cards at check-in so early arrivals can start right away.",
      "Players find someone who matches each square; that person signs their first name and city.",
      "One square per person. The MC reads squares aloud and the first full row wins.",
    ],
    materials: ["Printed 4×4 bingo cards", "Pens", "Small prizes"],
    scoring: "First full row and full card win prizes or first place in the dinner line.",
  },
  {
    id: "telephone-pictionary",
    name: "Telephone Pictionary",
    tagline: "The paper version of Gartic Phone: write, draw, fold, pass.",
    format: "in-person",
    icon: "image",
    players: { min: 6, ideal: "7–8 per table" },
    minutes: 25,
    setting: "in-person",
    howToPlay: [
      "Each player folds a sheet into eight boxes and writes a sentence (Bible stories work well).",
      "Pass it on. The next player draws the sentence and folds the writing back.",
      "Alternate writing and drawing until the sheet is full, then reveal at each table.",
    ],
    materials: ["Paper", "Pens or markers", "One older-youth table captain per table"],
    scoring: "Tables vote on the funniest sheet.",
  },
  {
    id: "water-cup-race",
    name: "Water Cup Race",
    tagline: "Blow a ping-pong ball down a lane of water cups. Relay until everyone has gone.",
    format: "in-person",
    icon: "droplet",
    players: { min: 10, ideal: "5 teams" },
    minutes: 15,
    setting: "in-person",
    howToPlay: [
      "Set six half-full cups per lane on a table with a ping-pong ball in the first cup.",
      "Players blow the ball from cup to cup without touching it.",
      "Relay until every teammate has gone. Set up out of the wind.",
    ],
    materials: ["About 100 cups", "Two dozen ping-pong balls", "Water + paper towels", "Tables"],
    scoring: "First team to finish the relay wins.",
    fallback: "Too hot or windy? Move inside for Charades or Rock-Paper-Scissors Champion.",
  },
];

export const breakoutGames = games.filter((game) => game.format === "breakout");

export type BreakoutGameId = (typeof breakoutGames)[number]["id"];

export function getGame(id: string) {
  return games.find((game) => game.id === id);
}

export function isBreakoutGameId(id: string) {
  return breakoutGames.some((game) => game.id === id);
}

export function gameName(id: string) {
  return getGame(id)?.name ?? "Breakout game";
}

export const gameFormatLabel: Record<GameFormat, string> = {
  breakout: "Breakout room",
  "main-stage": "Main stage",
  "in-person": "In person",
};
