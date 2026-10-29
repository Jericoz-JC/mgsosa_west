/**
 * Public, organization-level copy for the MGSOSA West website. Everything
 * here is safe to publish: no member names, phone numbers, or private notes.
 */
export const site = {
  name: "MGSOSA West",
  fullName: "Mor Gregorios Syriac Orthodox Students Association",
  region: "Western Region",
  archdiocese: "Malankara Archdiocese of the Syrian Orthodox Church in North America",
  president: "His Eminence Mor Titus Yeldho, Archbishop",
  mission:
    "Our goal is to spread God’s love while building a foundation for Syriac Orthodox youth to grow in faith and fellowship. We wish to pave a path for our future generations through outreach and spiritual education.",
  missionDate: "March 2022",
  email: "mgsosawestern@gmail.com",
  venmo: "@mgsosawest",
  url: "https://mgsosawest.com",
  ageRange: "Youth ages 14–25 (some regional events welcome ages 12+)",
} as const;

export interface NavItem {
  href: string;
  label: string;
}

export const primaryNav: NavItem[] = [
  { href: "/about", label: "About" },
  { href: "/events", label: "Events" },
  { href: "/conferences", label: "Conferences" },
  { href: "/qa", label: "Ask the Clergy" },
  { href: "/churches", label: "Churches" },
  { href: "/games", label: "Games" },
];

export const ministries = [
  {
    title: "Monthly Bible studies",
    detail: "Online studies with clergy and guest speakers, so youth across nine parishes can learn together.",
  },
  {
    title: "Regional conferences",
    detail: "Weekend gatherings like SOFC with worship, service, talks, small groups, and open Q&A with clergy.",
  },
  {
    title: "Game nights",
    detail: "Online and in-person fellowship nights: Bible Jeopardy, Find the Imposter, Gartic Phone, and more.",
  },
  {
    title: "Summer retreat",
    detail: "An in-person retreat hosted by one of the Western Region parishes each summer.",
  },
  {
    title: "Service + outreach",
    detail: "Serving our neighbors together, from food ministries to packing drives with local churches.",
  },
] as const;

export const leadershipRoles = [
  {
    title: "Spiritual Advisor",
    detail: "A clergy member appointed to guide the spiritual side of every event: speakers, Bible studies, and how our events reflect our faith.",
  },
  {
    title: "Senior + Junior Coordinators",
    detail: "Lead the regional team, keep in contact with clergy and the MGSOSA national leadership, and coordinate planning.",
  },
  {
    title: "Parish Youth Representatives",
    detail: "One or more youth from each parish who plan regional events and carry decisions back to their local clergy and youth.",
  },
  {
    title: "Secretary, Treasurer + Publicity",
    detail: "Keep minutes and reminders, manage event funds, and get the word out through WhatsApp, Instagram, and parish channels.",
  },
] as const;
