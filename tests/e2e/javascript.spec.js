import { test, expect } from "@playwright/test";
import {
  lessonsForCourse,
  challenges,
  courseProgress,
} from "../../src/content.js";
const lessons = lessonsForCourse("javascript");
const byId = (id) => lessons.find((l) => l.id === id);
async function edit(page, code) {
  const input = page.locator(".monaco-editor textarea").first();
  await input.focus();
  await page.keyboard.press("ControlOrMeta+A");
  // Use an actual paste for multi-line JavaScript. Input.insertText is a
  // typing event, which can invoke Monaco's electric-brace auto-completion.
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.evaluate((code) => navigator.clipboard.writeText(code), code);
  await page.keyboard.press("ControlOrMeta+V");
  // Browser clipboard delivery is asynchronous; do not race submission or
  // reload against the editor's paste handler and its subsequent autosave.
  await expect
    .poll(async () =>
      (await page.locator(".monaco-editor .view-lines").innerText()).replace(
        /\s/g,
        "",
      ),
    )
    .toBe(code.replace(/\s/g, ""));
}
async function run(page, code, tests = [], language = "javascript") {
  return page.evaluate(
    ({ code, tests, language }) =>
      new Promise((resolve, reject) => {
        const w = new Worker("/runner.js");
        const timeout = setTimeout(() => {
          w.terminate();
          reject(new Error("Worker timed out"));
        }, 40000);
        w.onmessage = ({ data }) => {
          if (data.type === "result") {
            clearTimeout(timeout);
            w.terminate();
            resolve(data);
          }
        };
        w.onerror = (e) => {
          clearTimeout(timeout);
          w.terminate();
          reject(new Error(e.message));
        };
        w.postMessage({ code, language, tests });
      }),
    { code, tests, language },
  );
}
async function submit(page, lesson, result, mode = "learn") {
  const response = await page.request.post("/api/submissions", {
    data: {
      lesson: lesson.id,
      code: lesson.solution,
      tests: result.tests,
      runtime: result.runtime,
      mode,
    },
  });
  expect(response.ok(), await response.text()).toBeTruthy();
  return response.json();
}
async function home(page) {
  await page.goto("/");
  await page.getByRole("heading", { name: /Big things start/ }).waitFor();
}

test("eight JavaScript lessons and the checkout challenge execute, grade, and unlock independently of Python", async ({
  page,
}) => {
  await home(page);
  const locked = await page.request.post("/api/submissions", {
    data: {
      lesson: lessons[1].id,
      code: lessons[1].solution,
      tests: lessons[1].tests.map((t) => ({ passed: true })),
    },
  });
  expect(locked.status()).toBe(403);
  for (const lesson of lessons) {
    const result = await run(page, lesson.solution, lesson.tests);
    expect(result.error, lesson.id).toBeUndefined();
    expect(
      result.tests.every((t) => t.passed),
      JSON.stringify(result),
    ).toBeTruthy();
    await submit(page, lesson, result);
  }
  const challenge = challenges.find((c) => c.id === "js-parcel-checkout");
  const result = await run(page, challenge.solution, challenge.tests);
  expect(result.tests.every((t) => t.passed)).toBeTruthy();
  await submit(page, challenge, result);
  const s = (await (await page.request.get("/api/state")).json()).state;
  expect(s.completed).not.toContain("first-line");
  expect(s.completed).toHaveLength(9);
  expect(s.xp).toBe(1100);
  expect(courseProgress(s, "python").completed).toBe(0);
  expect(courseProgress(s, "javascript").completed).toBe(8);
  await page.reload();
  await page
    .getByRole("button", { name: "My achievements", exact: true })
    .click();
  await expect(
    page.locator(".badge-card").filter({ hasText: "Speaking JavaScript" }),
  ).toHaveClass(/earned/);
  await expect(
    page.locator(".badge-card").filter({ hasText: "Foundation builder" }),
  ).not.toHaveClass(/earned/);
  await expect(
    page.locator(".badge-card").filter({ hasText: "Data fluent" }),
  ).not.toHaveClass(/earned/);
  await page.getByRole("button", { name: "Challenges", exact: true }).click();
  await page.getByLabel("Challenge language").selectOption("javascript");
  await expect(page.locator(".challenge-table-row")).toHaveCount(1);
  await expect(page.locator(".challenge-table-row")).toContainText(
    "The parcel checkout",
  );
});

