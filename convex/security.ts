import { ConvexError } from "convex/values";

export function assertHostPin(hostPin: string) {
  const expected = process.env.HOST_PIN;
  if (!expected) throw new ConvexError("HOST_PIN is not configured for this deployment.");
  if (hostPin !== expected) throw new ConvexError("Host access denied.");
}

export function assertRoomPin(roomPin: string) {
  const expected = process.env.ROOM_PIN;
  if (!expected) throw new ConvexError("ROOM_PIN is not configured for this deployment.");
  if (roomPin !== expected) throw new ConvexError("Room staff access denied.");
}

export function assertStaffPin(staffPin: string) {
  const hostPin = process.env.HOST_PIN;
  const roomPin = process.env.ROOM_PIN;
  if (!hostPin || !roomPin) {
    throw new ConvexError("Staff PINs are not configured for this deployment.");
  }
  if (staffPin !== hostPin && staffPin !== roomPin) {
    throw new ConvexError("Staff access denied.");
  }
}

export function normalizeCode(code: string) {
  return code.trim().toUpperCase();
}
