import type { QAQuestion } from "./types";

/**
 * Preview content for local demo mode only (no Convex deployment). These are
 * placeholders to show the layout and are labeled as samples on the page;
 * they are never written to the live database.
 */
export function createSampleQuestions(now = Date.now()): QAQuestion[] {
  const day = 24 * 60 * 60 * 1000;
  return [
    {
      id: "sample-fast",
      body: "Why do we fast before receiving Holy Qurbana, and when should the fast begin?",
      conference: "sofc-2026",
      topic: "Liturgy + Sacraments",
      status: "answered",
      source: "admin",
      votes: 14,
      createdAt: now - 20 * day,
      answer: {
        body: "Sample answer for preview. Preparation for Holy Communion begins the evening before with prayer and Scripture, and the traditional fast begins at midnight. Real answers on this page are entered by MGSOSA West admins after a priest has reviewed them.",
        role: "priest",
        showName: false,
        session: "Saturday Q&A",
        answeredAt: now - 18 * day,
      },
    },
    {
      id: "sample-share",
      body: "How do I explain the Orthodox faith to friends at school who aren’t Orthodox?",
      conference: "sofc-2026",
      topic: "Living Orthodox Today",
      status: "answered",
      source: "community",
      askerName: "Anonymous",
      votes: 11,
      createdAt: now - 19 * day,
      answer: {
        body: "Sample answer for preview. Start with what you live, not with arguments: invite friends to see a liturgy, share why it matters to you, and be honest when you don’t know something.\n\nThis paragraph shows how longer answers wrap on the page.",
        role: "guest-speaker",
        name: "Sample Speaker",
        showName: true,
        session: "Guest speaker session",
        answeredAt: now - 17 * day,
      },
    },
    {
      id: "sample-kaukbo",
      body: "What does the star (Kaukbo) placed over the paten represent?",
      conference: "general",
      topic: "Liturgy + Sacraments",
      status: "answered",
      source: "admin",
      votes: 4,
      createdAt: now - 9 * day,
      answer: {
        body: "Sample answer for preview. The Kaukbo recalls the star of the Nativity.",
        role: "bishop",
        showName: false,
        answeredAt: now - 8 * day,
      },
    },
    {
      id: "sample-college",
      body: "How can I stay connected to the Church when I move away for college and there’s no parish nearby?",
      conference: "general",
      topic: "School, Work + Vocation",
      status: "open",
      source: "community",
      votes: 9,
      createdAt: now - 6 * day,
    },
    {
      id: "sample-fellowship",
      body: "What does it actually look like to have “fellowship in Christ” with people your age?",
      conference: "sofc-2026",
      topic: "Life + Relationships",
      status: "open",
      source: "community",
      askerName: "Maya",
      askerChurch: "St. Mary’s Los Angeles",
      votes: 6,
      createdAt: now - 15 * day,
    },
    {
      id: "sample-confession",
      body: "How should I prepare for my first confession as a teenager?",
      conference: "bible-study",
      topic: "Prayer + Fasting",
      status: "open",
      source: "community",
      votes: 3,
      createdAt: now - 2 * day,
    },
  ];
}