test("beginner can select JavaScript, fail then pass, resume the correct course, and enter a blank JS exam", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await home(page);
  await expect(
    page.locator(".course-card").filter({ hasText: "Python foundations" }),
  ).toContainText("0 of 10 completed");
  await page
    .locator(".course-card")
    .filter({ hasText: "JavaScript foundations" })
    .click();
  await expect(page.locator(".roadmap-chapter.expanded")).toContainText(
    "JavaScript foundations",
  );
  await expect(
    page.locator(".roadmap-chapter.expanded .lesson-row"),
  ).toHaveCount(8);
  await page.getByRole("button", { name: /Say hello in JavaScript/ }).click();
  await page.locator(".monaco-editor").waitFor();
  await expect(page.locator(".workspace-breadcrumb")).toContainText(
    "JavaScript foundations",
  );
  await expect(page.locator(".editor-status")).toContainText(
    "JavaScript · Browser worker",
  );
  await expect(
    page.getByRole("button", { name: "Trace code", exact: true }),
  ).toHaveCount(0);
  await edit(page, 'console.log("wrong");');
  await page
    .getByRole("button", { name: "Submit solution", exact: true })
    .click();
  await expect(page.locator(".test-count")).toHaveText("0/2");
  await edit(page, lessons[0].solution);
  await page
    .getByRole("button", { name: "Submit solution", exact: true })
    .click();
  await expect(page.locator(".earned-xp")).toHaveText("+50 XP");
  await page
    .getByRole("button", { name: "Keep learning", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Name it. Store it. Change it." }),
  ).toBeVisible();
  await edit(page, "// saved JavaScript draft\nconst price = 6;");
  await expect(page.locator(".saved-indicator")).toHaveText("Saved");
  await expect
    .poll(
      async () =>
        (await (await page.request.get("/api/state")).json()).state.drafts[
          "js-values"
        ],
    )
    .toBe("// saved JavaScript draft\nconst price = 6;");

  await page.reload();
  await expect(page.locator(".hero-course")).toContainText(
    "JavaScript foundations",
  );
  await page
    .getByRole("button", { name: "Continue learning", exact: true })
    .click();
  await expect(page.locator(".monaco-editor")).toContainText(
    "saved JavaScript draft",
  );
  await page.getByRole("button", { name: "Review queue", exact: true }).click();
  await page
    .locator(".recall-card")
    .getByRole("button", { name: "Recall", exact: true })
    .click();
  await expect(page.locator(".monaco-editor")).toContainText(
    "// Write your solution from memory.",
  );
  await expect(
    page.getByRole("button", { name: /Coding tutor/ }),
  ).toBeDisabled();
  await edit(page, lessons[0].solution);
  await page
    .getByRole("button", { name: "Submit solution", exact: true })
    .click();
  await expect(page.locator(".earned-xp")).toHaveText("Practice complete");
  const s = (await (await page.request.get("/api/state")).json()).state;
  expect(s.reviewSchedule["js-first-line"].stage).toBe(1);
  expect(s.reviewSchedule["first-line"]).toBeUndefined();
  expect(s.xp).toBe(50);
  expect(errors).toEqual([]);
});

test("async execution awaits actual results and grades failing assertions independently", async ({
  page,
}) => {
  await home(page);
  const actual = await run(
    page,
    "const value = await new Promise(resolve => setTimeout(() => resolve(21), 20));\nconsole.log(value * 2);",
  );
  expect(actual.output).toEqual(["42"]);
  expect(actual.error).toBeUndefined();
  const tests = [
    { label: "Missing function", expression: "missingFunction() === 1" },
    { label: "Defined function", expression: "twice(3) === 6" },
    {
      label: "Independent rejection",
      expression: 'await Promise.reject(new Error("test rejection"))',
    },
    { label: "Another successful test", expression: "twice(0) === 0" },
  ];
  const graded = await run(
    page,
    "function twice(value) { return value * 2; }",
    tests,
  );
  expect(graded.error).toBeUndefined();
  expect(graded.tests.map((t) => t.passed)).toEqual([false, true, false, true]);
  const rejected = await run(
    page,
    'await Promise.reject(new Error("offline"));',
  );
  expect(rejected.error).toContain("Error: offline");
  const ts = await run(
    page,
    "const n: number = await Promise.resolve(4); console.log(n * 2);",
    [],
    "typescript",
  );
  expect(ts.output).toEqual(["8"]);
  const blocked = await run(
    page,
    'try { await fetch("/api/state"); } catch (error) { console.log("Network blocked"); }',
  );
  expect(blocked.output).toEqual(["Network blocked"]);
});

