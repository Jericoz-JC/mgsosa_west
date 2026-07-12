"use client";

import { useState } from "react";
import { Check, Clipboard, Shuffle, Users } from "lucide-react";
import { useGame } from "@/components/game/game-provider";
import styles from "./team-assignment-console.module.css";

export function TeamAssignmentConsole() {
  const { state, assignBalancedTeams } = useGame();
  const [minimumGroups, setMinimumGroups] = useState(2);
  const [targetSize, setTargetSize] = useState(10);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string>();
  const [copied, setCopied] = useState<string>();
  const participants = state.players.filter((player) => player.role === "participant");
  const recommended = participants.length
    ? Math.min(8, participants.length, Math.max(minimumGroups, Math.ceil(participants.length / targetSize)))
    : minimumGroups;
  const projectedSizes = Array.from({ length: recommended }, (_, index) =>
    Math.floor(participants.length / recommended) + (index < participants.length % recommended ? 1 : 0),
  );
  const unassigned = participants.filter((player) => !player.teamId);
  const grouped = state.teams.map((team) => ({
    team,
    members: participants.filter((player) => player.teamId === team.id).sort((a, b) => a.name.localeCompare(b.name)),
  }));

  function rosterText(teamId?: string) {
    const selections = teamId ? grouped.filter(({ team }) => team.id === teamId) : grouped;
    return selections
      .filter(({ members }) => members.length)
      .map(({ team, members }) => [
        `${team.name.toUpperCase()} — ${members.length} people`,
        ...members.map((member, index) => `${index + 1}. ${member.name} — ${member.church}`),
      ].join("\n"))
      .join("\n\n");
  }

  async function copyRoster(key: string, teamId?: string) {
    const text = rosterText(teamId);
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(key);
    window.setTimeout(() => setCopied(undefined), 1800);
  }

  async function assign() {
    setBusy(true); setMessage(undefined);
    try {
      const result = await assignBalancedTeams(minimumGroups, targetSize);
      setMessage(`Assigned ${result.participantCount} people across ${result.groupCount} groups: ${result.sizes.join(" / ")}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Teams could not be assigned.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={styles.console}>
      <div className={styles.intro}>
        <div>
          <p className="eyebrow">Team builder</p>
          <h2>Check in first. Balance once.</h2>
          <p>Participants may join without a team. When attendance is stable, create the smallest even set of Zoom-ready groups.</p>
        </div>
        <div className={styles.headcount}><Users aria-hidden /><strong>{participants.length}</strong><span>checked in</span></div>
      </div>

      <div className={styles.builder}>
        <label>Minimum groups
          <select value={minimumGroups} onChange={(event) => setMinimumGroups(Number(event.target.value))}>
            {[2, 3, 4, 5, 6, 7, 8].map((count) => <option key={count} value={count}>{count}</option>)}
          </select>
        </label>
        <label>Target people per group
          <select value={targetSize} onChange={(event) => setTargetSize(Number(event.target.value))}>
            {[4, 6, 8, 10, 12, 14, 16].map((size) => <option key={size} value={size}>{size}</option>)}
          </select>
        </label>
        <div className={styles.preview}>
          <span>Recommended result</span>
          <strong>{recommended} groups</strong>
          <small>{projectedSizes.length ? projectedSizes.join(" · ") : "Waiting for check-in"} people</small>
        </div>
        <button className="button button-gold" disabled={busy || participants.length < 2} onClick={assign} type="button">
          <Shuffle size={18} /> {busy ? "Balancing…" : unassigned.length ? "Assign everyone" : "Rebalance everyone"}
        </button>
      </div>
      <p className={styles.algorithmNote}>The assignment spreads the largest church groups first, always placing the next person in the smallest team. One server operation; no paid optimization service.</p>
      {message ? <p className={styles.message} role="status">{message}</p> : null}

      <div className={styles.rosterHeader}>
        <div><span>Organizer roster</span><strong>{unassigned.length ? `${unassigned.length} waiting for assignment` : "Ready for Zoom breakout setup"}</strong></div>
        <button disabled={!grouped.some(({ members }) => members.length)} onClick={() => copyRoster("all")} type="button">
          {copied === "all" ? <Check size={16} /> : <Clipboard size={16} />} {copied === "all" ? "Copied" : "Copy all groups"}
        </button>
      </div>

      <div className={styles.teamGrid}>
        {grouped.map(({ team, members }) => (
          <article key={team.id} style={{ "--team-color": team.color, "--team-accent": team.accent } as React.CSSProperties}>
            <header><div><span>{members.length} people</span><h3>{team.name}</h3></div><button disabled={!members.length} onClick={() => copyRoster(team.id, team.id)} type="button" aria-label={`Copy ${team.name} roster`}>{copied === team.id ? <Check size={16} /> : <Clipboard size={16} />}</button></header>
            {members.length ? <ol>{members.map((member) => <li key={member.id}><span>{member.name}</span><small>{member.church}</small></li>)}</ol> : <p>No participants assigned.</p>}
          </article>
        ))}
        {unassigned.length ? <article className={styles.unassigned}><header><div><span>Not announced yet</span><h3>Waiting room</h3></div></header><ol>{unassigned.map((member) => <li key={member.id}><span>{member.name}</span><small>{member.church}</small></li>)}</ol></article> : null}
      </div>
    </section>
  );
}
