import test from "node:test";
import assert from "node:assert/strict";
import {
  lessons,
  orderedLessons,
  challenges,
  paths,
  projects,
  pythonLessons,
  courses,
  canStartLesson,
  lessonsForCourse,
  nextLessonFor,
  courseProgress,
} from "../src/content.js";
test("beginner course has complete teaching scaffolding and tests", () => {
  assert.equal(orderedLessons.length, 18);
  assert.equal(pythonLessons.length, 10);
  assert.equal(orderedLessons.length, lessons.length);
  assert.equal(paths[0].lessons, pythonLessons.length);
  for (const lesson of lessons) {
    for (const field of [
      "description",
      "paragraph",
      "example",
      "task",
      "starter",
      "solution",
      "explain",
    ])
      assert.ok(lesson[field], `${lesson.id}: ${field}`);
    assert.ok(lesson.symbols.length >= 4);
    assert.ok(lesson.tests.length >= 2);
    assert.equal(lesson.hints.length, 4);
    assert.ok(lesson.predict.options.includes(lesson.predict.answer));
    assert.ok(lesson.xp > 0);
  }
});
test("functions are taught before conditional function tasks; prerequisites do not deadlock", () => {
  assert.ok(
    orderedLessons.findIndex((l) => l.id === "functions") <
      orderedLessons.findIndex((l) => l.id === "conditions"),
  );
  for (const c of challenges.filter((c) => !c.planned))
    for (const req of c.requires) assert.ok(lessons.some((l) => l.id === req));
  assert.equal(
    new Set([...lessons, ...challenges].map((l) => l.id)).size,
    lessons.length + challenges.length,
  );
});
test("roadmap labels unimplemented chapters honestly and includes broad foundations", () => {
  assert.equal(paths.length, 15);
  assert.equal(paths.filter((p) => p.available).length, 2);
  assert.equal(projects.filter((p) => p.available).length, 2);
  for (const p of paths) assert.ok(p.topics.length >= 4);
});
test("data lessons and capstone are fully scaffolded and respect prerequisite order", () => {
  const order = orderedLessons.map((l) => l.id);
  for (const [before, after] of [
    ["loops", "string-tools"],
    ["string-tools", "dictionaries"],
    ["dictionaries", "json"],
    ["json", "error-handling"],
  ])
    assert.ok(order.indexOf(before) < order.indexOf(after));
  const boss = challenges.find((c) => c.boss);
  assert.equal(boss.id, "inventory-boss");
  assert.deepEqual(boss.requires, ["error-handling"]);
  assert.ok(boss.tests.length >= 6);
  assert.equal(boss.hints.length, 4);
  assert.ok(boss.complexity);
});
test("each course owns its lesson list and prerequisites; JavaScript never grants Python progress", () => {
  const fresh = { completed: [], activeCourse: "javascript" };
  const js = lessonsForCourse("javascript");
  assert.equal(js.length, 8);
  assert.equal(nextLessonFor(fresh).id, "js-first-line");
  assert.equal(canStartLesson(fresh, js[0]), true);
  assert.equal(canStartLesson(fresh, js[1]), false);
  for (const course of courses)
    for (let i = 0; i < course.lessons.length; i++)
      assert.deepEqual(
        course.lessons[i].requires,
        i ? [course.lessons[i - 1].id] : [],
      );
  const completedJS = {
    completed: js.map((l) => l.id),
    activeCourse: "javascript",
  };
  assert.equal(courseProgress(completedJS, "javascript").percent, 100);
  assert.equal(courseProgress(completedJS, "python").completed, 0);
  assert.equal(nextLessonFor(completedJS).id, "first-line");
  assert.equal(
    nextLessonFor({ completed: orderedLessons.map((l) => l.id) }),
    null,
  );
});
test("every available roadmap card reflects its actual course, not a global lesson count", () => {
  for (const path of paths.filter((p) => p.available)) {
    assert.equal(path.lessons, lessonsForCourse(path.courseId).length);
    assert.ok(
      lessonsForCourse(path.courseId).every(
        (l) =>
          l.language === courses.find((c) => c.id === path.courseId).language,
      ),
    );
  }
});
