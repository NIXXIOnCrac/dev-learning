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
module.exports = { main, request };
if (require.main === module) {
  const dataDir = path.join(
    process.env.LOCALAPPDATA || require("node:os").homedir(),
    "ForgeAcademy",
  );
  fs.mkdirSync(dataDir, { recursive: true });
  const log = fs.openSync(path.join(dataDir, "launcher.log"), "a");
  const write = (text) =>
    fs.writeSync(log, new Date().toISOString() + " " + text + "\n");
  console.log = (...args) => write(args.join(" "));
  console.error = (...args) => write(args.join(" "));
  main({ dataDir, stop: process.argv.includes("--stop") }).catch((e) => {
    write(e.stack || e.message);
    if (process.platform === "win32" && !process.argv.includes("--quiet")) {
      const message =
        "Forge could not start or stop. A local port may already be in use. Details: " +
        path.join(dataDir, "launcher.log");
      const popup = spawn(
        "wscript.exe",
        [path.join(__dirname, "message.vbs"), message],
        { windowsHide: true, stdio: "ignore" },
      );
      popup.on("error", () => process.exit(1));
      popup.on("exit", () => process.exit(1));
    } else process.exit(1);
  });
}
