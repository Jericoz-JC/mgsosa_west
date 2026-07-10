export function sessionTokenStorageKey(eventCode: string) {
  return `mgsosa-west-session-token:${eventCode.trim().toUpperCase()}`;
}

export function sessionBelongsToEvent(
  sessionEventId: string | undefined,
  currentEventId: string | undefined,
) {
  return Boolean(
    sessionEventId && currentEventId && sessionEventId === currentEventId,
  );
}
