export function generateRoomCode(
  length = 5,
  randomInt: (maximum: number) => number = defaultRandomInt,
) {
  if (!Number.isInteger(length) || length < 4 || length > 6) {
    throw new RangeError("Room codes must contain 4 to 6 digits.");
  }

  const first = randomInt(9) + 1;
  let code = String(first);
  while (code.length < length) code += String(randomInt(10));
  return code;
}

export function generateUniqueRoomCode(
  existingCodes: Iterable<string>,
  length = 5,
  randomInt?: (maximum: number) => number,
) {
  const existing = new Set(existingCodes);
  for (let attempt = 0; attempt < 25; attempt += 1) {
    const candidate = generateRoomCode(length, randomInt);
    if (!existing.has(candidate)) return candidate;
  }
  throw new Error("Unable to create a unique room code. Try again.");
}

function defaultRandomInt(maximum: number) {
  if (typeof crypto !== "undefined" && "getRandomValues" in crypto) {
    const value = new Uint32Array(1);
    crypto.getRandomValues(value);
    return value[0] % maximum;
  }
  return Math.floor(Math.random() * maximum);
}
