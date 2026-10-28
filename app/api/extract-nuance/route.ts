import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { verifyIdToken } from "@/lib/server/auth";
import { RELATIONS, langLabel } from "@/lib/types";
import { ExtractRequestSchema, ExtractResponseSchema, outputJsonSchema } from "./schema";

export const runtime = "nodejs";
export const maxDuration = 60;

const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-5-5";

/** 모델별 대략적인 청크(25행)당 비용(USD). 입력 ~3K, 출력 ~7K 토큰 가정 */
function estimatePerChunkUsd(model: string): number {
  const inTok = 3000, outTok = 7000;
  const price = /haiku/.test(model) ? [0.1, 0.5] : /sonnet/.test(model) ? [2, 10] : /fable/.test(model) ? [10, 50] : [4, 20];
  return (inTok * price[0] + outTok * price[1]) / 1_000_000;
}

const SYSTEM = `You convert rows of a translator's personal glossary spreadsheet into a nuance graph.

Graph model:
- A node is one expression in one language.
- An edge connects two expressions with a relation, a weight and an optional situation tag:
  equivalent (대응 번역), similar (비슷하지만 뉘앙스 다름, same language), broader (target is the broader concept),
  narrower (target is the narrower concept), contrast (혼동 주의 / 반대 / 쓰면 안 되는 경우), collocation (함께 쓰임).
- weight 0..100 = how natural/appropriate the mapping is in the stated situation. Differentiate honestly:
  everyday patient-facing word 85-95, clinical/chart term 70-90 in its own situation but 40-60 for the other audience.
- situation is a short Korean tag (환자 설명, 의료진 간, 차트·문서, 법정, 경찰 조사, 계약서·서면, 일상 대화 …) or null.

Rules:
1. Each input row may hold several expressions in one cell, e.g. "painkiller(환자용), analgesic(의사용)" or
   "A / B (격식)". Split them into separate items, each with its own weight and situation.
2. Free-text notes like "뉘앙스 다름", "법정에서 주의", "직역 금지" decide the relation (similar / contrast) and
   lower the weight. Keep the user's own wording in "note" when it carries nuance; write notes in Korean.
3. Produce one item per (source expression, target expression, situation). Items whose source and target share a
   language must use similar / contrast / broader / narrower / collocation, never equivalent.
4. Use only the given language codes. If a row's language is unclear, infer from script (Hangul→ko, kana/kanji→ja,
   Cyrillic→ru, Latin→en unless told otherwise) and mark confidence low.
5. confidence: high = explicit in the row; medium = reasonable inference; low = guessed or ambiguous.
6. Keep "row" as the 1-based index of the input row. Skip rows with no usable pair. Do not invent expressions
   that are not in the row, except that a short example sentence pair may be added when the row contains one.`;

export async function GET() {
  const enabled = Boolean(process.env.ANTHROPIC_API_KEY);
  return NextResponse.json({ enabled, model: MODEL, perChunkUsd: estimatePerChunkUsd(MODEL) });
}

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "AI 추출이 설정되지 않았습니다 (ANTHROPIC_API_KEY 없음)." }, { status: 503 });
  }
  const uid = await verifyIdToken(req.headers.get("authorization"));
  if (!uid) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청" }, { status: 400 });
  }
  const parsed = ExtractRequestSchema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: "요청 형식이 올바르지 않습니다." }, { status: 400 });
  const { header, rows, langs, domain, hint } = parsed.data;

  const table = [
    header.length ? `header: ${header.map((h) => JSON.stringify(h)).join(" | ")}` : "header: (none)",
    ...rows.map((r, i) => `${i + 1}: ${r.map((c) => JSON.stringify(c)).join(" | ")}`),
  ].join("\n");

  const user = `Languages present (codes): ${langs.map((l) => `${l} (${langLabel(l)})`).join(", ")}
Default domain: ${domain ?? "unspecified"}
Relation vocabulary: ${Object.entries(RELATIONS).map(([k, v]) => `${k}=${v.label}`).join(", ")}
${hint ? `User's description of this sheet: ${hint}\n` : ""}
Rows (1-based index: cells separated by |):
${table}

Return items for these rows.`;

  const client = new Anthropic();
  try {
    const useFallback = !/haiku/.test(MODEL);
    const response = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 12000,
      system: SYSTEM,
      messages: [{ role: "user", content: user }],
      output_config: { format: { type: "json_schema", schema: outputJsonSchema(langs) } },
      ...(useFallback ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" } : {}),
    });
    if (response.stop_reason === "refusal") {
      return NextResponse.json({ error: "모델이 이 청크를 처리하지 않았습니다." }, { status: 422 });
    }
    if (response.stop_reason === "max_tokens") {
      return NextResponse.json({ error: "응답이 너무 길어 잘렸습니다. 청크를 줄여 다시 시도하세요." }, { status: 502 });
    }
    const text = response.content.filter((b) => b.type === "text").map((b) => b.text).join("");
    const out = ExtractResponseSchema.safeParse(JSON.parse(text));
    if (!out.success) return NextResponse.json({ error: "모델 응답을 해석하지 못했습니다." }, { status: 502 });
    const allowed = new Set(langs);
    const items = out.data.items.filter(
      (it) => allowed.has(it.source_lang) && allowed.has(it.target_lang) && it.row >= 1 && it.row <= rows.length
        && !(it.source_lang === it.target_lang && it.relation === "equivalent")
        && it.source_text.trim().toLowerCase() !== it.target_text.trim().toLowerCase(),
    );
    return NextResponse.json({ items, model: response.model });
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) return NextResponse.json({ error: "ANTHROPIC_API_KEY가 올바르지 않습니다." }, { status: 500 });
    if (err instanceof Anthropic.RateLimitError) return NextResponse.json({ error: "요청이 너무 많습니다. 잠시 후 다시 시도하세요." }, { status: 429 });
    if (err instanceof Anthropic.APIError) return NextResponse.json({ error: `AI 요청 실패 (${err.status}): ${err.message}` }, { status: 502 });
    return NextResponse.json({ error: err instanceof Error ? err.message : "알 수 없는 오류" }, { status: 500 });
  }
}
