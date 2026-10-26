import type { Kind, Relation } from "../types";
import type { ImportData } from "../useGraph";

/** 한 언어 안의 표현 하나. 첫 번째 항목이 그 언어의 기본(가장 흔한) 표현. */
export interface PackTerm {
  t: string;
  register?: string;
  /** 허브 언어(보통 한국어) 기본 표현과의 대응 적합도. 없으면 기본 0.9, 두 번째 이후 0.65 */
  w?: number;
  /** 이 대응이 특히 적합한 상황 */
  situation?: string;
  /** 노드 메모 (이 표현 자체의 뉘앙스) */
  note?: string;
  /** 허브 언어와의 대응 엣지에 붙는 메모 */
  why?: string;
  kind?: Kind;
  preferred?: boolean;
}

export interface PackConcept {
  /** 언어 코드 → 표현 목록 */
  terms: Record<string, PackTerm[]>;
  examples?: Array<{ lang: string; text: string; translation?: string; situation?: string }>;
}

export interface PackLink {
  a: [string, string]; // [lang, text]
  b: [string, string];
  relation: Relation;
  weight?: number;
  note?: string;
  situation?: string;
}

export interface StarterPack {
  id: string;
  title: string;
  description: string;
  domain: string;
  langs: string[];
  concepts: PackConcept[];
  links?: PackLink[];
}

function inferKind(text: string): Kind {
  if (/[.!?。！？]$/.test(text.trim()) || text.trim().split(/\s+/).length >= 6) return "sentence";
  if (/\s/.test(text.trim()) || text.length > 12) return "phrase";
  return "word";
}

/** 스타터 팩을 선택한 언어만 담아 가져오기 데이터로 바꾼다. */
export function compilePack(pack: StarterPack, langs: string[]): ImportData {
  const chosen = pack.langs.filter((l) => langs.includes(l));
  const hub = chosen.includes("ko") ? "ko" : chosen[0];
  const nodes = new Map<string, ImportData["nodes"][number]>();
  const edges: ImportData["edges"] = [];
  const examples: NonNullable<ImportData["examples"]> = [];
  const nodeId = (lang: string, text: string) => `${pack.id}:${lang}:${text}`;

  const ensure = (lang: string, term: PackTerm) => {
    const id = nodeId(lang, term.t);
    if (!nodes.has(id)) {
      nodes.set(id, {
        id,
        text: term.t,
        lang,
        kind: term.kind ?? inferKind(term.t),
        domain: pack.domain,
        register: term.register ?? null,
        note: term.note ?? null,
        preferred: term.preferred ?? false,
      });
    } else if (term.note && !nodes.get(id)!.note) nodes.get(id)!.note = term.note;
    return id;
  };

  for (const c of pack.concepts) {
    const hubTerms = c.terms[hub] ?? [];
    for (const lang of chosen) {
      const terms = c.terms[lang] ?? [];
      terms.forEach((term, i) => {
        const id = ensure(lang, term);
        // 같은 언어 안의 표현들끼리는 "유사" (격식·뉘앙스 차이)
        if (i > 0) {
          const prev = ensure(lang, terms[0]);
          edges.push({
            source_id: prev,
            target_id: id,
            relation: "similar",
            weight: 0.6,
            note: term.why ?? term.note ?? null,
          });
        }
        // 허브 언어 기본 표현 ↔ 다른 언어 표현
        if (lang !== hub && hubTerms.length) {
          const hubId = ensure(hub, hubTerms[0]);
          edges.push({
            source_id: hubId,
            target_id: id,
            relation: "equivalent",
            weight: term.w ?? (i === 0 ? 0.9 : 0.65),
            situation: term.situation ?? null,
            note: term.why ?? null,
          });
        }
      });
    }
    for (const ex of c.examples ?? []) {
      if (!chosen.includes(ex.lang)) continue;
      const t = (c.terms[ex.lang] ?? [])[0];
      if (!t) continue;
      examples.push({ node_id: ensure(ex.lang, t), text: ex.text, translation: ex.translation ?? null, situation: ex.situation ?? null });
    }
  }

  for (const l of pack.links ?? []) {
    if (!chosen.includes(l.a[0]) || !chosen.includes(l.b[0])) continue;
    const a = nodeId(l.a[0], l.a[1]), b = nodeId(l.b[0], l.b[1]);
    if (!nodes.has(a) || !nodes.has(b)) continue;
    edges.push({ source_id: a, target_id: b, relation: l.relation, weight: l.weight ?? 0.8, note: l.note ?? null, situation: l.situation ?? null });
  }

  return { nodes: Array.from(nodes.values()), edges, examples };
}
