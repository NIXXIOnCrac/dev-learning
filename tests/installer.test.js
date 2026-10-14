import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import net from "node:net";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const launcher = path.resolve("packaging/windows/launcher.cjs");
const { request } = require(launcher);
const root = path.resolve(".");
async function freePort() {
  const s = net.createServer();
  s.listen(0, "127.0.0.1");
  await once(s, "listening");
  const port = s.address().port;
  await new Promise((r) => s.close(r));
  return port;
}
function launch(options) {
  const child = spawn(
    process.execPath,
    [
      "-e",
      `require(${JSON.stringify(launcher)}).main({...${JSON.stringify(options)},openBrowser:()=>process.send({ready:true})}).catch(e=>{console.error(e);process.exit(1)})`,
    ],
    { stdio: ["ignore", "pipe", "pipe", "ipc"] },
  );
  let errors = "";
  child.stderr.on("data", (s) => (errors += s));
  const ready = new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error("Launcher timed out: " + errors)),
      15000,
    );
    child.once("message", () => {
      clearTimeout(timer);
      resolve();
    });
    child.once("exit", (code) => {
      clearTimeout(timer);
      reject(new Error("Launcher exited " + code + ": " + errors));
    });
  });
  return { child, ready };
}
test(
  "local launcher authenticates control, reuses one instance, stops cleanly, and preserves learner data",
  { timeout: 30000 },
  async (t) => {
    const dataDir = fs.mkdtempSync(
      path.join(os.tmpdir(), "forge-install-test-"),
    );
    const appPort = await freePort(),
      controlPort = await freePort();
    const options = { appRoot: root, dataDir, appPort, controlPort };
    const children = [];
    t.after(() => {
      for (const p of children) if (p.exitCode === null) p.kill();
      fs.rmSync(dataDir, { recursive: true, force: true });
    });
    const first = launch(options);
    children.push(first.child);
    await first.ready;
    const stateFile = path.join(dataDir, "local-server.json");
    const { token } = JSON.parse(fs.readFileSync(stateFile));
    assert.deepEqual(await request(controlPort, token), {
      product: "ForgeAcademy",
      ready: true,
    });
    assert.equal(
      (await fetch(`http://127.0.0.1:${controlPort}/status`)).status,
      403,
    );
    assert.equal(
      (
        await fetch(`http://127.0.0.1:${controlPort}/stop`, {
          method: "POST",
          headers: { "X-Forge-Control": "invalid" },
        })
      ).status,
      403,
    );
    const response = await fetch(`http://127.0.0.1:${appPort}/api/state`);
    assert.equal(response.status, 200);
    const cookie = response.headers.get("set-cookie").split(";")[0];
    const changed = await fetch(`http://127.0.0.1:${appPort}/api/state`, {
      method: "PATCH",
      headers: { cookie, "Content-Type": "application/json" },
      body: JSON.stringify({
        draft: { id: "js-first-line", code: 'console.log("saved locally");' },
      }),
    });
    assert.equal(changed.status, 200);
    const second = launch(options);
    children.push(second.child);
    const duplicateExit = once(second.child, "exit");
    await second.ready;
    assert.equal((await duplicateExit)[0], 0);
    assert.equal(JSON.parse(fs.readFileSync(stateFile)).token, token);
    const firstExit = once(first.child, "exit");
    await request(controlPort, token, "POST");
    assert.equal((await firstExit)[0], 0);
    assert.ok(fs.existsSync(path.join(dataDir, "academy.db")));
    assert.equal(fs.existsSync(stateFile), false);
    assert.equal(
      fs.existsSync(path.join(dataDir, "academy.db-wal")),
      false,
      "Clean database close checkpoints/removes WAL",
    );
    const restarted = launch(options);
    children.push(restarted.child);
    await restarted.ready;
    const restored = await fetch(`http://127.0.0.1:${appPort}/api/state`, {
      headers: { cookie },
    });
    assert.equal(
      (await restored.json()).state.drafts["js-first-line"],
      'console.log("saved locally");',
    );
    const restartedExit = once(restarted.child, "exit");
    await request(
      controlPort,
      JSON.parse(fs.readFileSync(stateFile)).token,
      "POST",
    );
    assert.equal((await restartedExit)[0], 0);
  },
);
test("Windows installer source preserves data and bundles rather than downloading runtimes on install", () => {
  const script = fs.readFileSync("packaging/windows/installer.nsi", "utf8");
  assert.match(script, /RequestExecutionLevel user/);
  assert.match(script, /RunningX64/);
  assert.doesNotMatch(script, /RMDir.*\$LOCALAPPDATA\\ForgeAcademy/);
  assert.doesNotMatch(script, /inetc::|NSISdl::|ExecWait.*npm/);
  assert.match(script, /--stop --quiet/);
});