test("flawed JavaScript debugging examples fail real tests; source checks reject shortcuts", async ({
  page,
}) => {
  await home(page);
  for (const lesson of lessons) {
    const result = await run(page, lesson.debugStarter, lesson.tests);
    expect(
      result.error || result.tests.some((t) => !t.passed),
      lesson.id,
    ).toBeTruthy();
  }
  const hardcoded = await run(
    page,
    "const price=6, quantity=4, discount=5, total=19; console.log(total);",
    byId("js-values").tests,
  );
  expect(
    hardcoded.tests.find(
      (t) => t.label === "Build total from the input arithmetic",
    ).passed,
  ).toBe(false);
  const noLoop = await run(
    page,
    "function sumPositive(values) { return values.filter(v => v > 0).reduce((a,b) => a+b,0); }",
    byId("js-loops").tests,
  );
  expect(noLoop.tests.find((t) => t.label === "Practice a loop").passed).toBe(
    false,
  );
});

test("finishing a JavaScript course offers a real transition and preserves its badge", async ({
  page,
}) => {
  await home(page);
  for (const lesson of lessons.slice(0, -1)) {
    const result = await run(page, lesson.solution, lesson.tests);
    await submit(page, lesson, result);
  }
  await page.reload();
  await page
    .getByRole("button", { name: "Continue learning", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Wait for a result, not a guess" }),
  ).toBeVisible();
  await edit(page, lessons.at(-1).solution);
  await page
    .getByRole("button", { name: "Submit solution", exact: true })
    .click();
  await expect(page.locator(".earned-xp")).toHaveText("+175 XP");
  await page
    .getByRole("button", { name: "Keep learning", exact: true })
    .click();
  await expect(
    page.getByRole("dialog", { name: "That’s a foundation you built." }),
  ).toBeVisible();
  await expect(page.locator(".course-finish-stats")).toContainText(
    "8 lessons passed",
  );
  await expect(page.locator(".course-finish-stats")).toContainText(
    "900 course XP",
  );
  await page.screenshot({
    path: ".artifacts/javascript-complete.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Explore Python foundations" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Your first line of Python" }),
  ).toBeVisible();
  const s = (await (await page.request.get("/api/state")).json()).state;
  expect(s.completed).toHaveLength(8);
  expect(s.activeCourse).toBe("python");
  expect(s.xp).toBe(900);
});

test("JavaScript error feedback and tutor explain the current language, and pending promises time out", async ({
  page,
}) => {
  await home(page);
  await page
    .locator(".course-card")
    .filter({ hasText: "JavaScript foundations" })
    .click();
  await page.getByRole("button", { name: /Say hello in JavaScript/ }).click();
  await page.locator(".monaco-editor").waitFor();
  await edit(page, "console.log(missingName);");
  await page.getByRole("button", { name: "Run code", exact: false }).click();
  await expect(page.locator(".error-guide")).toContainText("A name is missing");
  await expect(page.locator(".error-guide")).not.toContainText("Python");
  await page
    .getByRole("button", { name: "Submit solution", exact: true })
    .click();
  await expect(page.locator(".test-count")).toHaveText("0/2");
  await expect(page.locator(".error-guide")).toContainText("A name is missing");
  await expect(
    page.getByText("Original execution error", { exact: true }),
  ).toBeVisible();

  await page.getByRole("button", { name: /Ask your tutor/ }).click();
  await expect(page.locator(".tutor-context")).toContainText("JavaScript");
  await page
    .getByRole("textbox", { name: "Message your tutor" })
    .fill("What is a variable?");
  await page.getByRole("button", { name: "Send message", exact: true }).click();
  await expect(page.locator(".chat-message.assistant").last()).toContainText(
    "const",
  );
  await page.getByRole("button", { name: "Close tutor" }).click();
  await edit(page, "await new Promise(() => {});");
  await page.getByRole("button", { name: "Run code", exact: false }).click();
  await expect(page.locator(".error-output")).toContainText(
    "time limit exceeded",
    { timeout: 15000 },
  );
  await expect(page.locator(".error-guide")).toContainText(
    "promise that never settles",
  );
  await edit(page, lessons[0].solution);
  await page.getByRole("button", { name: "Run code", exact: false }).click();
  await expect(page.locator(".console-body")).toContainText(
    "Hello, JavaScript!",
  );
  await page.screenshot({
    path: ".artifacts/javascript-workspace.png",
    fullPage: true,
  });
});
