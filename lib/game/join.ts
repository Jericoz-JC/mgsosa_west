import { z } from "zod";

export const joinSchema = z.object({
  eventCode: z
    .string()
    .trim()
    .min(4, "Enter the event code shown in Zoom.")
    .max(10)
    .transform((value) => value.toUpperCase()),
  name: z.string().trim().min(2, "Enter your first name or nickname.").max(32),
  church: z.string().trim().min(2, "Choose or enter your church.").max(64),
});

export type JoinInput = z.input<typeof joinSchema>;
export type JoinDetails = z.output<typeof joinSchema>;

export function safeJoin(input: JoinInput) {
  return joinSchema.safeParse(input);
}
