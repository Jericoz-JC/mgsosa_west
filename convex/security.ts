import { ConvexError } from "convex/values";

export function assertHostPin(hostPin: string) {
  const expected = process.env.HOST_PIN;
  if (!expected) throw new ConvexError("HOST_PIN is not configured for this deployment.");
  if (hostPin !== expected) throw new ConvexError("Host access denied.");
}

export function normalizeCode(code: string) {
  return code.trim().toUpperCase();
}
