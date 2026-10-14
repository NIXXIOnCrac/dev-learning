import test from "node:test";
import assert from "node:assert/strict";
import {
  DAY,
  recordReview,
  reviewFor,
  reviewQueue,
  recommendations,
} from "../src/learning.js";
import { explainError } from "../src/feedback.js";
const now = Date.parse("2026-10-13T12:00:00Z");
const makeState = () => ({
  completed: [],
  reviewed: {},
  reviewSchedule: {},
  skills: {},
  xp: 0,
});
function pass(state, at = now, mode = "learn") {
  recordReview(state, "first-line", { passed: true, mode }, at);
  if (!state.completed.includes("first-line"))
    state.completed.push("first-line");
}
test("completion creates an immediate first recall check without awarding review XP", () => {
  const s = makeState();
  pass(s);
  const q = reviewQueue(s, now);
  assert.equal(q.length, 1);
  assert.equal(q[0].stage, 0);
  assert.equal(q[0].due, true);
  assert.equal(recommendations(s, now)[0].mode, "exam");
  assert.equal(s.xp, 0);
});
test("spaced independent successes schedule 1, 3, and 7 days, never rapid duplicate mastery", () => {
  const s = makeState();
  pass(s);
  pass(s, now, "exam");
  assert.equal(
    s.reviewSchedule["first-line"].dueAt,
    new Date(now + DAY).toISOString(),
  );
  assert.equal(s.reviewSchedule["first-line"].stage, 1);
  pass(s, now + 1000, "exam");
  assert.equal(s.reviewSchedule["first-line"].stage, 1);
  assert.equal(
    s.reviewSchedule["first-line"].dueAt,
    new Date(now + DAY).toISOString(),
  );
  pass(s, now + DAY, "exam");
  assert.equal(s.reviewSchedule["first-line"].stage, 2);
  assert.equal(
    s.reviewSchedule["first-line"].dueAt,
    new Date(now + 4 * DAY).toISOString(),
  );
  pass(s, now + 4 * DAY, "exam");
  assert.equal(s.reviewSchedule["first-line"].stage, 3);
  assert.equal(
    s.reviewSchedule["first-line"].dueAt,
    new Date(now + 11 * DAY).toISOString(),
  );
  assert.equal(reviewQueue(s, now + 4 * DAY)[0].status, "Retained");
});
test("a miss recommends a supported warm-up and keeps earned XP", () => {
  const s = makeState();
  pass(s);
  s.xp = 50;
  pass(s, now, "exam");
  recordReview(s, "first-line", { passed: false, mode: "exam" }, now + DAY);
  assert.equal(s.reviewSchedule["first-line"].stage, 0);
  assert.equal(s.reviewSchedule["first-line"].needsPractice, true);
  assert.equal(s.reviewSchedule["first-line"].lapses, 1);
  assert.equal(s.xp, 50);
  assert.equal(recommendations(s, now + DAY)[0].mode, "practice");
  pass(s, now + DAY + 60000, "practice");
  assert.equal(s.reviewSchedule["first-line"].stage, 0);
  assert.equal(s.reviewSchedule["first-line"].needsPractice, false);
  assert.equal(reviewQueue(s, now + DAY + 60000)[0].due, true);
});
test("reading or successful guided practice never advances independent recall", () => {
  const s = makeState();
  pass(s);
  const before = structuredClone(s);
  reviewQueue(s, now);
  recommendations(s, now);
  assert.deepEqual(s, before);
  pass(s, now + DAY, "practice");
  assert.equal(s.reviewSchedule["first-line"].stage, 0);
  assert.equal(reviewQueue(s, now + DAY)[0].due, true);
});
test("legacy reviews migrate lazily without deleting existing progress", () => {
  const s = makeState();
  s.completed = ["first-line"];
  s.reviewed["first-line"] = new Date(now).toISOString();
  s.xp = 50;
  assert.equal(reviewFor(s, "first-line", now).stage, 1);
  assert.equal(reviewQueue(s, now)[0].due, false);
  assert.equal(s.xp, 50);
  assert.deepEqual(s.reviewSchedule, {});
  assert.equal(reviewQueue(s, now + DAY)[0].due, true);
});
test("new and struggling learners receive a concrete unlocked next step", () => {
  const s = makeState();
  recordReview(s, "first-line", { passed: false, mode: "learn" }, now);
  assert.equal(reviewQueue(s, now).length, 0);
  assert.equal(recommendations(s, now)[0].id, "first-line");
  assert.equal(recommendations(s, now)[0].mode, "learn");
  pass(s);
  pass(s, now, "exam");
  assert.equal(recommendations(s, now)[0].id, "variables");
});
test("error coaching explains the real failure without writing a solution", () => {
  const result = explainError(
    "File \"student.py\", line 7\nNameError: name 'prnt' is not defined",
  );
  assert.equal(result.line, 7);
  assert.match(result.summary, /name was used/);
  assert.match(result.nextStep, /spelling/);
  assert.match(
    explainError("JSONDecodeError: missing quotes").summary,
    /not valid JSON/,
  );
  assert.match(
    explainError("IndentationError: unexpected indent").summary,
    /indentation/,
  );
  assert.equal(explainError(null), null);
});
test("review schedules and recommendations keep JavaScript skills separate", () => {
  const s = makeState();
  s.activeCourse = "javascript";
  assert.equal(recommendations(s, now)[0].id, "js-first-line");
  recordReview(s, "js-first-line", { passed: true, mode: "learn" }, now);
  s.completed.push("js-first-line");
  assert.equal(reviewQueue(s, now)[0].lesson.language, "javascript");
  recordReview(s, "js-first-line", { passed: true, mode: "exam" }, now);
  assert.equal(recommendations(s, now)[0].id, "js-values");
  assert.equal(reviewFor(s, "first-line", now), null);
  assert.equal(s.reviewSchedule["js-first-line"].stage, 1);
});
test("JavaScript error coaching does not prescribe Python syntax", () => {
  const reference = explainError(
    "ReferenceError: score is not defined\n at eval (student.js:5:3)",
    "javascript",
  );
  assert.equal(reference.line, 2);
  assert.match(reference.summary, /name is missing/);
  const type = explainError(
    "TypeError: Assignment to constant variable.",
    "javascript",
  );
  assert.match(type.nextStep, /const/);
  assert.doesNotMatch(type.nextStep, /type\(value\)/);
  const syntax = explainError("SyntaxError: Unexpected token", "javascript");
  assert.match(syntax.summary, /JavaScript/);
});
