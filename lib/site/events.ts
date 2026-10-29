export type EventKind = "game-night" | "conference" | "bible-study" | "retreat";

export interface SiteEvent {
  slug: string;
  title: string;
  kind: EventKind;
  /** ISO date of the first day, used for sorting and upcoming/past split. */
  startDate: string;
  endDate?: string;
  dateLabel: string;
  timeLabel?: string;
  location: string;
  summary: string;
  /** "confirmed" events are announced; "proposed" dates still need a team vote. */
  status: "confirmed" | "proposed" | "recurring";
  theme?: { title: string; verse: string; reference: string };
  highlights?: string[];
  schedule?: Array<{ time: string; item: string }>;
  /** Game Mode event code when the event runs on the live console. */
  gameEventCode?: string;
  /** Conference slug for Ask the Clergy filtering. */
  conferenceSlug?: string;
  cta?: { label: string; href: string };
}

export const eventKindLabel: Record<EventKind, string> = {
  "game-night": "Game night",
  conference: "Conference",
  "bible-study": "Bible study",
  retreat: "Retreat",
};

export const siteEvents: SiteEvent[] = [
  {
    slug: "winter-game-night-2027",
    title: "Winter Game Night",
    kind: "game-night",
    startDate: "2027-01-09",
    dateLabel: "Saturday, January 9, 2027",
    timeLabel: "5:30–7:30 PM Pacific",
    location: "Online • Zoom + mgsosawest.com",
    summary:
      "Start the new year together from every parish in the West. Two breakout rotations—featuring the new Bible Who Am I?—then a Bible Jeopardy finale with a live buzzer on your phone.",
    status: "proposed",
    highlights: [
      "New game: Bible Who Am I? in breakout rooms",
      "Find the Imposter and Gartic Phone rotations",
      "Bible Jeopardy finale with team scores",
      "No account or download—join from any phone",
    ],
    schedule: [
      { time: "5:30", item: "Opening prayer + lobby" },
      { time: "5:45", item: "Breakout rotation one" },
      { time: "6:10", item: "Breakout rotation two" },
      { time: "6:40", item: "Bible Jeopardy" },
      { time: "7:20", item: "Winners + closing prayer" },
    ],
    gameEventCode: "WINTER27",
    cta: { label: "Open Game Mode • code WINTER27", href: "/game" },
  },
  {
    slug: "monthly-bible-study",
    title: "Monthly Bible Study",
    kind: "bible-study",
    startDate: "2026-11-01",
    dateLabel: "Once a month",
    timeLabel: "Dates shared in the WhatsApp community—ask your parish rep to join",
    location: "Online • Zoom",
    summary:
      "An online study for youth across the region, led by clergy and guest speakers chosen with our Spiritual Advisor. Bring your questions—answers that come up often are added to Ask the Clergy.",
    status: "recurring",
    cta: { label: "Ask a question ahead of time", href: "/qa?conference=bible-study#ask" },
  },
  {
    slug: "sofc-2026",
    title: "SOFC 2026 — Syriac Orthodox Fellowship Conference",
    kind: "conference",
    startDate: "2026-10-09",
    endDate: "2026-10-11",
    dateLabel: "October 9–11, 2026",
    location: "St. Mary’s Syrian Orthodox Church, Los Angeles",
    summary:
      "Our regional fellowship conference: a weekend of worship, service, a guest speaker, small groups, and open Q&A with clergy—built so youth could meet others their age from across the West.",
    status: "confirmed",
    theme: {
      title: "Fellowship in Christ",
      verse: "But if we walk in the light as He is in the light, we have fellowship with one another, and the blood of Jesus Christ His Son cleanses us from all sin.",
      reference: "1 John 1:7",
    },
    highlights: [
      "Served together at the community food ministry at Christ the Good Shepherd, Long Beach",
      "Guest speaker Fr. Lazarus Yassa",
      "Age-split small groups and an open Q&A",
      "Praise & Worship, outdoor games, and a Suboro station",
    ],
    conferenceSlug: "sofc-2026",
    cta: { label: "Browse SOFC 2026 Q&A", href: "/qa?conference=sofc-2026" },
  },
  {
    slug: "summer-game-night-2026",
    title: "Summer Game Night",
    kind: "game-night",
    startDate: "2026-07-11",
    dateLabel: "Saturday, July 11, 2026",
    timeLabel: "5:30–7:30 PM Pacific",
    location: "Online • Zoom + mgsosawest.com",
    summary:
      "Our first live-console game night: Find the Imposter and Gartic Phone breakouts, then a 60-clue Holy Qurbana–themed Bible Jeopardy finale.",
    status: "confirmed",
    gameEventCode: "WEST26",
  },
];

/** Dated events in calendar order, with recurring ones after them. */
export function sortEvents(events: SiteEvent[]) {
  return [...events].sort((a, b) => Number(a.status === "recurring") - Number(b.status === "recurring") || a.startDate.localeCompare(b.startDate));
}

/** Splits by the event's last day so a multi-day event stays upcoming while it runs. */
export function splitEvents(events: SiteEvent[], today: string) {
  const sorted = sortEvents(events);
  const isUpcoming = (event: SiteEvent) => event.status === "recurring" || (event.endDate ?? event.startDate) >= today;
  return {
    upcoming: sorted.filter(isUpcoming),
    past: sorted.filter((event) => !isUpcoming(event)).reverse(),
  };
}

export function getEvent(slug: string) {
  return siteEvents.find((event) => event.slug === slug);
}

export function todayInPacific(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles" }).format(now);
}
