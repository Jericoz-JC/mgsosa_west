export type QuestionStatus = "submitted" | "open" | "answered" | "hidden";

export type ClergyRole = "priest" | "bishop" | "guest-speaker";

export interface QAAnswer {
  body: string;
  role: ClergyRole;
  /** e.g. "Fr. Lazarus Yassa". Only displayed when showName is true. */
  name?: string;
  showName: boolean;
  /** Optional context such as "Saturday Q&A panel". */
  session?: string;
  answeredAt: number;
}

export interface QAQuestion {
  id: string;
  body: string;
  /** Conference slug or "general". */
  conference: string;
  topic: string;
  status: QuestionStatus;
  source: "community" | "admin";
  /** Asker's first name when they chose to share it. */
  askerName?: string;
  askerChurch?: string;
  answer?: QAAnswer;
  votes: number;
  /** Admin view only: the status a hidden question returns to on Restore. */
  restoreTo?: Exclude<QuestionStatus, "hidden">;
  createdAt: number;
}

export interface AskInput {
  body: string;
  conference: string;
  topic: string;
  askerName?: string;
  askerChurch?: string;
}

export interface AdminSaveInput {
  id?: string;
  body: string;
  conference: string;
  topic: string;
  status: Exclude<QuestionStatus, "submitted"> | "submitted";
  answer?: Omit<QAAnswer, "answeredAt">;
}

export const clergyRoleLabel: Record<ClergyRole, string> = {
  priest: "Priest",
  bishop: "Bishop",
  "guest-speaker": "Guest speaker",
};
