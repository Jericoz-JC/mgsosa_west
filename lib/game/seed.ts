import type { EventState, JeopardyQuestion, Team } from "./types";

export const teams: Team[] = [
  { id: "pacific", name: "Pacific Blue", shortName: "Pacific", color: "#1d75bd", accent: "#8dd4ff" },
  { id: "sierra", name: "Sierra Gold", shortName: "Sierra", color: "#d69b2d", accent: "#ffe19a" },
  { id: "desert", name: "Desert Coral", shortName: "Desert", color: "#d45e50", accent: "#ffc1b8" },
  { id: "valley", name: "Valley Green", shortName: "Valley", color: "#39816b", accent: "#a7e1ce" },
];

const categories = [
  {
    name: "Qurbono Essentials",
    items: [
      [100, "Meaning ‘offering of sacrifice,’ this is the Syriac name for Holy Communion.", "Qurbono / Qurbana", "HQ-003", "Ages 9-12"],
      [200, "Holy Qurbono commemorates Christ’s birth, ministry, death, resurrection, and this promised event.", "The Second Coming", "HQ-002", "Ages 9-12"],
      [300, "These two primary sacramental elements are used for Holy Qurbono.", "Leavened bread and wine mixed with water", "HQ-008", "Ages 13-17"],
      [400, "Known as the Queen of Sacraments, this sacrament is the focus of the study guide.", "Holy Qurbono / Holy Communion", "HQ-004", "Ages 13-17"],
      [500, "Name the four components of Holy Qurbono listed in the source.", "Celebrant; sacramental items; Book of Holy Liturgy; recipient", "HQ-006", "Ages 18-25"],
    ],
  },
  {
    name: "Sanctuary & Symbols",
    items: [
      [100, "This altar table stands in the center of the sanctuary.", "Thronos", "HQ-017", "Ages 9-12"],
      [200, "Opening this sanctuary veil represents the opening of heaven.", "Thirasheela", "HQ-020", "Ages 9-12"],
      [300, "The twelve candles around the altar represent these followers of Christ.", "The twelve Apostles", "HQ-023", "Ages 9-12"],
      [400, "Called the Star, this cross is placed over the paten and recalls the Nativity.", "Kaukbo", "HQ-037", "Ages 13-17"],
      [500, "Also called the temporary altar, this consecrated wooden tablet makes celebration possible in another place.", "Tablitho", "HQ-026", "Ages 18-25"],
    ],
  },
  {
    name: "Words of Worship",
    items: [
      [100, "This Greek phrase means ‘Lord, have mercy upon us.’", "Kuriyelaison", "HQ-090", "Ages 9-12"],
      [200, "This phrase means ‘Let us stand well’ or ‘Be attentive.’", "Staumen kalos", "HQ-089", "Ages 9-12"],
      [300, "This word means ‘My beloved.’", "Habibai", "HQ-085", "Ages 13-17"],
      [400, "This is the prayer of absolution offered on behalf of the congregation.", "Hoosoyo", "HQ-093", "Ages 13-17"],
      [500, "Meaning ‘again,’ this term names the diptychs of remembrance.", "Thubden", "HQ-114", "Ages 18-25"],
    ],
  },
  {
    name: "Liturgy Journey",
    items: [
      [100, "Preparation for Holy Communion should begin at this time.", "The previous evening", "HQ-059", "Ages 9-12"],
      [200, "Name the two parts of the public celebration of Holy Qurbono.", "Mass of the Catechumens and Anaphora of the Faithful", "HQ-076", "Ages 13-17"],
      [300, "The Anaphora begins when the celebrant steps onto this altar step.", "Dargo", "HQ-102", "Ages 13-17"],
      [400, "The Elevation of the Holy Mysteries celebrates this event.", "The Ascension of our Lord", "HQ-124", "Ages 13-17"],
      [500, "Before the Procession, the closed veil symbolizes this present age.", "The age awaiting the Second Coming", "HQ-131", "Ages 18-25"],
    ],
  },
  {
    name: "Signs & Vessels",
    items: [
      [100, "Called Marvahtho, these objects symbolize angels around the altar.", "The fans", "HQ-054", "Ages 9-12"],
      [200, "This cover recalls both Christ’s burial shroud and the cloud over the wilderness tent.", "Kablana", "HQ-036", "Ages 13-17"],
      [300, "Called Tharvodo, this vessel symbolizes the tongs in Prophet Isaiah’s vision.", "The spoon", "HQ-039", "Ages 13-17"],
      [400, "The lower cup of the censer represents earth and St. Mary’s womb; the upper cup represents this.", "Heaven", "HQ-045", "Ages 18-25"],
      [500, "The quick motion at ‘a’damo doseno’ represents this event arriving like lightning.", "The Second Coming", "HQ-110", "Ages 18-25"],
    ],
  },
  {
    name: "Creed & Church",
    items: [
      [100, "According to the Nicene Creed, the Church has these four characteristics.", "One, Holy, Catholic, and Apostolic", "HQ-100", "Ages 9-12"],
      [200, "Formulated in 325 at Nicea by 318 Fathers, this confession summarizes Christian belief.", "The Nicene Creed", "HQ-097", "Ages 13-17"],
      [300, "The Trinity, Holy Church, Baptism, and Final Resurrection are major tenets of this.", "The Nicene Creed", "HQ-099", "Ages 13-17"],
      [400, "Name the three ecumenical synods listed in the supplied source.", "Nicea, Constantinople, and Ephesus", "HQ-143", "Ages 18-25"],
      [500, "The source identifies these two biblical orders of priesthood.", "Melchizedek and Aaron", "HQ-069", "Ages 18-25"],
    ],
  },
] as const;

