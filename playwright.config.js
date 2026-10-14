import { defineConfig } from "@playwright/test";
import serverless from "@sparticuz/chromium";
import fs from "node:fs";
import zlib from "node:zlib";
import { execFileSync } from "node:child_process";
// A registry-distributed Chromium makes tests runnable in restricted workspaces.
const libDir = new URL("./.cache/chromium-libs/", import.meta.url).pathname;
if (!fs.existsSync(libDir + "lib/libnspr4.so")) {
  fs.mkdirSync(libDir, { recursive: true });
  fs.writeFileSync(
    libDir + "al2023.tar",
    zlib.brotliDecompressSync(
      fs.readFileSync(
        new URL(
          "./node_modules/@sparticuz/chromium/bin/al2023.tar.br",
          import.meta.url,
        ),
      ),
    ),
  );
  execFileSync("tar", ["-xf", libDir + "al2023.tar", "-C", libDir]);
}
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 90000,
  expect: { timeout: 15000 },
  workers: 1,
  use: {
    baseURL: "http://localhost:3000",
    viewport: { width: 1440, height: 1000 },
    headless: true,
    launchOptions: {
      executablePath: await serverless.executablePath(),
      args: [
        "--no-sandbox",
        "--disable-dev-shm-usage",
        "--no-zygote",
        "--use-gl=angle",
        "--use-angle=swiftshader",
      ],
      env: {
        ...process.env,
        LD_LIBRARY_PATH:
          libDir +
          "lib" +
          (process.env.LD_LIBRARY_PATH
            ? ":" + process.env.LD_LIBRARY_PATH
            : ""),
      },
    },
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 60000,
  },
});
