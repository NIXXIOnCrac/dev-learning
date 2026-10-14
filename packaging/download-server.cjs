// Temporary, allowlisted download server. Never serves source, data, or credentials.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../releases');
const downloads = {
  '/windows': ['Forge-Academy-1.0.0-win-x64-Setup.exe', 'application/vnd.microsoft.portable-executable'],
  '/mac-apple': ['Forge-Academy-1.0.0-macOS-Apple-Silicon.pkg', 'application/octet-stream'],
  '/mac-intel': ['Forge-Academy-1.0.0-macOS-Intel.pkg', 'application/octet-stream'],
  '/windows-checksum': ['SHA256SUMS.txt', 'text/plain; charset=utf-8'],
  '/mac-checksums': ['MACOS-SHA256SUMS.txt', 'text/plain; charset=utf-8'],
};
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Download Forge Coding Academy</title><style>
*{box-sizing:border-box}body{margin:0;background:#090e18;color:#f0f4ff;font-family:system-ui,-apple-system,sans-serif}main{max-width:840px;margin:8vh auto;padding:24px}.brand{color:#81a9ff;font-weight:700;letter-spacing:3px;font-size:13px}h1{font-size:clamp(30px,5vw,48px);letter-spacing:-1.5px;margin-bottom:14px}.intro{color:#b1bfd4;line-height:1.7;margin-bottom:30px}.cards{display:grid;gap:14px}.card{background:#121b2b;border:1px solid #253550;border-radius:14px;padding:24px;display:flex;gap:20px;align-items:center;justify-content:space-between}.card h2{margin:0 0 8px;font-size:19px}.card p{margin:0;color:#aabbd3;font-size:14px;line-height:1.5}a.button{display:inline-block;flex-shrink:0;text-align:center;color:#fff;background:#326eeb;border:1px solid #6898ff;border-radius:8px;padding:14px 20px;font-weight:650;text-decoration:none}a.button:hover{background:#4882f5}a:focus-visible{outline:3px solid #fff;outline-offset:4px}.note{margin-top:25px;padding:18px;border:1px solid #514937;border-radius:10px;color:#e1d1ad;font-size:14px;line-height:1.7}.help{color:#9dacc3;font-size:13px;line-height:1.7}a{color:#94b7ff}@media(max-width:620px){.card{align-items:stretch;flex-direction:column}main{margin:3vh auto}}
</style></head><body><main><div class="brand">FORGE / CODING ACADEMY</div><h1>Your academy. On your computer.</h1><p class="intro">Choose your operating system. These buttons download the actual installer file—no developer tools or separate runtimes needed.</p><div class="cards"><section class="card"><div><h2>Windows</h2><p>Windows 10 or 11 · 64-bit · approximately 31 MB</p></div><a class="button" href="/windows" download="Forge-Academy-1.0.0-win-x64-Setup.exe">Download for Windows ↓</a></section><section class="card"><div><h2>Mac · Apple Silicon</h2><p>M-series chips · macOS 11+ · approximately 49 MB</p></div><a class="button" href="/mac-apple" download="Forge-Academy-1.0.0-macOS-Apple-Silicon.pkg">Download for Apple Silicon ↓</a></section><section class="card"><div><h2>Mac · Intel</h2><p>Intel processors · macOS 11+ · approximately 50 MB</p></div><a class="button" href="/mac-intel" download="Forge-Academy-1.0.0-macOS-Intel.pkg">Download for Intel Mac ↓</a></section></div><p class="help">Not sure which Mac? Apple menu → About This Mac → Chip or Processor.<br>If an embedded preview blocks downloads, open this page in a new browser tab and try again.</p><div class="note"><strong>Before installing:</strong> these are unsigned builds; the Mac packages are not notarized. Native installation has not been tested on Windows or macOS. Your system may show a security warning. Do not disable system protections. Preview progress is not automatically imported.</div><p class="help">Checksums: <a href="/windows-checksum">Windows SHA-256</a> · <a href="/mac-checksums">macOS SHA-256</a><br>This temporary download page remains available while this workspace server is running.</p></main></body></html>`;
const server = http.createServer((req, res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Cache-Control', 'no-store');
  if (!['GET', 'HEAD'].includes(req.method)) {
    res.writeHead(405, { Allow: 'GET, HEAD' }); res.end(); return;
  }
  const pathname = new URL(req.url, 'http://downloads.invalid').pathname;
  if (pathname === '/') {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'");
    res.end(req.method === 'HEAD' ? undefined : html); return;
  }
  const item = downloads[pathname];
  if (!item) { res.writeHead(404); res.end('Not found'); return; }
  const [name, type] = item;
  const file = path.join(root, name);
  let info;
  try { info = fs.statSync(file); } catch { res.writeHead(404); res.end('This build is no longer available in this workspace.'); return; }
  res.setHeader('Content-Type', type);
  res.setHeader('Content-Length', info.size);
  res.setHeader('Content-Disposition', `attachment; filename="${name}"`);
  if (req.method === 'HEAD') { res.end(); return; }
  const stream = fs.createReadStream(file);
  stream.on('error', () => res.destroy());
  res.on('close', () => stream.destroy());
  stream.pipe(res);
});
server.listen(4080, '0.0.0.0', () => {
  console.log('Forge downloads are ready on port 4080');
  if (process.env.E2B_SANDBOX_ID) console.log(`https://4080-${process.env.E2B_SANDBOX_ID}.e2b.app`);
});
