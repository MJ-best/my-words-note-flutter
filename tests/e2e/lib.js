// 공용 헬퍼: 가입, 시드, 노드 좌표, 단언
const assert = require("node:assert/strict");

const BASE = process.env.E2E_BASE_URL || "http://localhost:3123";
const AUTH = "http://127.0.0.1:9099";
const FIRESTORE = "http://127.0.0.1:8085/v1/projects/demo-nuance/databases/(default)/documents";
const API_KEY = "fake-api-key";

/** 새 계정으로 가입하고 빈 화면까지 들어간다 */
async function signUp(page, label = "e2e") {
  const email = `${label}-${Date.now()}-${Math.floor(Math.random() * 1e4)}@example.com`;
  const password = "secret123";
  await page.goto(`${BASE}/login`, { waitUntil: "load" });
  await page.getByRole("button", { name: /새로 만들기/ }).click();
  await page.fill("input[type=email]", email);
  await page.fill("input[type=password]", password);
  await page.getByRole("button", { name: "계정 만들기" }).click();
  await page.getByRole("button", { name: "스타터 팩으로 시작" }).waitFor({ timeout: 20000 });
  return { email, password };
}

/** 에뮬레이터 Auth 에서 uid 를 얻는다 */
async function uidOf(email, password) {
  const r = await fetch(`${AUTH}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  return (await r.json()).localId;
}

/** 규칙을 우회하는 에뮬레이터 소유자 토큰으로 문서를 쓴다 (테스트 데이터 주입용) */
async function writeDoc(path, fields) {
  const r = await fetch(`${FIRESTORE}/${path}`, {
    method: "POST", headers: { "content-type": "application/json", authorization: "Bearer owner" },
    body: JSON.stringify({ fields }),
  });
  if (!r.ok) throw new Error(`Firestore write failed ${r.status}: ${await r.text()}`);
}
const F = {
  s: (v) => ({ stringValue: v }),
  n: () => ({ nullValue: null }),
  d: (v) => ({ doubleValue: v }),
  i: (v) => ({ integerValue: String(v) }),
  map: (fields) => ({ mapValue: { fields } }),
};

async function addStarterPack(page) {
  await page.getByRole("button", { name: "스타터 팩으로 시작" }).click();
  await page.getByRole("button", { name: "그래프에 추가" }).click();
  await page.locator(".toast").waitFor({ timeout: 60000 });
  await page.locator(".toast").click();
  await page.locator(".stats").waitFor();
}

async function addSeed(page) {
  await page.getByRole("button", { name: "작은 예시 그래프" }).click();
  await page.locator(".stats").waitFor();
  await page.waitForFunction(() => document.querySelectorAll(".wcard").length > 0 || document.querySelector(".dash-empty"));
}

const positions = (page) => page.evaluate(() => window.__graphPositions());
const explorerNote = (page) => page.locator(".explorer-note").innerText().catch(() => "");
async function deselect(page) {
  await page.keyboard.press("Escape");
  await page.waitForTimeout(250);
}
/** "표시 중 N개" 에서 N */
async function visibleCount(page) {
  await deselect(page);
  const m = (await explorerNote(page)).match(/표시 중 (\d+)개/);
  return m ? Number(m[1]) : null;
}
const stats = async (page) => (await page.locator(".stat .value").allInnerTexts()).map(Number);

module.exports = { BASE, assert, signUp, uidOf, writeDoc, F, addStarterPack, addSeed, positions, deselect, visibleCount, stats };
