// Native Mach-O binaries and Finder launch still require a real Mac test.
import { verifyPayload } from "../local/verify.mjs";
import { root } from "../local/payload.mjs";
import path from "node:path";
for (const arch of ["arm64", "x64"]) {
  await verifyPayload(
    path.join(
      root,
      `.cache/forge-macos/stage-${arch}/Applications/Forge Coding Academy.app/Contents/Resources`,
    ),
    `macOS ${arch} payload on Linux`,
  );
}
