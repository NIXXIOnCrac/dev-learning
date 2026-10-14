// The packaged Windows app is tested using Linux Node, not the bundled PE.
import { verifyPayload } from "../local/verify.mjs";
import { root } from "../local/payload.mjs";
import path from "node:path";
await verifyPayload(
  path.join(root, ".cache/forge-installer/payload"),
  "Windows payload on Linux",
);
// Exercise the actual short-lived supervisor entry used by Forge.exe. The
// shell UI remains Windows-only, but its packaged Node command is checked here.
const fs = await import("node:fs");
const { execFileSync } = await import("node:child_process");
const { createRequire } = await import("node:module");
const assert = (await import("node:assert/strict")).default;
const require = createRequire(import.meta.url);
const payload = path.join(root, ".cache/forge-installer/payload");
const localAppData = path.join(root, ".cache/forge-installer/gui test profile");
const stateFile = path.join(localAppData, "ForgeAcademy/local-server.json");
const command = () =>
  execFileSync(
    process.execPath,
    [path.join(payload, "launcher.cjs"), "--ensure-started"],
    {
      env: { ...process.env, LOCALAPPDATA: localAppData },
      encoding: "utf8",
      timeout: 30000,
    },
  );
const { request } = require(path.join(payload, "launcher.cjs"));
try {
  assert.match(command(), /Forge is ready/);
  const record = fs.readFileSync(stateFile, "utf8");
  assert.equal((await fetch("http://127.0.0.1:33791/")).status, 200);
  assert.match(command(), /Forge is ready/);
  assert.equal(fs.readFileSync(stateFile, "utf8"), record);
  console.log(
    "PASS: packaged supervisor CLI starts, reports readiness, and reuses the server with a space-containing profile path.",
  );
} finally {
  if (fs.existsSync(stateFile)) {
    const token = JSON.parse(fs.readFileSync(stateFile, "utf8")).token;
    await request(33792, token, "POST");
    for (let i = 0; i < 100 && fs.existsSync(stateFile); i++)
      await new Promise((r) => setTimeout(r, 50));
    assert.equal(fs.existsSync(stateFile), false);
  }
}
