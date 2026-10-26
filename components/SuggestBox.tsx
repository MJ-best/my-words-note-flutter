"use client";

import { useState } from "react";
import type { GraphNode, Relation } from "@/lib/types";
import { getFirebaseAuth } from "@/lib/firebase";
import { edgesOf, otherEnd, relationFrom } from "@/lib/graph-utils";
import { RELATIONS, langColor, langLabel } from "@/lib/types";
import { findNode, pct } from "@/lib/graph-utils";
import type { SuggestRequest } from "@/app/api/suggest/schema";
import type { GraphApi } from "@/lib/useGraph";

export interface Suggestion {
  text: string;
  lang: string;
  kind: "word" | "phrase" | "sentence";
  relation: Relation;
  weight: number;
  note: string;
  register: string | null;
  example: { text: string; translation: string; situation: string } | null;
}

export default function SuggestBox({ node, nodes, api, onSelect }: { node: GraphNode; nodes: GraphNode[]; api: GraphApi; onSelect: (id: string) => void }) {
  const { edges, examples } = api;
  const [items, setItems] = useState<Suggestion[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extraLang, setExtraLang] = useState("");

  async function ask() {
    setBusy(true);
    setError(null);
    try {
      const token = await getFirebaseAuth().currentUser?.getIdToken();
      if (!token) throw new Error("로그인이 필요합니다.");
      const byId = new Map(nodes.map((n) => [n.id, n]));
      const payload: SuggestRequest = {
        node: { text: node.text, lang: node.lang, kind: node.kind, domain: node.domain, register: node.register, note: node.note },
        connections: edgesOf(edges, node.id)
          .map((e) => {
            const o = byId.get(otherEnd(e, node.id));
            return o ? { text: o.text, lang: o.lang, register: o.register, relation: relationFrom(e, node.id), weight: e.weight, note: e.note } : null;
          })
          .filter((c): c is NonNullable<typeof c> => c !== null),
        examples: examples.filter((x) => x.node_id === node.id).slice(0, 5).map((x) => ({ text: x.text, translation: x.translation, situation: x.situation })),
        graphLangs: Array.from(new Set(nodes.map((n) => n.lang))),
        extraLangs: extraLang.split(",").map((s) => s.trim()).filter(Boolean),
      };
      const res = await fetch("/api/suggest", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `요청 실패 (${res.status})`);
      setItems(json.suggestions as Suggestion[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function accept(s: Suggestion) {
    let target = findNode(nodes, s.text, s.lang);
    if (!target) {
      const created = await api.addNode({ text: s.text, lang: s.lang, kind: s.kind, domain: node.domain ?? undefined, register: s.register ?? undefined });
      if (!created) return;
      target = created;
      if (s.example?.text) {
        await api.addExample({ node_id: created.id, text: s.example.text, translation: s.example.translation, situation: s.example.situation });
      }
    }
    await api.addEdge({ source_id: node.id, target_id: target.id, relation: s.relation, weight: s.weight, note: s.note });
    setItems((prev) => prev?.filter((x) => x !== s) ?? null);
    onSelect(target.id);
    onSelect(node.id);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div className="hint">
        그래프에 있는 언어들로 대응 표현과 뉘앙스 차이를 제안받습니다. 제안은 초안일 뿐이고, 추가한 뒤 가중치와 메모를 내 감각에 맞게 고치세요.
      </div>
      <div className="row">
        <input className="input" value={extraLang} onChange={(e) => setExtraLang(e.target.value)} placeholder="추가 언어 코드 (선택, 예: en, zh)" />
        <button className="btn primary" style={{ flex: "0 0 auto" }} onClick={ask} disabled={busy}>
          {busy ? "생각 중…" : "제안받기"}
        </button>
      </div>
      {error && <div className="error">{error}</div>}
      {items && items.length === 0 && <div className="hint">새로 제안할 내용이 없습니다.</div>}
      {items?.map((s, i) => {
        const meta = RELATIONS[s.relation] ?? RELATIONS.equivalent;
        const exists = findNode(nodes, s.text, s.lang);
        return (
          <div key={i} className="suggest-item">
            <div className="head">
              <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                <span className="chip lang" style={{ background: langColor(s.lang) }}>{langLabel(s.lang)}</span>
                <b>{s.text}</b>
                <span className="rel chip" style={{ background: meta.color, color: "#fff" }}>{meta.short} {pct(s.weight)}</span>
                {exists && <span className="hint">이미 있음 · 연결만 추가</span>}
              </div>
              <button className="btn sm primary" onClick={() => accept(s)}>추가</button>
            </div>
            {s.note && <div className="small muted" style={{ whiteSpace: "pre-wrap" }}>{s.note}</div>}
            {s.example?.text && (
              <div className="example-item" style={{ borderLeftColor: langColor(s.lang) }}>
                <div className="t">{s.example.text}</div>
                {s.example.translation && <div className="tr">{s.example.translation}</div>}
                {s.example.situation && <div className="meta"><span>{s.example.situation}</span></div>}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
