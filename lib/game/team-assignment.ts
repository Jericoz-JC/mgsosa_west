export interface AssignableParticipant {
  id: string;
  name: string;
  church: string;
}

export function recommendedGroupCount(participantCount: number, minimumGroups: number, targetSize: number, maximumGroups = 8) {
  if (participantCount <= 0) return minimumGroups;
  return Math.min(maximumGroups, participantCount, Math.max(minimumGroups, Math.ceil(participantCount / targetSize)));
}

/**
 * Deterministic least-loaded assignment with a church-diversity tie breaker.
 * Complexity is O(participants × groups); groups are capped at eight in the UI.
 */
export function balanceParticipants<T extends AssignableParticipant>(participants: T[], groupCount: number): T[][] {
  if (groupCount < 1) return [];
  const churchTotals = new Map<string, number>();
  for (const player of participants) churchTotals.set(player.church, (churchTotals.get(player.church) ?? 0) + 1);
  const ordered = [...participants].sort((a, b) =>
    (churchTotals.get(b.church) ?? 0) - (churchTotals.get(a.church) ?? 0) ||
    a.church.localeCompare(b.church) ||
    a.name.localeCompare(b.name) ||
    a.id.localeCompare(b.id),
  );
  const groups = Array.from({ length: groupCount }, (_, index) => ({ index, members: [] as T[], churches: new Map<string, number>() }));
  for (const player of ordered) {
    const destination = [...groups].sort((a, b) =>
      a.members.length - b.members.length ||
      (a.churches.get(player.church) ?? 0) - (b.churches.get(player.church) ?? 0) ||
      a.index - b.index,
    )[0];
    destination.members.push(player);
    destination.churches.set(player.church, (destination.churches.get(player.church) ?? 0) + 1);
  }
  return groups.map((group) => group.members);
}
