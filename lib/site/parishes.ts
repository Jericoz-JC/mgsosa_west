export interface Parish {
  id: string;
  /** Short label used in check-in dropdowns and score rosters. */
  shortName: string;
  name: string;
  city: string;
  state: string;
}

/** The nine parishes that make up the MGSOSA West Leadership Team. */
export const parishes: Parish[] = [
  { id: "phoenix", shortName: "St. Peter’s Phoenix", name: "St. Peter’s Syrian Orthodox Church", city: "Phoenix", state: "AZ" },
  { id: "san-diego", shortName: "St. Ignatius’ San Diego", name: "St. Ignatius Syriac Orthodox Congregation", city: "San Diego", state: "CA" },
  { id: "los-angeles", shortName: "St. Mary’s Los Angeles", name: "St. Mary’s Syrian Orthodox Church", city: "Los Angeles", state: "CA" },
  { id: "sacramento", shortName: "St. Basil’s Sacramento", name: "St. Basil’s Syriac Orthodox Congregation", city: "Sacramento", state: "CA" },
  { id: "bay-area", shortName: "St. Mary’s Livermore", name: "St. Mary’s Syriac Orthodox Church", city: "San Francisco Bay Area", state: "CA" },
  { id: "san-jose", shortName: "St. Stephen’s San Jose", name: "St. Stephen’s Syriac Orthodox Church", city: "San Jose", state: "CA" },
  { id: "denver", shortName: "St. Mary’s Denver", name: "St. Mary’s Syrian Orthodox Church", city: "Denver", state: "CO" },
  { id: "portland", shortName: "St. Ignatius’ Portland", name: "St. Ignatius Syriac Orthodox Congregation", city: "Portland", state: "OR" },
  { id: "seattle", shortName: "St. George’s Seattle", name: "St. George Syrian Orthodox Church", city: "Seattle", state: "WA" },
];
