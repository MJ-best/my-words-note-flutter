import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { GraphEdge, GraphNode, Example } from "@/lib/types";
import { RELATIONS, langLabel } from "@/lib/types";
import { relationFrom, otherEnd } from "@/lib/graph-utils";

export const runtime = "nodejs";
export const maxDuration = 60;

const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-5-5";

const SuggestionSchema = z.object({
  text: z.string().min(1),
  lang: z.string().min(2).max(8),
  kind: z.enum(["word", "phrase", "sentence"]),
  relation: z.enum(["equivalent", "similar", "broader", "narrower", "contrast", "collocation"]),
  weight: z.number().min(0).max(1),
  note: z.string(),
  register: z.enum(["formal", "casual", "clinical", "legal", "written", "spoken"]).nullable(),
  example: z
    .object({ text: z.string(), translation: z.string(), situation: z.string() })
    .nullable(),
});
const OutputSchema = z.object({ suggestions: z.array(SuggestionSchema).max(8) });

// output_config.format 에 넘길 JSON Schema (zod 스키마와 동일한 모양)
const OUTPUT_JSON_SCHEMA = {
  type: "object",
  properties: {
    suggestions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          text: { type: "string" },
          lang: { type: "string", description: "ISO 639-1 language code, e.g. ko, ja, en, zh" },
          kind: { type: "string", enum: ["word", "phrase", "sentence"] },
          relation: { type: "string", enum: ["equivalent", "similar", "broader", "narrower", "contrast", "collocation"] },
          weight: { type: "number", description: "0..1 how natural this mapping is in the given domain/register" },
          note: { type: "string", description: "Korean explanation of nuance: when to use, who says it, what differs" },
          register: { type: ["string", "null"], enum: ["formal", "casual", "clinical", "legal", "written", "spoken", null] },
          example: {
            type: ["object", "null"],
            properties: {
              text: { type: "string" },
              translation: { type: "string" },
              situation: { type: "string" },
            },
            required: ["text", "translation", "situation"],
            additionalProperties: false,
          },
        },
        required: ["text", "lang", "kind", "relation", "weight", "note", "register", "example"],
        additionalProperties: false,
      },
    },
  },
  required: ["suggestions"],
  additionalProperties: false,
} as const;

