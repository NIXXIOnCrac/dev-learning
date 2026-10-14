// The packaged Windows app is tested using Linux Node, not the bundled PE.
import { verifyPayload } from "../local/verify.mjs";
import { root } from "../local/payload.mjs";
import path from "node:path";
await verifyPayload(
  path.join(root, ".cache/forge-installer/payload"),
  "Windows payload on Linux",
);
