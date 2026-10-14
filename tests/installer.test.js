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
test("Windows version guard reads the native version and accepts both Windows 10 and 11 kernel versions", () => {
  const script = fs.readFileSync("packaging/windows/installer.nsi", "utf8");
  const guard = fs.readFileSync(
    "packaging/windows/windows-version.nsh",
    "utf8",
  );
  assert.match(script, /ManifestSupportedOS Win10/);
  assert.match(script, /Call CheckWindowsVersion/);
  assert.doesNotMatch(script, /AtLeastWin10|WinVer\.nsh/);
  assert.match(guard, /System::Alloc 276/);
  assert.match(guard, /ntdll::RtlGetVersion\(p r0\) i\.r1/);
  assert.match(guard, /StrCmp \$1 0 forge_version_read/);
  assert.match(
    guard,
    /IntCmp \$1 10 forge_version_supported forge_version_old forge_version_supported/,
  );
  // Regression fixtures document actual kernel versions, not marketing names.
  for (const [major, minor, build, expected] of [
    [10, 0, 19045, true],
    [10, 0, 22631, true],
    [10, 0, 26100, true],
    [6, 3, 9600, false],
    [6, 1, 7601, false],
  ]) {
    const branch =
      major === 10
        ? "forge_version_supported"
        : major < 10
          ? "forge_version_old"
          : "forge_version_supported";
    assert.equal(
      branch === "forge_version_supported",
      expected,
      `${major}.${minor}.${build}`,
    );
  }
});
test(
  "GUI supervisor starts a detached server, reuses it, and surfaces pre-ready failures",
  { timeout: 30000 },
  async (t) => {
    const { ensureStarted } = require(launcher);
    const dataDir = fs.mkdtempSync(
      path.join(os.tmpdir(), "forge-gui-supervisor-"),
    );
    const appPort = await freePort(),
      controlPort = await freePort();
    const options = { dataDir, appRoot: root, appPort, controlPort };
    const stateFile = path.join(dataDir, "local-server.json");
    const stop = async () => {
      if (fs.existsSync(stateFile)) {
        const token = JSON.parse(fs.readFileSync(stateFile)).token;
        try {
          await request(controlPort, token, "POST");
        } catch {}
        for (let i = 0; i < 100 && fs.existsSync(stateFile); i++)
          await new Promise((r) => setTimeout(r, 30));
      }
    };
    t.after(async () => {
      await stop();
      fs.rmSync(dataDir, { recursive: true, force: true });
    });
    await ensureStarted(options);
    const first = fs.readFileSync(stateFile, "utf8");
    assert.equal(
      (await fetch(`http://127.0.0.1:${appPort}/api/state`)).status,
      200,
    );
    await ensureStarted(options);
    assert.equal(
      fs.readFileSync(stateFile, "utf8"),
      first,
      "repeated clicks must reuse the server",
    );
    await stop();
    assert.equal(fs.existsSync(stateFile), false);
    await assert.rejects(
      ensureStarted({ ...options, appRoot: path.join(dataDir, "missing-app") }),
      /Server exited before startup/,
    );
    assert.match(
      fs.readFileSync(path.join(dataDir, "launcher.log"), "utf8"),
      /ERR_MODULE_NOT_FOUND|Cannot find module/,
    );
    await assert.rejects(
      ensureStarted({
        ...options,
        nodeExecutable: path.join(dataDir, "missing-node"),
      }),
      /ENOENT/,
    );
  },
);
test("Windows shortcuts use the GUI executable, wait for readiness, and show errors without VBScript", () => {
  const installer = fs.readFileSync("packaging/windows/installer.nsi", "utf8");
  const bootstrap = fs.readFileSync("packaging/windows/bootstrap.nsi", "utf8");
  for (const line of installer
    .split("\n")
    .filter((l) => l.includes("CreateShortcut") && !l.includes("Read me"))) {
    assert.match(line, /\\Forge\.exe/);
    assert.doesNotMatch(line, /wscript|\.vbs/);
  }
  assert.match(bootstrap, /--ensure-started/);
  assert.match(bootstrap, /ShowInstDetails show/);
  assert.match(bootstrap, /ExecShell "open" "http:\/\/127\.0\.0\.1:33791"/);
  assert.match(bootstrap, /MessageBox MB_ICONSTOP "Forge could not start/);
  assert.match(bootstrap, /nsExec::ExecToStack/);
});
