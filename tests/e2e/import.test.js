// 시나리오 2: 엑셀 매핑 가져오기 → 검수 대기열(주입) → 수정·승인 → 스탯 증가 → 기존 연결 갱신
const path = require("node:path");
const os = require("node:os");
const fs = require("node:fs");
const { assert, signUp, uidOf, writeDoc, F, addSeed, stats } = require("./lib");

function makeXlsx() {
  const XLSX = require("xlsx");
  const rows = [
    ["원문", "번역", "분야", "상황", "가중치", "메모"],
    ["위장약", "stomach medicine", "의료", "환자 설명", "85", "환자에게"],
    ["소견서", "medical certificate", "의료", "차트·문서", "90", ""],
    ["소견서", "診断書", "의료", "", "80", "일본어"],
    ["", "", "", "", "", ""],
    ["입원 수속", "admission procedure", "의료", "행정 민원", "75", "원무과"],
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), "용어집");
  const file = path.join(os.tmpdir(), `nuance-e2e-${Date.now()}.xlsx`);
  XLSX.writeFile(wb, file);
  return file;
}

module.exports = async function importScenario(page, log) {
  const { email, password } = await signUp(page, "import");
  await addSeed(page);
  const before = await stats(page);

  // 1) 엑셀 매핑 가져오기
  await page.getByRole("button", { name: "메뉴" }).click();
  await page.getByRole("button", { name: /시트·CSV 가져오기/ }).click();
  await page.locator(".modal input[type=file]").setInputFiles(makeXlsx());
  await page.locator(".modal table").waitFor();
  assert.match(await page.locator(".modal .card.small").innerText(), /표현 7개, 연결 4개/);
  await page.getByRole("button", { name: "가져오기", exact: true }).click();
  await page.locator(".toast").waitFor({ timeout: 30000 });
  assert.match(await page.locator(".toast").innerText(), /표현 7개, 연결 4개/);
  await page.locator(".toast").click();
  log("엑셀 매핑 7/4 OK");

  // 2) 잘못된 구글 시트 링크, AI 옵션은 키 없이 비활성
  await page.getByRole("button", { name: "메뉴" }).click();
  await page.getByRole("button", { name: /시트·CSV 가져오기/ }).click();
  await page.fill('.modal input[placeholder^="https://docs.google.com"]', "https://example.com/nope");
  await page.getByRole("button", { name: "불러오기" }).click();
  assert.match(await page.locator(".modal .error").innerText(), /구글 스프레드시트 링크가 아닙니다/);
  await page.fill(".modal textarea", "source,target\n가,나");
  await page.getByRole("button", { name: "이 내용 사용" }).click();
  assert.equal(await page.locator(".modal input[name=method]").nth(1).isDisabled(), !process.env.ANTHROPIC_API_KEY);
  await page.keyboard.press("Escape");

  // 3) 검수 대기열 주입 (AI 키 없이 UI 검증)
  const uid = await uidOf(email, password);
  const base = { import_id: F.s("e2e"), domain: F.s("의료"), created_at: F.s(new Date().toISOString()) };
  await writeDoc(`users/${uid}/inbox`, { ...base, source_text: F.s("진통제"), source_lang: F.s("ko"), target_text: F.s("painkiller"), target_lang: F.s("en"), relation: F.s("equivalent"), weight: F.d(0.95), situation: F.s("환자 설명"), note: F.s("기존 쌍: 가중치 갱신 기대"), register: F.s("casual"), example: F.n(), confidence: F.s("high"), row: F.i(2) });
  await writeDoc(`users/${uid}/inbox`, { ...base, source_text: F.s("해열제"), source_lang: F.s("ko"), target_text: F.s("fever reducer"), target_lang: F.s("en"), relation: F.s("equivalent"), weight: F.d(0.85), situation: F.s("환자 설명"), note: F.s(""), register: F.n(), example: F.map({ text: F.s("해열제 드세요."), translation: F.s("Take a fever reducer."), situation: F.n() }), confidence: F.s("low"), row: F.i(3) });
  await page.reload({ waitUntil: "load" });
  await page.locator(".stats").waitFor();
  const mid = await stats(page);
  const inboxBtn = page.getByRole("button", { name: /^검수/ });
  assert.match(await inboxBtn.innerText(), /2/);
  await inboxBtn.click();
  await page.locator(".modal").waitFor();
  const firstTexts = await page.locator(".modal .edge-item").first().innerText();
  assert.match(firstTexts, /확신 낮음/, "확신 낮은 항목이 먼저");
  await page.getByRole("button", { name: /선택 반영/ }).click();
  await page.locator(".toast").waitFor({ timeout: 30000 });
  const msg = await page.locator(".toast").innerText();
  assert.match(msg, /표현 2개, 연결 1개, 예문 1개 추가, 기존 연결 1개 갱신/, msg);
  await page.waitForTimeout(800);
  const after = await stats(page);
  assert.equal(after[0], mid[0] + 2, "표현 +2");
  assert.equal(after[1], mid[1] + 1, "연결 +1");
  assert.equal(await page.getByRole("button", { name: /^검수/ }).count(), 0, "대기열 비움");
  log(`검수 반영 OK (${before[0]}→${after[0]} 표현)`);

  // 4) 기존 연결의 가중치가 95% 로 갱신되었는지
  await page.keyboard.press("Control+k");
  await page.keyboard.type("진통제");
  await page.keyboard.press("Enter");
  await page.locator(".panel h2").waitFor();
  const rows = await page.locator(".edge-item").allInnerTexts();
  const pk = rows.find((r) => r.includes("painkiller"));
  assert.ok(pk && pk.includes("95%"), `painkiller 연결 가중치: ${pk}`);
  log("기존 연결 가중치 갱신 OK");

  // 5) 상황 태그 검색
  await page.getByRole("button", { name: "대시보드" }).click();
  await page.locator(".spotlight input").click();
  await page.keyboard.type("행정 민원");
  await page.waitForTimeout(300);
  const hits = await page.locator(".spotlight .search-results button").allInnerTexts();
  assert.ok(hits.some((h) => h.includes("입원 수속")), `상황 태그 검색 결과: ${hits}`);
  log("상황 태그 검색 OK");
};
