import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import {
  root,
  run,
  copy,
  download,
  preparePayload,
} from "../local/payload.mjs";
const source = path.join(root, "packaging/macos");
const cache = path.join(root, ".cache/forge-macos");
const releases = path.join(root, "releases");
const version = "22.23.3";
const bomCommit = "c247002e2f49878bab32dd0fcf805810ae0992cb";
fs.mkdirSync(cache, { recursive: true });
fs.mkdirSync(releases, { recursive: true });
const bomRoot = path.join(cache, "bomutils-" + bomCommit);
const mkbom = path.join(bomRoot, "build/bin/mkbom");
if (!fs.existsSync(mkbom)) {
  download(
    `https://codeload.github.com/hogliux/bomutils/tar.gz/${bomCommit}`,
    path.join(cache, "bomutils.tar.gz"),
  );
  run("tar", ["-xzf", path.join(cache, "bomutils.tar.gz"), "-C", cache]);
  run("make", ["-j2"], bomRoot);
}
// Small fixes to pinned bomutils: select the Paths tree rather than BomInfo
// in its diagnostic reader, and include dotfiles in its filesystem traversal.
// Neither change modifies the BOM binary-format implementation.
for (const [file, before, after] of [
  [
    "lsbom.cpp",
    'if (strstr(name.c_str(),"Paths") == 0)',
    'if (name == "Paths")',
  ],
  [
    "printnode.cpp",
    "if ( dir->d_name[0] != '.' )",
    'if ( string(dir->d_name) != "." && string(dir->d_name) != ".." )',
  ],
]) {
  const filename = path.join(bomRoot, "src", file);
  const content = fs.readFileSync(filename, "utf8");
  if (content.includes(before))
    fs.writeFileSync(filename, content.replace(before, after));
  else if (!content.includes(after))
    throw new Error("Unexpected bomutils source: " + file);
}
run("make", ["-j2"], bomRoot);
const common = path.join(cache, "common");
fs.rmSync(common, { recursive: true, force: true });
preparePayload(common);
copy(
  path.join(root, "packaging/windows/launcher.cjs"),
  path.join(common, "local-server.cjs"),
);
copy(path.join(source, "launcher.cjs"), path.join(common, "launcher.cjs"));
copy(path.join(source, "READ-ME.txt"), path.join(common, "READ-ME.txt"));
const checksums = [];
for (const [arch, packageName, label] of [
  ["arm64", "node-bin-darwin-arm64", "Apple-Silicon"],
  ["x64", "node-darwin-x64", "Intel"],
]) {
  run("npm", [
    "pack",
    `${packageName}@${version}`,
    "--pack-destination",
    cache,
    "--silent",
  ]);
  const nodeRoot = path.join(cache, "node-" + arch);
  fs.mkdirSync(nodeRoot, { recursive: true });
  run("tar", [
    "-xzf",
    path.join(cache, `${packageName}-${version}.tgz`),
    "-C",
    nodeRoot,
    "package/bin/node",
    "package/LICENSE",
  ]);
  const stage = path.join(cache, "stage-" + arch);
  fs.rmSync(stage, { recursive: true, force: true });
  const resources = path.join(
    stage,
    "Applications/Forge Coding Academy.app/Contents/Resources",
  );
  copy(common, resources);
  copy(path.join(nodeRoot, "package/bin/node"), path.join(resources, "node"));
  copy(
    path.join(nodeRoot, "package/LICENSE"),
    path.join(resources, "licenses/Node-LICENSE.txt"),
  );
  const output = path.join(releases, `Forge-Academy-1.0.0-macOS-${label}.pkg`);
  run("python3", [
    path.join(source, "package.py"),
    "build",
    stage,
    arch,
    mkbom,
    output,
  ]);
  run("python3", [
    path.join(source, "package.py"),
    "verify",
    output,
    stage,
    arch,
    path.join(bomRoot, "build/bin/lsbom"),
  ]);
  const hash = crypto
    .createHash("sha256")
    .update(fs.readFileSync(output))
    .digest("hex");
  checksums.push(`${hash}  ${path.basename(output)}`);
  console.log(
    `Built ${label}: ${(fs.statSync(output).size / 1024 / 1024).toFixed(1)} MiB`,
  );
}
fs.writeFileSync(
  path.join(releases, "MACOS-SHA256SUMS.txt"),
  checksums.join("\n") + "\n",
);
copy(
  path.join(source, "READ-ME.txt"),
  path.join(releases, "MACOS-READ-ME.txt"),
);
