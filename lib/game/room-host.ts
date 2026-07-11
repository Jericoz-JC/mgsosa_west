const ROOM_HOST_TOKEN_BYTES = 24;
const ROOM_HOST_TOKEN_PATTERN = /^[a-f0-9]{48}$/;

export const ROOM_HOST_SESSION_KEY = "mgsosa-west-room-host-token";

type FillRandomValues = (values: Uint8Array) => Uint8Array;

export function generateRoomHostToken(fillRandomValues: FillRandomValues = defaultFillRandomValues) {
  const values = fillRandomValues(new Uint8Array(ROOM_HOST_TOKEN_BYTES));
  return Array.from(values, (value) => value.toString(16).padStart(2, "0")).join("");
}

export function isRoomHostToken(value: string) {
  return ROOM_HOST_TOKEN_PATTERN.test(value);
}

export function buildRoomHostLink(
  origin: string,
  token: string,
  navigationVersion = Date.now().toString(36),
) {
  if (!isRoomHostToken(token)) throw new Error("Invalid room-host token.");
  const url = new URL("/room", origin);
  // The non-secret version forces a real navigation when a revoked link is
  // replaced in the same browser tab. The bearer token remains fragment-only.
  url.searchParams.set("v", navigationVersion);
  url.hash = `host=${token}`;
  return url.toString();
}

export function roomHostTokenFromHash(hash: string) {
  const params = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
  const token = params.get("host") ?? "";
  return isRoomHostToken(token) ? token : null;
}

function defaultFillRandomValues(values: Uint8Array) {
  if (typeof crypto === "undefined" || !("getRandomValues" in crypto)) {
    throw new Error("Secure random values are not available in this browser.");
  }
  return crypto.getRandomValues(values);
}
