/**
 * E2E 실행기.
 *  1) Firebase 에뮬레이터가 떠 있어야 한다:  npm run emulators   (다른 터미널)
 *  2) npm run test:e2e
 * 개발 서버는 에뮬레이터용 환경 변수로 여기서 직접 띄운다 (.env.local 불필요).
 */
const { spawn } = require("node:child_process");
const net = require("node:net");
const path = require("node:path");

const PORT = Number(process.env.E2E_PORT || 3123);
const ROOT = path.resolve(__dirname, "..", "..");
const ENV = {
  ...process.env,
  NEXT_PUBLIC_FIREBASE_API_KEY: "fake-api-key",
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "demo-nuance.firebaseapp.com",
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: "demo-nuance",
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: "demo-nuance.appspot.com",
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: "1",
  NEXT_PUBLIC_FIREBASE_APP_ID: "1:1:web:1",
  NEXT_PUBLIC_FIREBASE_USE_EMULATOR: "1",
};

function portOpen(port, host = "127.0.0.1") {
  return new Promise((resolve) => {
    const s = net.createConnection({ port, host });
    s.once("connect", () => { s.end(); resolve(true); });
    s.once("error", () => resolve(false));
  });
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  if (!(await portOpen(8085)) || !(await portOpen(9099))) {
    console.error("Firebase 에뮬레이터가 없습니다. 다른 터미널에서 `npm run emulators` 를 먼저 실행하세요.");
    process.exit(2);
  }
  let dev = null;
  if (!(await portOpen(PORT))) {
    dev = spawn("npx", ["next", "dev", "-p", String(PORT)], { cwd: ROOT, env: ENV, stdio: ["ignore", "pipe", "pipe"] });
    dev.stdout.on("data", () => {});
    dev.stderr.on("data", (d) => process.stderr.write(d));
    for (let i = 0; i < 60; i++) {
      try {
        const r = await fetch(`http://localhost:${PORT}/login`);
        if (r.ok) break;
      } catch {}
      await sleep(2000);
    }
  }

  const { chromium } = require("playwright");
  const browser = await chromium.launch();
  const scenarios = [
    ["탐색 (대시보드 → 1촌 그래프 → 확장·접기 → 팩 신청 → 되돌리기)", require("./explorer.test")],
    ["가져오기 (엑셀 매핑 → 검수 대기열 → 반영 → 갱신 → 상황 검색)", require("./import.test")],
  ];
  let failed = 0;
  for (const [name, fn] of scenarios) {
    const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.setDefaultTimeout(30000);
    const t0 = Date.now();
    try {
      await fn(page, (m) => console.log(`   · ${m}`));
      if (errors.length) throw new Error(`페이지 오류: ${errors.join(" | ")}`);
      console.log(`✔ ${name} (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
    } catch (e) {
      failed++;
      console.log(`✘ ${name}\n   ${e.stack || e}`);
      await page.screenshot({ path: path.join(ROOT, `e2e-failure-${scenarios.indexOf(scenarios.find(([n]) => n === name)) + 1}.png`) }).catch(() => {});
    } finally {
      await page.context().close();
    }
  }
  await browser.close();
  if (dev) dev.kill("SIGTERM");
  process.exit(failed ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
