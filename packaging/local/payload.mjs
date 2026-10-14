import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
export const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
export function run(command, args, cwd = root) {
  execFileSync(command, args, { cwd, stdio: "inherit" });
}
export function copy(from, to) {
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.cpSync(from, to, { recursive: true });
}
export function download(url, to) {
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
// No learner data or native host dependencies are copied. The same locked,
// pure-JavaScript backend dependency set is used by both desktop distributions.
export function preparePayload(destination) {
  const app = path.join(destination, "app");
  if (!fs.existsSync(path.join(root, "dist/index.html")))
    throw new Error("Run npm run build first.");
  for (const file of ["package.json", "package-lock.json"])
    copy(path.join(root, "packaging/windows", file), path.join(app, file));
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
  copy(
    path.join(root, "node_modules/typescript/lib/typescript.js"),
    path.join(app, "node_modules/typescript/lib/typescript.js"),
  );
  for (const file of ["sql-wasm.js", "sql-wasm.wasm"])
    copy(
      path.join(root, "node_modules/sql.js/dist", file),
      path.join(app, "node_modules/sql.js/dist", file),
    );
  const licenses = path.join(destination, "licenses");
  fs.mkdirSync(licenses, { recursive: true });
  for (const entry of fs.readdirSync(path.join(root, "node_modules"))) {
    if (entry.startsWith(".")) continue;
    const names = entry.startsWith("@")
      ? fs
          .readdirSync(path.join(root, "node_modules", entry))
          .map((n) => `${entry}/${n}`)
      : [entry];
    for (const name of names) {
      const directory = path.join(root, "node_modules", name);
      if (!fs.statSync(directory).isDirectory()) continue;
      for (const file of fs
        .readdirSync(directory)
        .filter((f) => /^(licen[sc]e|copying|thirdparty)/i.test(f)))
        if (fs.statSync(path.join(directory, file)).isFile())
          copy(
            path.join(directory, file),
            path.join(licenses, name.replaceAll("/", "_") + "-" + file),
          );
    }
  }
  const pyVersion = JSON.parse(
    fs.readFileSync(path.join(root, "node_modules/pyodide/package.json")),
  ).version;
  download(
    `https://api.github.com/repos/pyodide/pyodide/contents/LICENSE?ref=${pyVersion}`,
    path.join(licenses, "Pyodide-LICENSE.txt"),
  );
  fs.writeFileSync(
    path.join(licenses, "RUNTIME-SOURCES.txt"),
    `Node.js 22.23.3: https://github.com/nodejs/node\nPyodide ${pyVersion}: https://github.com/pyodide/pyodide (MPL-2.0)\nPython: https://github.com/python/cpython\nSQLite/SQL.js: https://github.com/sql-js/sql.js\nTypeScript: https://github.com/microsoft/TypeScript\n`,
  );
}