const SYSTEM = `You help a professional multilingual interpreter/translator build a personal graph of expressions.
Nodes are expressions in one language. Edges connect expressions with a relation and a weight (0..1) that means
"how natural/appropriate this mapping is in the stated domain and register", plus a nuance note.

The user cares about real usage, not dictionary equivalence. Example of the spirit: Korean "사랑해" maps to Japanese
"好き" (weight ~0.9, everyday confession) more than to "愛してる" (weight ~0.45, heavy/dramatic). In medical or legal
interpreting, the same source term often needs different targets depending on listener (patient vs. clinician,
courtroom vs. consultation), civil vs. criminal, formal vs. casual.

Given one expression with its context and existing connections, propose up to 6 NEW connections:
- equivalents in each requested target language (prefer the one a native professional would actually say; include a
  second option when register changes the choice),
- "similar" expressions in the same language when the nuance difference is worth recording,
- "contrast" when there is a classic confusion risk,
- occasionally "broader"/"narrower"/"collocation" when genuinely useful.
Do not repeat connections that already exist. Keep weights honest and differentiated. Write "note" in Korean,
concrete and short (1-2 sentences), explaining when/why. Include a short realistic example sentence with translation
and situation when it helps. Use ISO 639-1 codes for "lang".`;

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "AI 제안이 설정되지 않았습니다 (ANTHROPIC_API_KEY 없음)." }, { status: 503 });
  }

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  let body: { nodeId?: string; extraLangs?: string[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청" }, { status: 400 });
  }
  if (!body.nodeId) return NextResponse.json({ error: "nodeId가 필요합니다." }, { status: 400 });

  // RLS 덕분에 본인 데이터만 조회된다
  const { data: node } = await supabase.from("nodes").select("*").eq("id", body.nodeId).maybeSingle();
  if (!node) return NextResponse.json({ error: "표현을 찾을 수 없습니다." }, { status: 404 });
  const n = node as GraphNode;

  const [{ data: edgesRaw }, { data: allLangsRaw }, { data: examplesRaw }] = await Promise.all([
    supabase.from("edges").select("*").or(`source_id.eq.${n.id},target_id.eq.${n.id}`),
    supabase.from("nodes").select("lang"),
    supabase.from("examples").select("*").eq("node_id", n.id).limit(5),
  ]);
  const edges = (edgesRaw ?? []) as GraphEdge[];
  const neighborIds = edges.map((e) => otherEnd(e, n.id));
  const { data: neighborsRaw } = neighborIds.length
    ? await supabase.from("nodes").select("*").in("id", neighborIds)
    : { data: [] as GraphNode[] };
  const neighbors = new Map(((neighborsRaw ?? []) as GraphNode[]).map((x) => [x.id, x]));

  const graphLangs = new Set(((allLangsRaw ?? []) as { lang: string }[]).map((x) => x.lang));
  for (const l of body.extraLangs ?? []) if (/^[a-z]{2,8}$/i.test(l)) graphLangs.add(l.toLowerCase());
  graphLangs.delete(n.lang);
  const targetLangs = Array.from(graphLangs);
  if (targetLangs.length === 0) targetLangs.push(n.lang === "en" ? "ko" : "en");

  const existing = edges
    .map((e) => {
      const o = neighbors.get(otherEnd(e, n.id));
      if (!o) return null;
      const rel = relationFrom(e, n.id);
      return `- [${RELATIONS[rel].label}] ${o.text} (${langLabel(o.lang)}, ${o.register ?? "register unspecified"}) weight ${e.weight}${e.note ? ` — ${e.note}` : ""}`;
    })
    .filter(Boolean)
    .join("\n");
  const examples = ((examplesRaw ?? []) as Example[])
    .map((x) => `- "${x.text}"${x.translation ? ` → "${x.translation}"` : ""}${x.situation ? ` (${x.situation})` : ""}`)
    .join("\n");

  const user = `Expression: ${n.text}
Language: ${langLabel(n.lang)} (${n.lang})
Kind: ${n.kind}
Domain: ${n.domain ?? "unspecified"}
Register: ${n.register ?? "unspecified"}
User's own nuance note: ${n.note ?? "(none)"}

Existing connections (do not repeat these):
${existing || "(none)"}

Existing usage examples:
${examples || "(none)"}

Target languages for equivalents: ${targetLangs.map((l) => `${langLabel(l)} (${l})`).join(", ")}
Return up to 6 suggestions.`;

  const client = new Anthropic();
  try {
    const useFallback = !/haiku/.test(MODEL);
    const response = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 8000,
      system: SYSTEM,
      messages: [{ role: "user", content: user }],
      output_config: { format: { type: "json_schema", schema: OUTPUT_JSON_SCHEMA } },
      ...(useFallback ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" } : {}),
    });

    if (response.stop_reason === "refusal") {
      return NextResponse.json({ error: "모델이 이 요청에 답하지 않았습니다. 다른 표현으로 시도해 보세요." }, { status: 422 });
    }
    const text = response.content.filter((b) => b.type === "text").map((b) => b.text).join("");
    const parsed = OutputSchema.safeParse(JSON.parse(text));
    if (!parsed.success) {
      return NextResponse.json({ error: "모델 응답을 해석하지 못했습니다. 다시 시도해 주세요." }, { status: 502 });
    }
    // 소스 자신과 똑같은 제안은 제외
    const suggestions = parsed.data.suggestions.filter(
      (s) => !(s.lang === n.lang && s.text.trim().toLowerCase() === n.text.trim().toLowerCase()),
    );
    return NextResponse.json({ suggestions, model: response.model });
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY가 올바르지 않습니다." }, { status: 500 });
    }
    if (err instanceof Anthropic.RateLimitError) {
      return NextResponse.json({ error: "요청이 너무 많습니다. 잠시 후 다시 시도하세요." }, { status: 429 });
    }
    if (err instanceof Anthropic.APIError) {
      return NextResponse.json({ error: `AI 요청 실패 (${err.status}): ${err.message}` }, { status: 502 });
    }
    return NextResponse.json({ error: err instanceof Error ? err.message : "알 수 없는 오류" }, { status: 500 });
  }
}
