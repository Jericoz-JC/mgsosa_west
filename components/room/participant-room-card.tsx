"use client";

import { useState } from "react";
import { ArrowRight, Check, ExternalLink, Hash, MessageSquareText, PencilLine, UsersRound } from "lucide-react";
import type { EventPhase, ParticipantRoom } from "@/lib/game/types";
import styles from "./participant-room-card.module.css";

type RotationPhase = Extract<EventPhase, "rotation-one" | "rotation-two">;

interface ParticipantRoomCardProps {
  currentRoom: ParticipantRoom | null | undefined;
  onJoin: (code: string) => Promise<void>;
  phase: RotationPhase;
}

function roomJoinError(error: unknown) {
  const data = error && typeof error === "object" && "data" in error ? error.data : undefined;
  const detail = typeof data === "string" ? data : error instanceof Error ? error.message : "";

  if (/not found|no longer open|not active/i.test(detail)) {
    return "That code is not active. Check the digits with your room host.";
  }
  if (/main event|session/i.test(detail)) {
    return "Your event session expired. Return to the join page, then try this room code again.";
  }
  return "We could not join that room. Check the code and try again.";
}

export function ParticipantRoomCard({ currentRoom, onJoin, phase }: ParticipantRoomCardProps) {
  const [code, setCode] = useState("");
  const [editing, setEditing] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string>();
  const roomClosed = currentRoom?.status === "closed";
  const showForm = !currentRoom || editing || roomClosed;
  const phaseLabel = phase === "rotation-one" ? "Rotation one" : "Rotation two";

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!/^\d{4,6}$/.test(code)) {
      setError("Enter the 4–6 digit code shown by your room host.");
      return;
    }

    setJoining(true);
    setError(undefined);
    try {
      await onJoin(code);
      setCode("");
      setEditing(false);
    } catch (cause) {
      setError(roomJoinError(cause));
    } finally {
      setJoining(false);
    }
  }

  function changeCode(value: string) {
    setCode(value.replace(/\D/g, "").slice(0, 6));
    if (error) setError(undefined);
  }

  if (currentRoom === undefined) {
    return (
      <div className={styles.stage}>
        <div className={`${styles.ticket} ${styles.loadingTicket}`} aria-live="polite" role="status">
          <span className={styles.kicker}>{phaseLabel}</span>
          <h2>Finding your room…</h2>
          <p>Checking this device&apos;s breakout-room pass.</p>
          <span className={styles.loadingLine} aria-hidden />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.stage}>
      <div className={styles.ticket}>
        <div className={styles.ticketHeader}>
          <div>
            <span className={styles.kicker}>{phaseLabel} · Breakout pass</span>
            <p>{showForm ? "Your room host will share this in Zoom." : "Keep this page open during the round."}</p>
          </div>
          <span className={styles.ticketMark} aria-hidden>WEST</span>
        </div>

        {showForm ? (
          <form className={styles.codeForm} onSubmit={submit} noValidate>
            <div className={styles.formCopy}>
              <span className={styles.iconTile}><Hash aria-hidden /></span>
              <div>
                <h2>{roomClosed ? "This room has closed" : editing ? "Switch breakout rooms" : "Join your breakout room"}</h2>
                <p>{roomClosed ? "Ask the Game Master or room host for the next active code." : "Enter the temporary numeric code shared in your Zoom room."}</p>
              </div>
            </div>

            <div className={styles.codeField}>
              <label htmlFor="breakout-room-code">Room code</label>
              <div className={styles.codeInputWrap}>
                <Hash aria-hidden size={24} />
                <input
                  id="breakout-room-code"
                  name="breakoutRoomCode"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={code}
                  onChange={(event) => changeCode(event.target.value)}
                  placeholder="48215"
                  aria-describedby="breakout-room-code-help"
                  aria-invalid={Boolean(error)}
                />
              </div>
              <p id="breakout-room-code-help">4–6 digits · You can paste the code</p>
            </div>

            {error ? <p className={styles.error} role="alert">{error}</p> : null}

            <div className={styles.formActions}>
              <button className="button button-gold" disabled={joining || !/^\d{4,6}$/.test(code)} type="submit">
                {joining ? "Joining room…" : "Join room"} <ArrowRight aria-hidden size={18} />
              </button>
              {currentRoom && !roomClosed ? (
                <button className={styles.cancelButton} onClick={() => { setEditing(false); setError(undefined); setCode(""); }} type="button">
                  Keep current room
                </button>
              ) : null}
            </div>
          </form>
        ) : (
          <div className={styles.roomConfirmation}>
            <span className={styles.admitStamp} role="status"><Check aria-hidden size={17} /> You&apos;re in</span>
            <div className={styles.roomIdentity}>
              <span className={styles.gameIcon}>
                {currentRoom.game === "imposter" ? <UsersRound aria-hidden /> : <PencilLine aria-hidden />}
              </span>
              <div>
                <p>{currentRoom.game === "imposter" ? "Find the Imposter" : "Gartic Phone"}</p>
                <h2>{currentRoom.name}</h2>
                {currentRoom.rotationGroups.length ? <small>Rotation {currentRoom.rotationGroups.join(" · ")}</small> : null}
              </div>
            </div>

            <ol className={styles.instructions}>
              {currentRoom.game === "imposter" ? (
                <>
                  <li><span>1</span><p><strong>Stay in this Zoom breakout.</strong> Your host will set the speaking order.</p></li>
                  <li><span>2</span><p><strong>Watch Zoom private chat.</strong> Your secret word arrives there.</p></li>
                  <li><span>3</span><p><strong>Keep it secret.</strong> Give one-word clues only when called.</p></li>
                </>
              ) : (
                <>
                  <li><span>1</span><p><strong>Stay in this Zoom breakout.</strong> Your host will share the Gartic link.</p></li>
                  <li><span>2</span><p><strong>Use first name + church.</strong> That keeps points easy to track.</p></li>
                  <li><span>3</span><p><strong>New Testament prompts only.</strong> Unmute together for the album reveal.</p></li>
                </>
              )}
            </ol>

            <div className={styles.confirmationActions}>
              {currentRoom.externalUrl ? (
                <a className="button button-gold" href={currentRoom.externalUrl} target="_blank" rel="noreferrer">
                  Open game room <ExternalLink aria-hidden size={17} />
                </a>
              ) : (
                <span className={styles.zoomCue}><MessageSquareText aria-hidden size={17} /> Watch Zoom chat for host instructions</span>
              )}
              <button className={styles.switchButton} onClick={() => setEditing(true)} type="button">Enter a different code</button>
            </div>
          </div>
        )}
      </div>
      <p className={styles.hostNote}>Room codes join a game session only. They never unlock staff controls.</p>
    </div>
  );
}
