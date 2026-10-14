import React, { useState } from "react";
import { Icon, Pill, Progress, Empty } from "./ui.jsx";
import { reviewQueue, recommendations, REVIEW_INTERVALS } from "./learning.js";

export function RecommendationCard({ state, onLesson, compact = false }) {
  const recommendation = recommendations(state)[0];
  if (!recommendation) return null;
  return (
    <section className={`recommendation-card ${compact ? "compact" : ""}`}>
      <span className="recommendation-icon">
        <Icon
          name={
            recommendation.mode === "exam"
              ? "reset"
              : recommendation.mode === "practice"
                ? "lightbulb"
                : "route"
          }
          size={22}
        />
      </span>
      <div>
        <div className="eyebrow">
          YOUR NEXT BEST STEP ·{" "}
          {recommendation.mode === "exam"
            ? "RECALL"
            : recommendation.mode === "practice"
              ? "RECOVER"
              : "LEARN"}
        </div>
        <h3>{recommendation.title}</h3>
        <p>{recommendation.reason}</p>
      </div>
      <button
        className="button secondary small"
        onClick={() => onLesson(recommendation, recommendation.mode)}
      >
        {recommendation.mode === "exam"
          ? "Try from memory"
          : recommendation.mode === "practice"
            ? "Warm up"
            : "Start lesson"}
        <Icon name="arrow" size={14} />
      </button>
    </section>
  );
}

export default function ReviewQueue({ state, onLesson }) {
  const [filter, setFilter] = useState("Ready now");
  const queue = reviewQueue(state);
  const due = queue.filter((r) => r.due || r.needsPractice);
  const retained = queue.filter((r) => r.stage >= 3 && !r.needsPractice).length;
  const shown =
    filter === "Ready now"
      ? due
      : filter === "Upcoming"
        ? queue.filter((r) => !r.due && !r.needsPractice)
        : queue;
  return (
    <div className="review-page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">UNDERSTANDING THAT STAYS WITH YOU</div>
          <h1>Make it stick.</h1>
          <p>Remember a little today. Build something bigger tomorrow.</p>
        </div>
        <Pill color="mint">
          <Icon name="reset" size={14} />
          {due.length} ready to revisit
        </Pill>
      </div>
      <div className="review-overview">
        <div>
          <Icon name="book" />
          <strong>{queue.length}</strong>
          <span>concepts introduced</span>
        </div>
        <div>
          <Icon name="clock" />
          <strong>{due.length}</strong>
          <span>ready for practice</span>
        </div>
        <div>
          <Icon name="shield" />
          <strong>{retained}</strong>
          <span>retained over time</span>
        </div>
      </div>
      <RecommendationCard state={state} onLesson={onLesson} />
      <div className="review-layout">
        <section>
          <div className="section-tabs">
            <div>
              {["Ready now", "Upcoming", "All concepts"].map((f) => (
                <button
                  className={f === filter ? "active" : ""}
                  key={f}
                  onClick={() => setFilter(f)}
                >
                  {f}
                </button>
              ))}
            </div>
            <span>No lost XP. No catch-up pressure.</span>
          </div>
          <div className="review-list">
            {shown.length ? (
              shown.map((r) => (
                <article
                  className={`recall-card ${r.needsPractice ? "recovery" : ""}`}
                  key={r.lesson.id}
                >
                  <span className="recall-icon">
                    <Icon
                      name={
                        r.needsPractice
                          ? "lightbulb"
                          : r.stage >= 3
                            ? "shield"
                            : "book"
                      }
                      size={20}
                    />
                  </span>
                  <div className="recall-details">
                    <div>
                      <h3>{r.lesson.concept}</h3>
                      <Pill
                        color={
                          r.needsPractice
                            ? "orange"
                            : r.stage >= 3
                              ? "mint"
                              : "blue"
                        }
                      >
                        {r.status}
                      </Pill>
                    </div>
                    <p>
                      {r.needsPractice
                        ? "A miss is information. Rebuild confidence with hints, then try independently."
                        : r.due
                          ? r.stage
                            ? "Ready for your next spaced recall check."
                            : "Your first independent recall check is ready."
                          : `Next review ${new Date(r.dueAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })} at ${new Date(r.dueAt).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`}
                    </p>
                    <div
                      className="retention-steps"
                      aria-label={`${r.stage} spaced recall stages completed`}
                    >
                      {REVIEW_INTERVALS.map((d, i) => (
                        <span key={d} className={i < r.stage ? "done" : ""}>
                          {i < r.stage ? (
                            <Icon name="check" size={10} />
                          ) : (
                            <i />
                          )}
                          {d}d
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    className="button secondary small"
                    onClick={() =>
                      onLesson(r.lesson, r.needsPractice ? "practice" : "exam")
                    }
                  >
                    {r.needsPractice
                      ? "Warm up"
                      : r.due
                        ? "Recall"
                        : "Practice early"}
                    <Icon name="arrow" size={13} />
                  </button>
                </article>
              ))
            ) : (
              <Empty
                icon={filter === "Upcoming" ? "calendar" : "success"}
                title={
                  queue.length
                    ? "All clear for now."
                    : "Your first concept is waiting."
                }
              >
                {queue.length
                  ? "Use the next-step suggestion or come back when another review is due."
                  : "Complete a lesson to add it to your personal review schedule."}
              </Empty>
            )}
          </div>
        </section>
        <aside className="review-explainer">
          <Icon name="sparkles" size={25} />
          <h3>A little distance helps.</h3>
          <p>
            First, recall a concept from a blank editor. After a successful
            check, come back in 1, 3, 7, 14, 30, then 60 days.
          </p>
          <div>
            <Icon name="check" size={15} />
            <span>
              Correct independent solutions move the schedule forward.
            </span>
          </div>
          <div>
            <Icon name="clock" size={15} />
            <span>
              Practicing early is welcome. It doesn’t skip retention stages.
            </span>
          </div>
          <div>
            <Icon name="lightbulb" size={15} />
            <span>
              A missed check starts a shorter review cycle. Your earned XP
              stays.
            </span>
          </div>
          <div>
            <Icon name="shield" size={15} />
            <span>
              “Retained” means at least three successful, spaced recall
              checks—not three clicks.
            </span>
          </div>
          <p className="review-disclaimer">
            This is a transparent practice heuristic, not a guarantee of
            mastery. Reviews use the same task; transfer to new problems matters
            too.
          </p>
        </aside>
      </div>
    </div>
  );
}
