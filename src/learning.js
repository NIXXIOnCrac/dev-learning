import { orderedLessons, nextLessonFor } from "./content.js";

export const DAY = 86_400_000;
export const REVIEW_INTERVALS = [1, 3, 7, 14, 30, 60];
const iso = (value) => new Date(value).toISOString();

// Legacy profiles are read lazily. No XP, drafts, or achievements are discarded.
export function reviewFor(state, lessonId, now = Date.now()) {
  const stored = state.reviewSchedule?.[lessonId];
  if (stored) return stored;
  if (!state.completed.includes(lessonId)) return null;
  const reviewed = state.reviewed?.[lessonId];
  return {
    stage: reviewed ? 1 : 0,
    dueAt: reviewed ? iso(new Date(reviewed).getTime() + DAY) : iso(now),
    lastReviewAt: reviewed || null,
    lastAttemptAt: null,
    lapses: 0,
    needsPractice: false,
  };
}

// Called only after a submitted exercise is graded. Reading, tracing, and hint
// clicks cannot complete a review. Same-day repeat successes do not farm retention.
export function recordReview(
  state,
  lessonId,
  { passed, mode },
  now = Date.now(),
) {
  const previous = reviewFor(state, lessonId, now);
  if (!previous && !passed) return;
  const next = {
    stage: 0,
    dueAt: iso(now),
    lastReviewAt: null,
    lapses: 0,
    needsPractice: false,
    ...previous,
    lastAttemptAt: iso(now),
  };
  if (!passed) {
    next.needsPractice = true;
    next.stage = 0;
    next.dueAt = iso(now + 10 * 60_000);
    if (mode === "exam") {
      next.stage = 0;
      next.lapses += 1;
    }
  } else if (
    mode === "exam" &&
    (next.needsPractice || new Date(next.dueAt).getTime() <= now)
  ) {
    const interval =
      REVIEW_INTERVALS[Math.min(next.stage, REVIEW_INTERVALS.length - 1)];
    next.stage = Math.min(next.stage + 1, REVIEW_INTERVALS.length);
    next.dueAt = iso(now + interval * DAY);
    next.lastReviewAt = iso(now);
    next.needsPractice = false;
  } else if (passed && next.needsPractice) {
    next.needsPractice = false;
    next.dueAt = iso(now); // guided recovery is useful, but isn't independent recall
  }
  state.reviewSchedule ||= {};
  state.reviewSchedule[lessonId] = next;
}

export function reviewQueue(state, now = Date.now()) {
  return orderedLessons
    .filter((l) => state.completed.includes(l.id))
    .map((lesson) => {
      const review = reviewFor(state, lesson.id, now);
      return {
        lesson,
        ...review,
        due: new Date(review.dueAt).getTime() <= now,
        status: review.needsPractice
          ? "Needs a warm-up"
          : review.stage >= 3
            ? "Retained"
            : review.stage
              ? "Building recall"
              : "Ready for recall",
      };
    })
    .sort(
      (a, b) =>
        Number(b.needsPractice) - Number(a.needsPractice) ||
        new Date(a.dueAt) - new Date(b.dueAt),
    );
}

export function recommendations(state, now = Date.now()) {
  const queue = reviewQueue(state, now);
  const recovery = queue
    .filter((r) => r.needsPractice)
    .map((r) => ({
      ...r.lesson,
      mode: "practice",
      reason:
        "A recent attempt was tricky. Work through it with hints before another recall check.",
    }));
  const due = queue
    .filter((r) => r.due && !r.needsPractice)
    .map((r) => ({
      ...r.lesson,
      mode: "exam",
      reason: r.stage
        ? "Your next spaced review is due. Try it without hints to strengthen recall."
        : "You solved this. Now try writing it from a blank editor.",
    }));
  const next = nextLessonFor(state);
  const learning = next
    ? [
        {
          ...next,
          mode: "learn",
          reason: state.skills[next.concept]?.lastError
            ? "Pick up where you got stuck. Revisit the explanation, then try one small change."
            : "Your next unlocked concept builds on what you already know.",
        },
      ]
    : [];
  return [...recovery, ...due, ...learning].slice(0, 5);
}
