import type { ImportData } from "./useGraph";
import type { Relation } from "./types";

/** RFC 4180 비슷하게: 따옴표, 따옴표 안의 줄바꿈·구분자, "" 이스케이프, CRLF, BOM 처리. 구분자는 자동 감지. */
export function parseCsv(text: string): string[][] {
  const src = text.replace(/^﻿/, "");
  const firstLine = src.split(/\r?\n/, 1)[0] ?? "";
  const delimiter = [",", "\t", ";"].reduce((best, d) =>
    (firstLine.split(d).length > firstLine.split(best).length ? d : best), ",");

  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += ch;
      continue;
    }
    if (ch === '"') inQuotes = true;
    else if (ch === delimiter) { row.push(field); field = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.some((c) => c.trim() !== "")) rows.push(row);
      row = [];
    } else field += ch;
  }
  row.push(field);
  if (row.some((c) => c.trim() !== "")) rows.push(row);
  return rows;
}

/** 열 이름 → 내부 키. 한국어·영어 표제 모두 허용. */
const HEADER_ALIASES: Record<string, string> = {
  source: "source", 원문: "source", 출발어: "source", 용어: "source", term: "source", src: "source",
  target: "target", 번역: "target", 도착어: "target", 역어: "target", translation: "target", tgt: "target",
  source_lang: "source_lang", sourcelang: "source_lang", 원문언어: "source_lang", 출발언어: "source_lang",
  target_lang: "target_lang", targetlang: "target_lang", 번역언어: "target_lang", 도착언어: "target_lang",
  domain: "domain", 분야: "domain", category: "domain", 카테고리: "domain",
  note: "note", 메모: "note", 뉘앙스: "note", nuance: "note", comment: "note", 비고: "note",
  situation: "situation", 상황: "situation", context: "situation", 문맥: "situation",
  weight: "weight", 가중치: "weight", 적합도: "weight", score: "weight",
  register: "register", 격식: "register", 문체: "register",
  example: "example", 예문: "example", sentence: "example",
  example_translation: "example_translation", 예문번역: "example_translation", 예문_번역: "example_translation",
  relation: "relation", 관계: "relation",
};

export interface CsvOptions {
  sourceLang: string;
  targetLang: string;
  domain: string;
  defaultWeight: number; // 0..1
}

export interface CsvConversion {
  data: ImportData;
  rows: number;
  skipped: number;
  columns: string[]; // 인식된 내부 키
}

const RELATIONS: Relation[] = ["equivalent", "similar", "broader", "narrower", "contrast", "collocation"];

/** 표제 행이 있는 CSV를 가져오기 데이터로 바꾼다. 표제가 없으면 1열=원문, 2열=번역으로 본다. */
export function csvToImport(rows: string[][], opts: CsvOptions): CsvConversion {
  if (rows.length === 0) return { data: { nodes: [], edges: [], examples: [] }, rows: 0, skipped: 0, columns: [] };

  const header = rows[0].map((h) => HEADER_ALIASES[h.trim().toLowerCase().replace(/\s+/g, "_")] ?? HEADER_ALIASES[h.trim()] ?? null);
  const hasHeader = header.some((h) => h === "source" || h === "target");
  const keys = hasHeader ? header : ["source", "target", "domain", "note"];
  const body = hasHeader ? rows.slice(1) : rows;
  const idx = (k: string) => keys.indexOf(k);

  const nodes = new Map<string, ImportData["nodes"][number]>();
  const edges: ImportData["edges"] = [];
  const examples: NonNullable<ImportData["examples"]> = [];
  let skipped = 0;

  const nodeFor = (text: string, lang: string, domain: string | null, register: string | null, note: string | null) => {
    const id = `${lang}:${text.trim().toLowerCase()}`;
    const existing = nodes.get(id);
    if (!existing) nodes.set(id, { id, text: text.trim(), lang, domain, register, note });
    else {
      if (!existing.domain && domain) existing.domain = domain;
      if (!existing.note && note) existing.note = note;
    }
    return id;
  };
  const cell = (r: string[], k: string) => {
    const i = idx(k);
    return i >= 0 ? (r[i] ?? "").trim() : "";
  };

  for (const r of body) {
    const source = cell(r, "source");
    const target = cell(r, "target");
    if (!source || !target) { skipped++; continue; }
    const sLang = (cell(r, "source_lang") || opts.sourceLang).toLowerCase();
    const tLang = (cell(r, "target_lang") || opts.targetLang).toLowerCase();
    const domain = cell(r, "domain") || opts.domain || null;
    const note = cell(r, "note") || null;
    const situation = cell(r, "situation") || null;
    const register = cell(r, "register") || null;
    const relRaw = cell(r, "relation").toLowerCase();
    const relation = (RELATIONS as string[]).includes(relRaw) ? (relRaw as Relation) : "equivalent";
    let weight = opts.defaultWeight;
    const w = cell(r, "weight");
    if (w) {
      const n = Number(w.replace("%", ""));
      if (!Number.isNaN(n)) weight = n > 1 ? Math.min(1, n / 100) : Math.max(0, n);
    }

    const sid = nodeFor(source, sLang, domain, null, null);
    const tid = nodeFor(target, tLang, domain, register, null);
    if (sid !== tid) edges.push({ source_id: sid, target_id: tid, relation, weight, note, situation });

    const ex = cell(r, "example");
    if (ex) examples.push({ node_id: sid, text: ex, translation: cell(r, "example_translation") || null, situation });
  }

  return {
    data: { nodes: Array.from(nodes.values()), edges, examples },
    rows: body.length,
    skipped,
    columns: keys.filter((k): k is string => Boolean(k)),
  };
}

export const CSV_TEMPLATE = `source,target,source_lang,target_lang,domain,situation,weight,note,example,example_translation
진통제,painkiller,ko,en,의료,환자 설명,90,환자에게 설명할 때 가장 잘 통하는 말,진통제 처방해 드릴게요.,I'll prescribe you a painkiller.
진통제,analgesic,ko,en,의료,의료진 간,80,차트·처방·의료진 사이 대화,,
피고인,defendant,ko,en,법률,법정,90,형사 사건의 피고인,,
`;
