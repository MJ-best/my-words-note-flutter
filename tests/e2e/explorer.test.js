// 시나리오 1: 로그인 → 대시보드 검색 → 1촌 그래프 → 더블클릭으로 2촌 확장·접기 → 중심 전환·뒤로 가기 → 전체 보기 → 팩 신청 → 되돌리기
const { assert, signUp, addStarterPack, positions, visibleCount, stats } = require("./lib");

module.exports = async function explorerScenario(page, log) {
  await signUp(page, "explorer");
  await addStarterPack(page);

  const st = await stats(page);
  assert.ok(st[0] >= 250, `표현 수 ${st[0]}`);
  assert.ok(st[1] >= 250, `연결 수 ${st[1]}`);
  assert.ok((await page.locator(".wcard").count()) >= 1, "선호 카드가 있어야 함");
  log(`대시보드 스탯 ${st.join("/")}`);

  // 스포트라이트 검색 → 그래프
  await page.keyboard.press("Control+k");
  await page.keyboard.type("진통제");
  await page.keyboard.press("Enter");
  await page.waitForURL(/view=graph&node=/);
  await page.waitForTimeout(1200);
  assert.equal(await page.locator(".panel h2").innerText(), "진통제");
  const n1 = await visibleCount(page);
  assert.ok(n1 >= 5 && n1 <= 12, `1촌 뷰 노드 수 ${n1}`);
  log(`1촌 뷰 ${n1}개`);

  // + 배지가 있는 노드를 더블클릭 → 늘어남, 다시 더블클릭 → 줄어듦
  let pos = await positions(page);
  const plus = pos.find((p) => p.badge === "+");
  assert.ok(plus, "+ 배지 노드가 있어야 함");
  await page.mouse.dblclick(plus.x, plus.y);
  await page.waitForTimeout(900);
  const n2 = await visibleCount(page);
  assert.ok(n2 > n1, `펼친 후 ${n2} > ${n1}`);
  pos = await positions(page);
  const again = pos.find((p) => p.id === plus.id);
  assert.equal(again.badge, "-", "펼친 노드는 - 배지");
  await page.mouse.dblclick(again.x, again.y);
  await page.waitForTimeout(800);
  const n3 = await visibleCount(page);
  assert.equal(n3, n1, "접으면 원래 수로");
  log(`펼침 ${n2} → 접힘 ${n3}`);

  // 패널에서 이웃 선택 → 중심으로 → 브레드크럼 → 뒤로 가기
  pos = await positions(page);
  const center = pos.find((p) => p.text === "진통제");
  await page.mouse.click(center.x, center.y);
  await page.locator(".panel h2").waitFor();
  await page.locator(".edge-item .target").first().click();
  await page.waitForTimeout(400);
  const neighbor = (await page.locator(".panel h2").innerText()).replace("★ ", "");
  await page.getByRole("button", { name: /중심으로/ }).click();
  await page.waitForTimeout(900);
  const crumbs = await page.locator(".crumbs button").allInnerTexts();
  assert.deepEqual(crumbs, ["진통제", neighbor], `브레드크럼 ${crumbs}`);
  await page.goBack();
  await page.waitForTimeout(900);
  assert.deepEqual(await page.locator(".crumbs button").allInnerTexts(), ["진통제"], "뒤로 가기 후 경로");
  log(`중심 전환 ${crumbs.join(" › ")} → 뒤로 가기 OK`);

  // 전체 보기 경고
  await page.getByRole("button", { name: "전체 보기" }).first().click();
  await page.waitForTimeout(800);
  await page.keyboard.press("Escape");
  const note = await page.locator(".explorer-note").innerText();
  assert.match(note, /노드 \d+개/);

  // 전문가 팩 신청 → 재접속 유지
  await page.getByRole("button", { name: "전문가 팩" }).click();
  await page.locator(".pcard").first().waitFor();
  await page.locator(".pcard").first().getByRole("button").click();
  await page.locator(".toast").waitFor();
  await page.reload({ waitUntil: "load" });
  await page.locator(".pcard").first().waitFor();
  assert.match(await page.locator(".pcard").first().getByRole("button").innerText(), /신청됨/);
  log("팩 신청 유지 OK");

  // 되돌리기
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "대시보드" }).click();
  await page.getByRole("button", { name: "메뉴" }).click();
  await page.getByRole("button", { name: /최근 가져오기 되돌리기/ }).click();
  await page.locator(".toast").waitFor({ timeout: 60000 });
  await page.waitForTimeout(800);
  assert.equal(await page.getByText("표현 사이의 관계를 그려 보세요").count(), 1, "되돌린 뒤 빈 화면");
  log("되돌리기 OK");
};
