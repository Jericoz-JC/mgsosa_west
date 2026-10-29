/**
 * Conferences and gatherings that Ask the Clergy questions can be tagged with.
 * Imported by the Convex backend for validation; keep relative imports only.
 */
export interface Conference {
  slug: string;
  name: string;
  shortName: string;
  dateLabel: string;
  location: string;
  theme?: string;
  /** Public event page, when one exists. */
  eventSlug?: string;
}

export const conferences: Conference[] = [
  {
    slug: "sofc-2026",
    name: "Syriac Orthodox Fellowship Conference 2026",
    shortName: "SOFC 2026",
    dateLabel: "October 9–11, 2026",
    location: "St. Mary’s, Los Angeles",
    theme: "Fellowship in Christ • 1 John 1:7",
    eventSlug: "sofc-2026",
  },
  {
    slug: "bible-study",
    name: "Monthly Bible Study",
    shortName: "Bible Study",
    dateLabel: "Monthly",
    location: "Online",
    eventSlug: "monthly-bible-study",
  },
];

export const GENERAL_CONFERENCE = "general";

export function conferenceName(slug: string | undefined) {
  if (!slug || slug === GENERAL_CONFERENCE) return "General";
  return conferences.find((conference) => conference.slug === slug)?.shortName ?? "Conference";
}

export function isConferenceSlug(slug: string) {
  return slug === GENERAL_CONFERENCE || conferences.some((conference) => conference.slug === slug);
}

export const topics = [
  "Faith + Doctrine",
  "Liturgy + Sacraments",
  "Prayer + Fasting",
  "Scripture",
  "Church History + Saints",
  "Life + Relationships",
  "School, Work + Vocation",
  "Living Orthodox Today",
] as const;

export type Topic = (typeof topics)[number];

export function isTopic(value: string): value is Topic {
  return (topics as readonly string[]).includes(value);
}
