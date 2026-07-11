import type { EventState, JeopardyQuestion, Team } from "./types";

export const teams: Team[] = [
  { id: "pacific", name: "Pacific Blue", shortName: "Pacific", color: "#1d75bd", accent: "#8dd4ff" },
  { id: "sierra", name: "Sierra Gold", shortName: "Sierra", color: "#d69b2d", accent: "#ffe19a" },
  { id: "desert", name: "Desert Coral", shortName: "Desert", color: "#d45e50", accent: "#ffc1b8" },
  { id: "valley", name: "Valley Green", shortName: "Valley", color: "#39816b", accent: "#a7e1ce" },
];

const roundOneCategories = [
  {
    name: "Holy Qurbana Essentials",
    items: [
      [100, "Meaning ‘offering of sacrifice,’ this Syriac word names the Holy Qurbana.", "Qurbana", "HQ-003", "Ages 9-12"],
      [200, "Holy Qurbana commemorates Christ’s birth, ministry, death, resurrection, and this promised event.", "The Second Coming", "HQ-002", "Ages 9-12"],
      [300, "These two primary sacramental elements are used for Holy Qurbana.", "Leavened bread and wine mixed with water", "HQ-008", "Ages 13-17"],
      [400, "Known as the Queen of Sacraments, this sacrament is the focus of the study guide.", "Holy Qurbana / Holy Communion", "HQ-004", "Ages 13-17"],
      [500, "Name the four components of Holy Qurbana listed in the source.", "Celebrant; sacramental items; Book of Holy Liturgy; recipient", "HQ-006", "Ages 18-25"],
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
      [200, "Name the two parts of the public celebration of Holy Qurbana.", "Mass of the Catechumens and Anaphora of the Faithful", "HQ-076", "Ages 13-17"],
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

const roundOneQuestions: JeopardyQuestion[] = roundOneCategories.flatMap((category, categoryIndex) =>
  category.items.map(([value, clue, answer, sourceId, ageBand], rowIndex) => ({
    id: `q-${categoryIndex + 1}-${rowIndex + 1}`,
    category: category.name,
    value,
    clue,
    answer,
    sourceId,
    ageBand,
    used: false,
    round: 1,
  })),
);

const roundTwoCategories = [
  ["Holy Qurbana Basics", [
    [100, "Jesus established the Holy Qurbana at this meal with His disciples.", "The Last Supper", "HQ2-001", "Ages 9-12"],
    [200, "This title for the Holy Qurbana means it is the greatest of the Church's sacraments.", "The Queen of Sacraments", "HQ2-004", "Ages 9-12"],
    [300, "The bread used for the Holy Qurbana is called this Syriac name.", "Lahmo", "HQ2-055", "Ages 13-17"],
    [400, "Name the two gifts placed on the Tablitho during the Holy Qurbana.", "The paten and chalice", "HQ2-030", "Ages 13-17"],
    [500, "This preparation service of prayers takes place before the public Holy Qurbana.", "Thuyobo (preparation prayers)", "HQ2-068", "Ages 13-17"],
  ]],
  ["Inside the Church", [
    [100, "This central part of the church is where the congregation stands or sits.", "The nave", "HQ2-014", "Ages 9-12"],
    [200, "The Madbaho, or sanctuary, represents this hill where Jesus was crucified.", "Golgotha (Calvary)", "HQ2-016", "Ages 9-12"],
    [300, "This stand holds the Gospel book and is sometimes called the second thronos.", "The lectern or Gospel stand", "HQ2-043", "Ages 13-17"],
    [400, "The twelve bells on the censer remind us of this group.", "The twelve Apostles", "HQ2-047", "Ages 13-17"],
    [500, "Removing shoes before entering the sanctuary expresses this attitude toward God.", "Reverence", "HQ2-065", "Ages 13-17"],
  ]],
  ["Words We Hear", [
    [100, "What does 'Halleluiah' mean?", "Praise the Lord", "HQ2-168", "Ages 9-12"],
    [200, "What does 'Barekmor' mean?", "Bless me, O Lord", "HQ2-153", "Ages 9-12"],
    [300, "This Syriac word means 'Gospel.'", "Evangelion", "HQ2-166", "Ages 13-17"],
    [400, "This word names the long prayer that follows the preface.", "Sedro", "HQ2-204", "Ages 13-17"],
    [500, "This concluding prayer of the service is called what?", "Hoothomo", "HQ2-170", "Ages 13-17"],
  ]],
  ["Worship in Action", [
    [100, "Before Holy Communion, we prepare through prayer, Scripture, and this quiet practice.", "Meditation", "HQ2-056", "Ages 9-12"],
    [200, "The traditional fast before receiving Holy Communion begins at this time.", "Midnight", "HQ2-060", "Ages 9-12"],
    [300, "The Kiss of Peace calls worshippers to this relationship with one another.", "Peace and reconciliation", "HQ2-103", "Ages 13-17"],
    [400, "The invocation asks the Father to send whom upon the bread and wine?", "The Holy Spirit", "HQ2-111", "Ages 13-17"],
    [500, "The words 'Until I come' point the Church toward this promised event.", "The Second Coming", "HQ2-109", "Ages 13-17"],
  ]],
  ["Bible & Creed", [
    [100, "The first four books of the New Testament are known together by this name.", "The Gospels", "SS2-B01", "Ages 9-12"],
    [200, "This saint's Upper Room is associated with the Last Supper tradition.", "St. Mark", "HQ2-011", "Ages 9-12"],
    [300, "The Nicene Creed was first formulated at this council in A.D. 325.", "The Council of Nicaea", "HQ2-097", "Ages 13-17"],
    [400, "In the Creed, we confess one baptism for this purpose.", "The remission (forgiveness) of sins", "HQ2-099", "Ages 13-17"],
    [500, "Name the three ecumenical councils received by the Oriental Orthodox Church.", "Nicaea, Constantinople, and Ephesus", "HQ2-143", "Ages 13-17"],
  ]],
  ["Signs of Hope", [
    [100, "Lighted candles in the sanctuary remind us of whose presence?", "God's presence", "HQ2-023", "Ages 9-12"],
    [200, "Opening the sanctuary veil is a sign that this has been opened to us.", "Heaven", "HQ2-020", "Ages 9-12"],
    [300, "The Kaukbo, or star over the paten, recalls this event in Jesus' life.", "The Nativity", "HQ2-037", "Ages 13-17"],
    [400, "The ringing of bells during Anpudayone proclaims this victory of Christ.", "The Resurrection", "HQ2-120", "Ages 13-17"],
    [500, "The Elevation of the Holy Mysteries points to this event after the Resurrection.", "The Ascension of our Lord", "HQ2-124", "Ages 13-17"],
  ]],
] as const;

const roundTwoQuestions: JeopardyQuestion[] = roundTwoCategories.flatMap(([category, items], categoryIndex) =>
  items.map(([value, clue, answer, sourceId, ageBand], rowIndex) => ({
    id: `q-2-${categoryIndex + 1}-${rowIndex + 1}`,
    category,
    value,
    clue,
    answer,
    sourceId,
    ageBand,
    used: false,
    round: 2,
  })),
);

export const questions: JeopardyQuestion[] = [...roundOneQuestions, ...roundTwoQuestions];

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
      { id: "room-imposter-a", name: "Imposter • Pacific", game: "imposter", code: "48215", hostName: "Room host needed", status: "open", rotationGroups: ["A", "C"], capacity: 12 },
      { id: "room-gartic-a", name: "Gartic • Sierra", game: "gartic", code: "73106", hostName: "Room host needed", status: "open", rotationGroups: ["B", "D"], capacity: 12 },
    ],
    questions,
    jeopardyRound: 1,
    scoreLedger: [
      { id: "seed-score-1", teamId: "pacific", delta: 300, reason: "Imposter round", createdAt: now - 1200000 },
      { id: "seed-score-2", teamId: "sierra", delta: 200, reason: "Gartic favorite", createdAt: now - 900000 },
      { id: "seed-score-3", teamId: "desert", delta: 250, reason: "Imposter round", createdAt: now - 600000 },
      { id: "seed-score-4", teamId: "valley", delta: 150, reason: "Gartic participation", createdAt: now - 300000 },
    ],
    settings: { subtractIncorrect: true, answerSeconds: 12 },
  };
}
