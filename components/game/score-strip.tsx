import { getTeamScore } from "@/lib/game/engine";
import type { EventState } from "@/lib/game/types";

export function ScoreStrip({ state, compact = false }: { state: EventState; compact?: boolean }) {
  return (
    <div className={compact ? "score-strip score-strip-compact" : "score-strip"}>
      {state.teams.map((team) => (
        <div className="score-chip" style={{ "--team-color": team.color } as React.CSSProperties} key={team.id}>
          <span>{team.shortName}</span>
          <strong>{getTeamScore(state, team.id)}</strong>
        </div>
      ))}
    </div>
  );
}
