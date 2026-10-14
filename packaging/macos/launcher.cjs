const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const { spawn } = require("node:child_process");
const core = fs.existsSync(path.join(__dirname, "local-server.cjs"))
  ? require("./local-server.cjs")
  : require("../windows/launcher.cjs");
function dataDirectory(home = os.homedir()) {
  return path.join(home, "Library", "Application Support", "ForgeAcademy");
}
function openBrowser(url) {
  const child = spawn("/usr/bin/open", [url], { stdio: "ignore" });
  child.on("error", (error) =>
    console.error("Open " + url + " manually: " + error.message),
  );
  child.unref();
}
function main(options = {}) {
  const dataDir = options.dataDir || dataDirectory();
  fs.mkdirSync(dataDir, { recursive: true, mode: 0o700 });
  return core.main({
    ...options,
    dataDir,
    openBrowser:
      options.openBrowser || (() => openBrowser("http://127.0.0.1:33791")),
  });
}
module.exports = { main, request: core.request, dataDirectory };
if (require.main === module) {
  const dataDir = dataDirectory();
  fs.mkdirSync(dataDir, { recursive: true, mode: 0o700 });
  const log = fs.openSync(path.join(dataDir, "launcher.log"), "a", 0o600);
  const write = (text) =>
    fs.writeSync(log, new Date().toISOString() + " " + text + "\n");
  console.log = (...args) => write(args.join(" "));
  console.error = (...args) => write(args.join(" "));
  main({ dataDir, stop: process.argv.includes("--stop") }).catch((error) => {
    write(error.stack || error.message);
    if (process.platform === "darwin") {
      const message =
        "Forge could not start or stop. Ports 33791 or 33792 may be in use. Details: " +
        path.join(dataDir, "launcher.log");
      // The message is an argv value, never interpolated into AppleScript source.
      const popup = spawn(
        "/usr/bin/osascript",
        [
          "-e",
          'on run argv\ndisplay alert "Forge Coding Academy" message (item 1 of argv) as warning\nend run',
          message,
        ],
        { stdio: "ignore" },
      );
      popup.on("error", () => process.exit(1));
      popup.on("exit", () => process.exit(1));
    } else process.exit(1);
  });
}
