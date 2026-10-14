// Runs only the academy server. Student programs still execute in browser workers.
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const crypto = require("node:crypto");
const { spawn } = require("node:child_process");
const { pathToFileURL } = require("node:url");
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const APP_PORT = 33791,
  CONTROL_PORT = 33792;

function request(port, token, method = "GET") {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: "127.0.0.1",
        port,
        path: method === "GET" ? "/status" : "/stop",
        method,
        headers: { "X-Forge-Control": token },
        timeout: 2000,
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
          if (data.length > 4096)
            req.destroy(new Error("Unexpected control response"));
        });
        res.on("end", () => {
          try {
            if (res.statusCode !== 200)
              throw new Error("Control authentication failed");
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        });
      },
    );
    req.on("timeout", () =>
      req.destroy(new Error("Local server did not respond")),
    );
    req.on("error", reject);
    req.end();
  });
}
async function main(options = {}) {
  const appPort = options.appPort || APP_PORT,
    controlPort = options.controlPort || CONTROL_PORT;
  const dataDir =
    options.dataDir ||
    path.join(
      process.env.LOCALAPPDATA ||
        path.join(require("node:os").homedir(), ".local", "share"),
      "ForgeAcademy",
    );
  fs.mkdirSync(dataDir, { recursive: true });
  const stateFile = path.join(dataDir, "local-server.json");
  const url = `http://127.0.0.1:${appPort}`;
  const openBrowser =
    options.openBrowser ||
    (() => {
      const child = spawn("cmd.exe", ["/d", "/s", "/c", `start "" "${url}"`], {
        windowsHide: true,
        stdio: "ignore",
      });
      child.on("error", (e) =>
        console.error("Open " + url + " in your browser:", e.message),
      );
      child.unref();
    });
  let existing;
  try {
    existing = JSON.parse(fs.readFileSync(stateFile, "utf8"));
  } catch {}
  let running;
  if (existing?.token)
    try {
      running = await request(controlPort, existing.token);
    } catch {}
  if (options.stop) {
    if (running?.product === "ForgeAcademy") {
      await request(controlPort, existing.token, "POST");
      for (let i = 0; i < 100; i++) {
        await pause(100);
        try {
          await request(controlPort, existing.token);
        } catch {
          return;
        }
      }
      throw new Error(
        "Forge is still stopping. Close active coding requests and try again.",
      );
    }
    return;
  }
  if (running?.product === "ForgeAcademy") {
    for (let i = 0; !running.ready && i < 100; i++) {
      await pause(100);
      running = await request(controlPort, existing.token);
    }
    if (!running.ready)
      throw new Error("Forge is still starting. Try again shortly.");
    openBrowser();
    return;
  }
  const token = crypto.randomBytes(32).toString("hex");
  let ready = false,
    appServer,
    closeDatabase,
    stopping = false;
  const control = http.createServer((req, res) => {
    res.setHeader("Cache-Control", "no-store");
    const provided = req.headers["x-forge-control"];
    if (
      typeof provided !== "string" ||
      Buffer.byteLength(provided) !== Buffer.byteLength(token) ||
      !crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(token))
    ) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }
    if (req.url === "/status" && req.method === "GET") {
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ product: "ForgeAcademy", ready }));
      return;
    }
    if (req.url === "/stop" && req.method === "POST") {
      res.setHeader("Content-Type", "application/json");
      res.end('{"stopping":true}');
      if (!stopping) {
        stopping = true;
        ready = false;
        setTimeout(() => {
          const finish = () =>
            control.close(async () => {
              try {
                await closeDatabase?.();
                fs.unlinkSync(stateFile);
                process.exit(0);
              } catch (e) {
                console.error(e);
                process.exit(1);
              }
            });
          if (appServer) appServer.close(finish);
          else finish();
        }, 100);
      }
      return;
    }
    res.writeHead(404);
    res.end();
  });
  await new Promise((resolve, reject) => {
    control.once("error", reject);
    control.listen(controlPort, "127.0.0.1", resolve);
  });
  fs.writeFileSync(stateFile, JSON.stringify({ token }), { mode: 0o600 });
  try {
    process.env.NODE_ENV = "production";
    process.env.FORGE_MANAGED_START = "1";
    process.env.HOST = "127.0.0.1";
    process.env.PORT = String(appPort);
    process.env.DB_PATH = path.join(dataDir, "academy.db");
    // A local installation must not accidentally use a database/provider from
    // unrelated environment variables inherited from the user's terminal.
    delete process.env.DATABASE_URL;
    delete process.env.TUTOR_API_KEY;
    delete process.env.COOKIE_SECURE;
    const backend = await import(
      pathToFileURL(
        path.join(
          options.appRoot || path.join(__dirname, "app"),
          "server/index.js",
        ),
      ).href
    );
    closeDatabase = backend.closeDatabase;
    appServer = backend.startServer();
    if (!appServer.listening)
      await new Promise((resolve, reject) => {
        appServer.once("listening", resolve);
        appServer.once("error", reject);
      });
    ready = true;
    openBrowser();
  } catch (e) {
    control.close();
    try {
      fs.unlinkSync(stateFile);
    } catch {}
    throw e;
  }
}
// The GUI bootstrap runs this short-lived supervisor. All child output is
// captured, including errors before launcher.cjs itself can start (for example
// missing runtime dependencies). The server is detached only after spawning.
async function ensureStarted(options = {}) {
  const dataDir =
    options.dataDir ||
    path.join(
      process.env.LOCALAPPDATA || require("node:os").homedir(),
      "ForgeAcademy",
    );
  const controlPort = options.controlPort || CONTROL_PORT;
  const stateFile = path.join(dataDir, "local-server.json");
  fs.mkdirSync(dataDir, { recursive: true });
  const status = async () => {
    try {
      const state = JSON.parse(fs.readFileSync(stateFile, "utf8"));
      return await request(controlPort, state.token);
    } catch {
      return null;
    }
  };
  let state = await status();
  if (state?.product === "ForgeAcademy" && state.ready) return;
  let child, failed;
  const logPath = path.join(dataDir, "launcher.log");
  if (!state) {
    const descriptor = fs.openSync(logPath, "a");
    const serverOptions = {
      dataDir,
      appRoot: options.appRoot,
      appPort: options.appPort,
      controlPort: options.controlPort,
    };
    // The inline driver is a fixed launcher entry, never student-supplied code.
    const driver = `require(${JSON.stringify(__filename)}).runServer(${JSON.stringify(serverOptions)})`;
    try {
      child = spawn(
        options.nodeExecutable || process.execPath,
        ["-e", driver],
        {
          detached: true,
          windowsHide: true,
          stdio: ["ignore", descriptor, descriptor],
          env: { ...process.env, NODE_OPTIONS: "" },
        },
      );
      child.on("error", (error) => {
        failed = error.message;
      });
      child.on("exit", (code, signal) => {
        failed = `Server exited before startup (code ${code}, signal ${signal || "none"}).`;
      });
      child.unref();
    } finally {
      fs.closeSync(descriptor);
    }
  }
  const deadline = Date.now() + (options.timeoutMs || 20000);
  while (Date.now() < deadline) {
    state = await status();
    if (state?.product === "ForgeAcademy" && state.ready) return;
    if (failed) throw new Error(`${failed} See ${logPath}`);
    await pause(150);
  }
  throw new Error(`Forge did not become ready in time. See ${logPath}`);
}
function runServer(options = {}) {
  process.on("uncaughtException", (error) => {
    console.error(error.stack || error.message);
    process.exit(1);
  });
  process.on("unhandledRejection", (error) => {
    console.error(error);
    process.exit(1);
  });
  main({
    ...options,
    openBrowser: () =>
      console.log(new Date().toISOString() + " Forge server ready"),
  }).catch((error) => {
    console.error(error.stack || error.message);
    process.exit(1);
  });
}
module.exports = { main, request, ensureStarted, runServer };
if (require.main === module) {
  const dataDir = path.join(
    process.env.LOCALAPPDATA || require("node:os").homedir(),
    "ForgeAcademy",
  );
  // Errors here go to stderr as well as the log so the native bootstrap can
  // report permission failures even when a log cannot be created.
  (async () => {
    fs.mkdirSync(dataDir, { recursive: true });
    if (process.argv.includes("--ensure-started")) {
      await ensureStarted({ dataDir });
      console.log("Forge is ready.");
    } else if (process.argv.includes("--stop")) {
      await main({ dataDir, stop: true });
      console.log("Forge stopped.");
    } else {
      await ensureStarted({ dataDir });
      // Retain a safe manual CLI launch path without cmd.exe quote parsing.
      const browser = spawn(
        "rundll32.exe",
        ["url.dll,FileProtocolHandler", `http://127.0.0.1:${APP_PORT}`],
        { windowsHide: true, stdio: "ignore" },
      );
      browser.on("error", (error) =>
        console.error(
          `Forge is running. Open http://127.0.0.1:${APP_PORT} manually. ${error.message}`,
        ),
      );
      browser.on("exit", (code) => {
        if (code)
          console.error(
            `Open http://127.0.0.1:${APP_PORT} manually; browser launch returned ${code}.`,
          );
      });
    }
  })().catch((error) => {
    const text = error.stack || error.message;
    try {
      fs.appendFileSync(
        path.join(dataDir, "launcher.log"),
        new Date().toISOString() + " " + text + "\n",
      );
    } catch {}
    console.error(error.message);
    process.exitCode = 1;
  });
}
