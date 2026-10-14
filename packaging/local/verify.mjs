// Tests a packaged browser app on Linux; does not execute native Windows/macOS binaries.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { createRequire } from "node:module";
import { chromium } from "@playwright/test";
import config from "../../playwright.config.js";
import { lessonsForCourse } from "../../src/content.js";
const root = path.resolve(new URL("../..", import.meta.url).pathname);
export async function verifyPayload(payload, label = "packaged app") {
  const dataDir = path.join(root, ".cache/packaged-runtime-verification");
  fs.rmSync(dataDir, { force: true, recursive: true });
  const appPort = 33791,
    controlPort = 33792,
    url = `http://127.0.0.1:${appPort}`;
  const options = {
    dataDir,
    appPort,
    controlPort,
    appRoot: path.join(payload, "app"),
  };
  const require = createRequire(import.meta.url);
  const { request } = require(path.join(payload, "launcher.cjs"));
  const child = spawn(
    process.execPath,
    [
      "-e",
      `require(${JSON.stringify(path.join(payload, "launcher.cjs"))}).main({...${JSON.stringify(options)},openBrowser:()=>process.send('ready')}).catch(e=>{console.error(e);process.exit(1)})`,
    ],
    { stdio: ["ignore", "inherit", "inherit", "ipc"] },
  );
  let browser;
  try {
    await Promise.race([
      once(child, "message"),
      once(child, "exit").then(([code]) => {
        throw new Error("Packaged launcher exited " + code);
      }),
    ]);
    browser = await chromium.launch({
      ...config.use.launchOptions,
      headless: true,
    });
    const context = await browser.newContext();
    const external = [];
    await context.route("**/*", (route) => {
      if (new URL(route.request().url()).origin !== url) {
        external.push(route.request().url());
        return route.abort();
      }
      return route.continue();
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(url);
    await page.getByRole("heading", { name: /Big things start/ }).waitFor();
    assert.equal(
      await page
        .locator(".course-card")
        .filter({ hasText: "JavaScript foundations" })
        .count(),
      1,
    );
    async function run(language, code, tests = []) {
      return page.evaluate(
        ({ language, code, tests }) =>
          new Promise((resolve, reject) => {
            const worker = new Worker("/runner.js");
            const timer = setTimeout(() => {
              worker.terminate();
              reject(new Error("Packaged runtime timeout"));
            }, 45000);
            worker.onmessage = ({ data }) => {
              if (data.type === "result") {
                clearTimeout(timer);
                worker.terminate();
                resolve(data);
              }
            };
            worker.onerror = (e) => {
              clearTimeout(timer);
              worker.terminate();
              reject(new Error(e.message));
            };
            worker.postMessage({ language, code, tests });
          }),
        { language, code, tests },
      );
    }
    const py = await run("python", 'print("Packaged Python works")');
    assert.equal(py.error, undefined);
    assert.deepEqual(py.output, ["Packaged Python works"]);
    for (const lesson of lessonsForCourse("javascript")) {
      const result = await run("javascript", lesson.solution, lesson.tests);
      assert.equal(result.error, undefined);
      assert.ok(
        result.tests.every((t) => t.passed),
        lesson.id,
      );
    }
    const ts = await run(
      "typescript",
      "const result: number = await Promise.resolve(8); console.log(result);",
    );
    assert.equal(ts.error, undefined);
    assert.deepEqual(ts.output, ["8"]);
    const sql = await run("sql", "SELECT 6 * 7 AS answer;");
    assert.equal(sql.error, undefined);
    assert.deepEqual(sql.output, ["answer", "42"]);
    // Exercise real Monaco loading from the packaged dist, not only worker APIs.
    await page
      .locator(".course-card")
      .filter({ hasText: "JavaScript foundations" })
      .click();
    await page.getByRole("button", { name: /Say hello in JavaScript/ }).click();
    await page.locator(".monaco-editor").waitFor();
    assert.deepEqual(errors, []);
    assert.deepEqual(external, []);
    console.log(
      `PASS (${label}): packaged dashboard, Monaco, Python, all 8 JavaScript solutions, TypeScript, and SQL; no external requests.`,
    );
  } finally {
    await browser?.close();
    if (child.exitCode === null) {
      try {
        const { token } = JSON.parse(
          fs.readFileSync(path.join(dataDir, "local-server.json")),
        );
        const exit = once(child, "exit");
        await request(controlPort, token, "POST");
        await exit;
      } catch {
        child.kill();
      }
    }
  }
}
