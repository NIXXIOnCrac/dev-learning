import { test, expect } from "@playwright/test";
import {
  orderedLessons,
  pythonLessons,
  challenges,
} from "../../src/content.js";
async function edit(page, code) {
  const input = page.locator(".monaco-editor textarea").first();
  await input.focus();
  await page.keyboard.press("ControlOrMeta+A");
  await page.keyboard.insertText(code);
}
async function worker(page, language, code, tests = [], options = {}) {
  return page.evaluate(
    ({ language, code, tests, options }) =>
      new Promise((resolve, reject) => {
        const w = new Worker("/runner.js");
        const timer = setTimeout(() => {
          w.terminate();
          reject(new Error("Worker test timed out"));
        }, 40000);
        w.onmessage = ({ data }) => {
          if (data.type === "result") {
            clearTimeout(timer);
            w.terminate();
            resolve(data);
          }
        };
        w.onerror = (e) => {
          clearTimeout(timer);
          w.terminate();
          reject(new Error(e.message));
        };
        w.postMessage({ language, code, tests, ...options });
      }),
    { language, code, tests, options },
  );
}
test("beginner writes real Python, fails then passes, earns XP once, and resumes saved progress", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page
    .getByRole("button", { name: "Start learning", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Your first line of Python" }),
  ).toBeVisible();
  await page.locator(".monaco-editor").waitFor();
  await edit(page, 'print("wrong answer")');
  await page
    .getByRole("button", { name: "Submit solution", exact: true })
    .click();
  await expect(page.locator(".test-count")).toHaveText("0/2", {
    timeout: 45000,
  });
  await expect(page.locator(".test-result.fail")).toHaveCount(2);
  expect((await page.request.get("/api/state")).ok()).toBeTruthy();
  let saved = await (await page.request.get("/api/state")).json();
  expect(saved.state.xp).toBe(0);
  await edit(page, orderedLessons[0].solution);
  await page
    .getByRole("button", { name: "Submit solution", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible({ timeout: 45000 });
  await expect(page.locator(".earned-xp")).toHaveText("+50 XP");
  await page.getByRole("button", { name: "Review my code" }).click();
  await page
    .getByRole("button", { name: "Submit solution", exact: true })
    .click();
  await expect(page.locator(".earned-xp")).toHaveText("Practice complete", {
    timeout: 45000,
  });
  await page
    .getByRole("button", { name: "Keep learning", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Give your ideas a name" }),
  ).toBeVisible();
  await edit(page, 'language = "Python"\nyear = 1991\n# saved draft');
  await expect(page.locator(".saved-indicator")).toHaveText("Saved");
  await page.reload();
  await page
    .getByRole("button", { name: "Continue learning", exact: true })
    .click();
  await expect(page.locator(".monaco-editor")).toContainText("# saved draft");
  saved = await (await page.request.get("/api/state")).json();
  expect(saved.state.xp).toBe(50);
  expect(saved.state.completed).toEqual(["first-line"]);
  expect(errors).toEqual([]);
});
test("all ten reference solutions execute against real Python tests; wrong implementations fail", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("heading", { name: /Big things start/ }).waitFor();
  for (const lesson of [...pythonLessons, challenges.find((c) => c.boss)]) {
    const result = await worker(page, "python", lesson.solution, lesson.tests);
    expect(result.error, lesson.title).toBeUndefined();
    expect(
      result.tests.every((t) => t.passed),
      JSON.stringify(result),
    ).toBeTruthy();
    const submitted = await page.request.post("/api/submissions", {
      data: {
        lesson: lesson.id,
        code: lesson.solution,
        tests: result.tests,
        runtime: result.runtime,
        mode: "learn",
      },
    });
    expect(submitted.ok(), await submitted.text()).toBeTruthy();
  }
  const profile = await (await page.request.get("/api/state")).json();
  expect(profile.state.completed).toContain("inventory-boss");
  expect(profile.state.xp).toBe(
    pythonLessons.reduce((xp, l) => xp + l.xp, 0) + 300,
  );
  const bad = await worker(
    page,
    "python",
    'def greet(name):\n    print("Hello, " + name + "!")',
    orderedLessons.find((l) => l.id === "functions").tests,
  );
  expect(bad.tests.every((t) => !t.passed)).toBeTruthy();
  const syntax = await worker(page, "python", 'print("unclosed)');
  expect(syntax.error).toContain("SyntaxError");
});
test("JavaScript, TypeScript, SQL, and Python run actual code; worker CSP blocks API access", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("heading", { name: /Big things start/ }).waitFor();
  expect(
    (await worker(page, "javascript", "console.log([1,2,3].map(x=>x*2));"))
      .output,
  ).toEqual(["[2,4,6]"]);
  expect(
    (
      await worker(
        page,
        "typescript",
        "const answer: number = 6 * 7; console.log(answer);",
      )
    ).output,
  ).toEqual(["42"]);
  expect(
    (
      await worker(
        page,
        "sql",
        "CREATE TABLE t (n INTEGER); INSERT INTO t VALUES (7), (8); SELECT SUM(n) FROM t;",
      )
    ).output,
  ).toEqual(["SUM(n)", "15"]);
  const blocked = await worker(
    page,
    "python",
    'import js\ntry:\n    await js.fetch("/api/state")\nexcept Exception:\n    print("Network blocked")',
  );
  expect(blocked.output).toEqual(["Network blocked"]);
  const dom = await worker(page, "javascript", "console.log(typeof document);");
  expect(dom.output).toEqual(["undefined"]);
});
test("infinite loops time out without freezing the application", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Playground", exact: true }).click();
  await page.locator(".monaco-editor").waitFor();
  await edit(page, "while True:\n    pass");
  await page.getByRole("button", { name: "Run code", exact: true }).click();
  await expect(page.locator(".error-output")).toContainText(
    "time limit exceeded",
    { timeout: 45000 },
  );
  await edit(page, 'print("Still working")');
  await page.getByRole("button", { name: "Run code", exact: true }).click();
  await expect(page.locator(".console-body")).toContainText("Still working", {
    timeout: 45000,
  });
});
test("multi-file portfolio is editable, previews JavaScript, saves, and exports latest code", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Your first personal website", exact: false })
    .click();
  const frame = page.frameLocator('iframe[title="Your website preview"]');
  await expect(frame.getByRole("heading")).toContainText(
    "developer in the making",
  );
  await frame.getByRole("button", { name: "Say hello" }).click();
  await expect(frame.locator("#greeting")).toContainText("Keep building");
  await page.getByRole("button", { name: "style.css", exact: true }).click();
  await edit(page, "body { background: rgb(18, 34, 56); color: white; }");
  await page.getByRole("button", { name: "Refresh", exact: true }).click();
  await expect(frame.locator("body")).toHaveCSS(
    "background-color",
    "rgb(18, 34, 56)",
  );
  await expect(page.locator(".saved-indicator")).toHaveText("Saved");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export", exact: true }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("my-portfolio.html");
  await page.reload();
  await page
    .getByRole("button", { name: "Your first personal website", exact: false })
    .click();
  await page.getByRole("button", { name: "style.css", exact: true }).click();
  await expect(page.locator(".monaco-editor")).toContainText("rgb(18, 34, 56)");
});
test("accounts retain guest work and isolate different learners", async ({
  page,
  browser,
}) => {
  await page.goto("/");
  await page.getByRole("heading", { name: /Big things start/ }).waitFor();
  await page.request.patch("/api/state", {
    data: { draft: { id: "first-line", code: "# my saved work" } },
  });
  const email = `learner-${Date.now()}@example.com`;
  const register = await page.request.post("/api/auth/register", {
    data: { email, password: "safe password 123", name: "Ada" },
  });
  expect(register.ok()).toBeTruthy();
  const context = await browser.newContext();
  const other = await context.newPage();
  await other.goto("/");
  await other.getByRole("heading", { name: /Big things start/ }).waitFor();
  let otherState = await (await other.request.get("/api/state")).json();
  expect(otherState.state.drafts["first-line"]).toBeUndefined();
  const wrong = await other.request.post("/api/auth/login", {
    data: { email, password: "wrong password 123" },
  });
  expect(wrong.status()).toBe(401);
  const login = await other.request.post("/api/auth/login", {
    data: { email, password: "safe password 123" },
  });
  expect(login.ok()).toBeTruthy();
  otherState = await (await other.request.get("/api/state")).json();
  expect(otherState.state.drafts["first-line"]).toBe("# my saved work");
  expect(otherState.user.name).toBe("Ada");
  await context.close();
});
test("mobile navigation, roadmap search, settings, and guided tutor work", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("heading", { name: /Big things start/ }).waitFor();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
  await page.screenshot({ path: ".artifacts/mobile.png", fullPage: true });
  await page.getByRole("button", { name: "Open menu", exact: true }).click();
  await page
    .getByRole("button", { name: "Learning path", exact: false })
    .first()
    .click();
  await expect(
    page.getByRole("heading", { name: "A path with purpose." }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Give your ideas a name", exact: false })
    .click();
  await expect(page.getByRole("status")).toContainText(
    "Complete the preceding lessons",
  );
  await page.getByRole("button", { name: "Open menu", exact: true }).click();
  await page
    .getByRole("button", { name: "Open settings", exact: true })
    .click();
  await page.getByLabel("What should we call you?").fill("Youcef");
  await page.getByRole("button", { name: "Save preferences" }).click();
  await page
    .getByRole("button", { name: "Coding tutor", exact: false })
    .click();
  await page.getByRole("button", { name: "Explain print vs return" }).click();
  await expect(page.locator(".chat-message.assistant").last()).toContainText(
    "handing a value back",
  );
  await page.getByRole("button", { name: "Close tutor" }).click();
  await page.getByRole("button", { name: "Overview", exact: true }).click();
  await page.getByRole("button", { name: "Your account", exact: true }).count();
});
test("server enforces prerequisites, rejects state reward tampering, and handles simultaneous rewards once", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("heading", { name: /Big things start/ }).waitFor();
  const advanced = orderedLessons[1];
  const locked = await page.request.post("/api/submissions", {
    data: {
      lesson: advanced.id,
      code: advanced.solution,
      tests: advanced.tests.map((t) => ({ label: t.label, passed: true })),
    },
  });
  expect(locked.status()).toBe(403);
  await page.request.patch("/api/state", {
    data: { xp: 99999, completed: ["loops"] },
  });
  let state = await (await page.request.get("/api/state")).json();
  expect(state.state.xp).toBe(0);
  expect(state.state.completed).toEqual([]);
  const first = orderedLessons[0];
  const result = await worker(page, "python", first.solution, first.tests);
  const data = {
    lesson: first.id,
    code: first.solution,
    tests: result.tests,
    runtime: result.runtime,
  };
  const responses = await Promise.all([
    page.request.post("/api/submissions", { data }),
    page.request.post("/api/submissions", { data }),
  ]);
  expect(responses.every((r) => r.ok())).toBeTruthy();
  state = await (await page.request.get("/api/state")).json();
  expect(state.state.xp).toBe(50);
  expect(state.state.completed).toEqual(["first-line"]);
  const csrf = await page.request.patch("/api/state", {
    headers: { Origin: "https://another-site.example" },
    data: { settings: { name: "attack" } },
  });
  expect(csrf.status()).toBe(403);
});
test("exam starts without the saved solution, disables tutor, and records a genuine review", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("heading", { name: /Big things start/ }).waitFor();
  const first = orderedLessons[0];
  const result = await worker(page, "python", first.solution, first.tests);
  await page.request.post("/api/submissions", {
    data: {
      lesson: first.id,
      code: first.solution,
      tests: result.tests,
      runtime: result.runtime,
    },
  });
  await page.reload();
  await page
    .getByRole("button", { name: "Learning insights", exact: true })
    .click();
  await page.getByRole("button", { name: /Output & strings/ }).click();
  await expect(page.locator(".monaco-editor")).toContainText(
    "Write your solution from memory",
  );
  await expect(
    page.getByRole("button", { name: "Coding tutor", exact: false }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Hints", exact: true }),
  ).toHaveCount(0);
  await edit(page, first.solution);
  await page
    .getByRole("button", { name: "Submit solution", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible({ timeout: 45000 });
  const state = await (await page.request.get("/api/state")).json();
  expect(state.state.xp).toBe(50);
  expect(state.state.examPassed).toContain(first.id);
  expect(state.state.reviewed[first.id]).toBeTruthy();
});
test("real Python trace captures lines, locals, return values, errors, and a bounded number of events", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("heading", { name: /Big things start/ }).waitFor();
  const code =
    "def total(values):\n    count = 0\n    for value in values:\n        count = count + value\n    return count\n\nprint(total([2, 4]))";
  const result = await worker(page, "python", code, [], { trace: true });
  const simple = await worker(
    page,
    "python",
    "score = 2\nscore = score + 3\nprint(score)",
    [],
    { trace: true },
  );
  expect(
    simple.trace.filter((s) => s.event === "line").map((s) => s.line),
  ).toEqual([1, 2, 3]);
  expect(
    simple.trace.filter((s) => s.event === "line")[2].variables.score,
  ).toBe("5");
  expect(result.error).toBeUndefined();
  expect(result.output).toEqual(["6"]);
  expect(result.trace.length).toBeGreaterThan(8);
  expect(
    result.trace.some(
      (s) =>
        s.line === 4 &&
        s.function === "total" &&
        s.variables.value === "4" &&
        s.variables.count === "2",
    ),
  ).toBeTruthy();
  expect(
    result.trace.find((s) => s.event === "return" && s.function === "total")
      ?.returnValue,
  ).toBe("6");
  expect(result.trace.every((s) => s.line <= 7)).toBeTruthy();
  const error = await worker(
    page,
    "python",
    "value = 2\nprint(missing_name)",
    [],
    { trace: true },
  );
  expect(error.error).toContain("NameError");
  expect(
    error.trace.some((s) => s.line === 2 && s.variables.value === "2"),
  ).toBeTruthy();
  const bounded = await worker(
    page,
    "python",
    "total = 0\nfor n in range(300):\n    total += n\nprint(total)",
    [],
    { trace: true },
  );
  expect(bounded.trace.length).toBe(160);
  expect(bounded.traceTruncated).toBe(true);
  expect(bounded.output).toEqual(["44850"]);
});
test("trace replay highlights the real editor line, invalidates on edits, and never awards XP", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Start learning", exact: true })
    .click();
  await page.locator(".monaco-editor").waitFor();
  await edit(page, "score = 2\nscore = score + 3\nprint(score)");
  await page.getByRole("button", { name: "Trace code", exact: true }).click();
  await expect(page.locator(".trace-controls")).toContainText("Step 1", {
    timeout: 45000,
  });
  await page
    .getByRole("button", { name: "Next trace step", exact: true })
    .click();
  await expect(page.locator(".trace-variables")).toContainText("score");
  await expect(page.locator(".trace-variables")).toContainText("2");
  await expect(page.locator(".trace-line-highlight")).toHaveCount(1);
  await page
    .getByRole("button", { name: "Next trace step", exact: true })
    .click();
  await expect(page.locator(".trace-variables")).toContainText("5");
  await page.screenshot({ path: ".artifacts/trace-next.png", fullPage: true });
  const profile = await (await page.request.get("/api/state")).json();
  expect(profile.state.xp).toBe(0);
  expect(profile.state.completed).toEqual([]);
  await edit(page, 'print("changed")');
  await expect(page.locator(".trace-empty")).toContainText("Your code changed");
  await expect(page.locator(".trace-line-highlight")).toHaveCount(0);
  await edit(page, "print(unknown_name)");
  await page.getByRole("button", { name: "Run code", exact: false }).click();
  await expect(page.locator(".error-guide")).toContainText(
    "A name was used before Python knew what it meant.",
    { timeout: 45000 },
  );
});
test("review queue persists scheduling, prevents fast stage farming, and offers recovery after a failed check", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("heading", { name: /Big things start/ }).waitFor();
  const first = orderedLessons[0];
  const result = await worker(page, "python", first.solution, first.tests);
  const data = {
    lesson: first.id,
    code: first.solution,
    tests: result.tests,
    runtime: result.runtime,
  };
  await page.request.post("/api/submissions", {
    data: { ...data, mode: "learn" },
  });
  await page.reload();
  await page.getByRole("button", { name: "Review queue", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Make it stick." }),
  ).toBeVisible();
  await expect(page.locator(".recall-card")).toContainText("Ready for recall");
  // Merely navigating the review page cannot advance its schedule.
  let state = (await (await page.request.get("/api/state")).json()).state;
  expect(state.reviewSchedule[first.id].stage).toBe(0);
  await page
    .locator(".recall-card")
    .getByRole("button", { name: "Recall", exact: false })
    .click();
  await edit(page, first.solution);
  await page
    .getByRole("button", { name: "Submit solution", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible({ timeout: 45000 });
  await page.getByRole("button", { name: "Review my code" }).click();
  await page.getByRole("button", { name: "Review queue", exact: true }).click();
  await page.getByRole("button", { name: "Upcoming", exact: true }).click();
  await expect(page.locator(".recall-card")).toContainText("Next review");
  state = (await (await page.request.get("/api/state")).json()).state;
  const due = state.reviewSchedule[first.id].dueAt;
  expect(state.reviewSchedule[first.id].stage).toBe(1);
  expect(state.xp).toBe(50);
  await page.request.post("/api/submissions", {
    data: { ...data, mode: "exam" },
  });
  state = (await (await page.request.get("/api/state")).json()).state;
  expect(state.reviewSchedule[first.id].dueAt).toBe(due);
  expect(state.reviewSchedule[first.id].stage).toBe(1);
  const bad = await worker(page, "python", 'print("not correct")', first.tests);
  await page.request.post("/api/submissions", {
    data: {
      lesson: first.id,
      code: 'print("not correct")',
      tests: bad.tests,
      mode: "exam",
    },
  });
  await page.reload();
  await page.getByRole("button", { name: "Review queue", exact: true }).click();
  await expect(page.locator(".recall-card")).toContainText("Needs a warm-up");
  state = (await (await page.request.get("/api/state")).json()).state;
  expect(state.xp).toBe(50);
  expect(state.reviewSchedule[first.id].stage).toBe(0);
  await page.screenshot({ path: ".artifacts/review-next.png", fullPage: true });
  const recommendation = await (
    await page.request.get("/api/recommendations")
  ).json();
  expect(recommendation.recommendations[0].mode).toBe("practice");
  // The old patch endpoint must not let a click claim a successful review.
  const oldReviewed = state.reviewed[first.id];
  await page.request.patch("/api/state", {
    data: { review: first.id, reviewSchedule: { [first.id]: { stage: 6 } } },
  });
  state = (await (await page.request.get("/api/state")).json()).state;
  expect(state.reviewed[first.id]).toBe(oldReviewed);
  expect(state.reviewSchedule[first.id].stage).toBe(0);
});
test("new debugging exercises fail for the intended reason instead of revealing solved code", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("heading", { name: /Big things start/ }).waitFor();
  for (const lesson of pythonLessons.filter((l) => l.debugStarter)) {
    const result = await worker(
      page,
      "python",
      lesson.debugStarter,
      lesson.tests,
    );
    expect(
      result.tests.some((t) => !t.passed),
      lesson.id,
    ).toBeTruthy();
  }
  const malformed = await page.request.post("/api/submissions", {
    data: { lesson: "first-line", code: "", tests: [null, null] },
  });
  expect(malformed.status()).toBe(400);
});
test("guided tutor uses the selected data lesson and boss context, without silently providing a solution", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("heading", { name: /Big things start/ }).waitFor();
  const json = await page.request.post("/api/tutor", {
    data: { lesson: "json", message: "What is JSON?", code: "import json" },
  });
  const jsonReply = await json.json();
  expect(jsonReply.source).toBe("guided");
  expect(jsonReply.reply).toContain("text format");
  const boss = await page.request.post("/api/tutor", {
    data: { lesson: "inventory-boss", message: "How should I approach this?" },
  });
  const bossReply = await boss.json();
  expect(bossReply.reply).toContain("one accumulator per item name");
  expect(bossReply.reply).not.toContain("def inventory_totals");
  const history = await (await page.request.get("/api/tutor")).json();
  expect(history[0].lesson).toBe("inventory-boss");
});
