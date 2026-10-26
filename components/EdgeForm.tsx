"use client";

import { useMemo, useState } from "react";
import Modal from "./Modal";
import LangSelect from "./LangSelect";
import type { GraphNode, Relation } from "@/lib/types";
import { RELATIONS, RELATION_ORDER, SITUATIONS, langColor, langLabel } from "@/lib/types";
import { pct } from "@/lib/graph-utils";

interface Props {
  source: GraphNode;
  nodes: GraphNode[];
  knownLangs: string[];
  knownSituations: string[];
  onSubmit: (input: {
    target: { id: string } | { text: string; lang: string };
    relation: Relation;
    weight: number;
    note: string;
    situation: string;
  }) => Promise<void>;
  onClose: () => void;
}

export default function EdgeForm({ source, nodes, knownLangs, knownSituations, onSubmit, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [targetId, setTargetId] = useState<string | null>(null);
  const [newLang, setNewLang] = useState(knownLangs.find((l) => l !== source.lang) ?? knownLangs[0] ?? "en");
  const [relation, setRelation] = useState<Relation>("equivalent");
  const [weight, setWeight] = useState(0.7);
  const [note, setNote] = useState("");
  const [situation, setSituation] = useState("");
  const [busy, setBusy] = useState(false);
  const situationOptions = Array.from(new Set([...knownSituations, ...SITUATIONS]));

  const target = targetId ? nodes.find((n) => n.id === targetId) ?? null : null;
  const q = query.trim().toLowerCase();
  const matches = useMemo(() => {
    if (!q) return [];
    return nodes
      .filter((n) => n.id !== source.id && n.text.toLowerCase().includes(q))
      .slice(0, 8);
  }, [nodes, q, source.id]);
  const exact = nodes.find((n) => n.id !== source.id && n.text.trim().toLowerCase() === q && n.lang === newLang);
  const creating = !target && q.length > 0;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!target && !q) return;
    setBusy(true);
    await onSubmit({
      target: target ? { id: target.id } : exact ? { id: exact.id } : { text: query.trim(), lang: newLang },
      relation,
      weight,
      note,
      situation,
    });
    setBusy(false);
  }

  const rel = RELATIONS[relation];

  return (
    <Modal title="연결 추가" onClose={onClose}>
      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div className="hint">
          <span className="chip lang" style={{ background: langColor(source.lang) }}>{langLabel(source.lang)}</span>{" "}
          <b>{source.text}</b> 와(과) 연결할 표현
        </div>

        <div className="field">
          <label>상대 표현</label>
          {target ? (
            <div className="row" style={{ alignItems: "center" }}>
              <div className="card" style={{ padding: "8px 12px", display: "flex", gap: 8, alignItems: "center" }}>
                <span className="chip lang" style={{ background: langColor(target.lang) }}>{langLabel(target.lang)}</span>
                <b>{target.text}</b>
              </div>
              <button type="button" className="btn" style={{ flex: "0 0 auto" }} onClick={() => setTargetId(null)}>변경</button>
            </div>
          ) : (
            <div style={{ position: "relative" }}>
              <input
                className="input"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="기존 표현을 찾거나, 새 표현을 입력"
                autoFocus
              />
              {matches.length > 0 && (
                <div className="search-results" style={{ position: "static", marginTop: 6, boxShadow: "none" }}>
                  {matches.map((n) => (
                    <button type="button" key={n.id} onClick={() => { setTargetId(n.id); setQuery(""); }}>
                      <span className="chip lang" style={{ background: langColor(n.lang) }}>{langLabel(n.lang)}</span>
                      <span>{n.text}</span>
                      {n.domain && <span className="hint">· {n.domain}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {creating && !exact && (
            <div className="row" style={{ alignItems: "center", marginTop: 4 }}>
              <span className="hint" style={{ flex: "0 0 auto" }}>새 표현으로 추가 · 언어:</span>
              <LangSelect value={newLang} onChange={setNewLang} known={knownLangs} />
            </div>
          )}
        </div>

        <div className="field">
          <label>관계</label>
          <select className="select" value={relation} onChange={(e) => setRelation(e.target.value as Relation)}>
            {RELATION_ORDER.map((r) => (
              <option key={r} value={r}>{RELATIONS[r].label}</option>
            ))}
          </select>
          <div className="hint">{rel.hint}</div>
        </div>

        <div className="field">
          <label>
            {relation === "equivalent" ? "내가 느끼는 적합도" : relation === "contrast" ? "혼동 위험" : "연결 강도"} · {pct(weight)}
          </label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={weight}
            onChange={(e) => setWeight(Number(e.target.value))}
            style={{ accentColor: rel.color }}
          />
          <div className="hint">
            {relation === "equivalent"
              ? "이 상황에서 상대 표현으로 옮기는 게 얼마나 자연스러운지. 나중에 패널에서 언제든 조정할 수 있습니다."
              : "그래프에서 선의 굵기와 거리로 표시됩니다."}
          </div>
        </div>

        <div className="field">
          <label>상황 (선택)</label>
          <input
            className="input"
            list="situation-list"
            value={situation}
            onChange={(e) => setSituation(e.target.value)}
            placeholder="환자 설명, 의료진 간, 법정, 계약서…"
          />
          <datalist id="situation-list">
            {situationOptions.map((s) => <option key={s} value={s} />)}
          </datalist>
          <div className="hint">
            같은 두 표현이라도 상황마다 적합도가 다르면, 상황별로 연결을 따로 만드세요. 패널에서 상황을 골라 1순위를 볼 수 있습니다.
          </div>
        </div>

        <div className="field">
          <label>뉘앙스 메모</label>
          <textarea
            className="textarea"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="언제 이 대응을 쓰는지, 무엇이 다른지 (예: 환자에게는 이 표현, 차트에는 저 표현)"
          />
        </div>

        <div className="footer">
          <button type="button" className="btn" onClick={onClose}>취소</button>
          <button type="submit" className="btn primary" disabled={busy || (!target && !q)}>
            {creating && !exact ? "새 표현 만들고 연결" : "연결"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