export const questions: JeopardyQuestion[] = categories.flatMap((category, categoryIndex) =>
  category.items.map(([value, clue, answer, sourceId, ageBand], rowIndex) => ({
    id: `q-${categoryIndex + 1}-${rowIndex + 1}`,
    category: category.name,
    value,
    clue,
    answer,
    sourceId,
    ageBand,
    used: false,
  })),
);

export function createSeedState(now = Date.now()): EventState {
  return {
    eventCode: "WEST26",
    eventTitle: "MGSOSA West Game Night",
    phase: "jeopardy",
    phaseStartedAt: now,
    activeRoomMessage: "Main event • Bible Jeopardy",
    teams,
    players: [
      { id: "player-maya", name: "Maya", church: "St. Mary’s", teamId: "pacific", role: "participant", connected: true },
      { id: "player-noah", name: "Noah", church: "St. George", teamId: "sierra", role: "participant", connected: true },
      { id: "player-sarah", name: "Sarah", church: "St. Thomas", teamId: "desert", role: "participant", connected: true },
      { id: "player-daniel", name: "Daniel", church: "St. Peter", teamId: "valley", role: "participant", connected: true },
    ],
    breakoutRooms: [
      { id: "room-imposter-a", name: "Imposter • Pacific", game: "imposter", code: "48215", hostName: "Room host needed", status: "open", rotationGroups: ["A", "C"] },
      { id: "room-gartic-a", name: "Gartic • Sierra", game: "gartic", code: "73106", hostName: "Room host needed", status: "open", rotationGroups: ["B", "D"] },
    ],
    questions,
    scoreLedger: [
      { id: "seed-score-1", teamId: "pacific", delta: 300, reason: "Imposter round", createdAt: now - 1200000 },
      { id: "seed-score-2", teamId: "sierra", delta: 200, reason: "Gartic favorite", createdAt: now - 900000 },
      { id: "seed-score-3", teamId: "desert", delta: 250, reason: "Imposter round", createdAt: now - 600000 },
      { id: "seed-score-4", teamId: "valley", delta: 150, reason: "Gartic participation", createdAt: now - 300000 },
    ],
    settings: { subtractIncorrect: true, answerSeconds: 12 },
  };
}
