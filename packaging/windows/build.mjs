// Reproducible Linux-hosted build of a self-contained, per-user Windows installer.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const source = path.join(root, "packaging/windows");
const cache = path.join(root, ".cache/forge-installer");
const payload = path.join(cache, "payload");
const output = path.join(
  root,
  "releases/Forge-Academy-1.0.1-win-x64-Setup.exe",
);
const nodeVersion = "22.23.3";
const nsisBlob = "51fe3639ee90f22d5d8461f089d25975b12cab90";
function run(cmd, args, cwd = root) {
  execFileSync(cmd, args, { cwd, stdio: "inherit" });
}
function copy(from, to) {
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.cpSync(from, to, { recursive: true });
}
function download(url, to) {
  run("curl", [
    "--fail",
    "--silent",
    "--show-error",
    "--header",
    "Accept: application/vnd.github.raw+json",
    url,
    "--output",
    to,
  ]);
}
fs.mkdirSync(cache, { recursive: true });
fs.mkdirSync(path.dirname(output), { recursive: true });
if (!fs.existsSync(path.join(root, "dist/index.html")))
  throw new Error("Run npm run build first.");
const nsisArchive = path.join(cache, "nsis.tar.gz");
if (!fs.existsSync(nsisArchive))
  download(
    `https://api.github.com/repos/electron-userland/electron-builder-binaries/git/blobs/${nsisBlob}`,
    nsisArchive,
  );
const nsisData = fs.readFileSync(nsisArchive);
if (
  crypto
    .createHash("sha1")
    .update(`blob ${nsisData.length}\0`)
    .update(nsisData)
    .digest("hex") !== nsisBlob
)
  throw new Error("NSIS archive does not match the pinned Git blob.");
run("tar", ["-xzf", nsisArchive, "-C", cache]);
// npm pack checks the package's registry integrity; the package version is pinned.
run("npm", [
  "pack",
  `node-win-x64@${nodeVersion}`,
  "--pack-destination",
  cache,
  "--silent",
]);
const nodeExtract = path.join(cache, "node");
fs.mkdirSync(nodeExtract, { recursive: true });
run("tar", [
  "-xzf",
  path.join(cache, `node-win-x64-${nodeVersion}.tgz`),
  "-C",
  nodeExtract,
]);
fs.rmSync(payload, { recursive: true, force: true });
fs.mkdirSync(payload, { recursive: true });
const app = path.join(payload, "app");
for (const file of ["package.json", "package-lock.json"])
  copy(path.join(source, file), path.join(app, file));
run(
  "npm",
  ["ci", "--omit=dev", "--ignore-scripts", "--no-audit", "--no-fund"],
  app,
);
for (const dir of ["dist", "server", "public"])
  copy(path.join(root, dir), path.join(app, dir));
for (const file of ["content.js", "learning.js"])
  copy(path.join(root, "src", file), path.join(app, "src", file));
copy(path.join(root, "src/curriculum"), path.join(app, "src/curriculum"));
copy(
  path.join(root, "node_modules/pyodide"),
  path.join(app, "node_modules/pyodide"),
);
for (const file of [
  "typescript.js",
  "LICENSE.txt",
  "ThirdPartyNoticeText.txt",
]) {
  const from = path.join(
    root,
    "node_modules/typescript",
    file === "typescript.js" ? "lib" : "",
    file,
  );
  if (fs.existsSync(from))
    copy(
      from,
      path.join(
        app,
        "node_modules/typescript",
        file === "typescript.js" ? "lib" : "",
        file,
      ),
    );
}
for (const file of ["sql-wasm.js", "sql-wasm.wasm"])
  copy(
    path.join(root, "node_modules/sql.js/dist", file),
    path.join(app, "node_modules/sql.js/dist", file),
  );
copy(
  path.join(root, "node_modules/sql.js/LICENSE"),
  path.join(app, "node_modules/sql.js/LICENSE"),
);
copy(
  path.join(nodeExtract, "package/bin/node.exe"),
  path.join(payload, "node.exe"),
);
for (const file of [
  "launcher.cjs",
  "launch.vbs",
  "message.vbs",
  "INSTALLATION.txt",
  "forge.ico",
])
  copy(path.join(source, file), path.join(payload, file));
const licenses = path.join(payload, "licenses");
fs.mkdirSync(licenses, { recursive: true });
copy(
  path.join(cache, "nsis-bundle/windows/COPYING"),
  path.join(licenses, "NSIS-COPYING.txt"),
);
download(
  `https://api.github.com/repos/nodejs/node/contents/LICENSE?ref=v${nodeVersion}`,
  path.join(licenses, "Node-LICENSE.txt"),
);
// Preserve licenses for libraries bundled into Vite's browser assets.
for (const entry of fs.readdirSync(path.join(root, "node_modules"))) {
  if (entry.startsWith(".")) continue;
  const directories = entry.startsWith("@")
    ? fs
        .readdirSync(path.join(root, "node_modules", entry))
        .map((n) => `${entry}/${n}`)
    : [entry];
  for (const name of directories) {
    const dir = path.join(root, "node_modules", name);
    if (!fs.statSync(dir).isDirectory()) continue;
    for (const file of fs
      .readdirSync(dir)
      .filter((f) => /^(licen[sc]e|copying|thirdparty)/i.test(f))) {
      if (fs.statSync(path.join(dir, file)).isFile())
        copy(
          path.join(dir, file),
          path.join(licenses, name.replaceAll("/", "_") + "-" + file),
        );
    }
  }
}
fs.writeFileSync(
  path.join(licenses, "RUNTIME-SOURCES.txt"),
  `Node.js ${nodeVersion}: https://github.com/nodejs/node\nPyodide ${JSON.parse(fs.readFileSync(path.join(root, "node_modules/pyodide/package.json"))).version}: https://github.com/pyodide/pyodide (MPL-2.0)\nPython: https://github.com/python/cpython\nSQLite/SQL.js: https://github.com/sql-js/sql.js\nTypeScript: https://github.com/microsoft/TypeScript\nNSIS compiler bundle pinned Git blob: ${nsisBlob}\n`,
);
// MPL requires the corresponding license text with the distributed runtime.
const pyVersion = JSON.parse(
  fs.readFileSync(path.join(root, "node_modules/pyodide/package.json")),
).version;
download(
  `https://api.github.com/repos/pyodide/pyodide/contents/LICENSE?ref=${pyVersion}`,
  path.join(licenses, "Pyodide-LICENSE.txt"),
);
run(path.join(cache, "nsis-bundle/makensis"), [
  "-V3",
  `-DPAYLOAD=${payload}`,
  `-DOUTPUT=${output}`,
  path.join(source, "installer.nsi"),
]);
const hash = crypto
  .createHash("sha256")
  .update(fs.readFileSync(output))
  .digest("hex");
fs.writeFileSync(
  path.join(root, "releases/SHA256SUMS.txt"),
  `${hash}  ${path.basename(output)}\n`,
);
copy(
  path.join(source, "INSTALLATION.txt"),
  path.join(root, "releases/READ-ME.txt"),
);
console.log(`Installer: ${output}\nSHA-256: ${hash}`);
