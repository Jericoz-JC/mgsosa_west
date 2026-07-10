import type { EventState } from "@/lib/game/types";
import styles from "./jeopardy-board.module.css";

export function JeopardyBoard({
  state,
  onSelect,
  displayOnly = false,
}: {
  state: EventState;
  onSelect?: (questionId: string) => void;
  displayOnly?: boolean;
}) {
  const categories = Array.from(new Set(state.questions.map((question) => question.category)));

  return (
    <div className={`${styles.boardScroller} ${displayOnly ? styles.displayOnly : ""}`}>
      <div className={styles.board}>
        {categories.map((category) => (
          <section className={styles.category} key={category}>
            <h3>{category}</h3>
            {state.questions
              .filter((question) => question.category === category)
              .sort((a, b) => a.value - b.value)
              .map((question) => {
                const selected = question.id === state.currentQuestionId;
                return (
                  <button
                    className={`${question.used ? styles.used : ""} ${selected ? styles.selected : ""}`}
                    disabled={displayOnly || question.used}
                    key={question.id}
                    onClick={() => onSelect?.(question.id)}
                    type="button"
                    aria-label={`${category} for ${question.value}${question.used ? ", already used" : ""}`}
                  >
                    {question.used ? <span>Asked</span> : `$${question.value}`}
                  </button>
                );
              })}
          </section>
        ))}
      </div>
    </div>
  );
}
