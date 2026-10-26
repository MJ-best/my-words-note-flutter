"use client";

import { useMemo, useState } from "react";
import type { Example, GraphEdge, GraphNode, Relation } from "@/lib/types";
import { KINDS, RELATIONS, SITUATIONS, langColor, langLabel, registerLabel } from "@/lib/types";
import { edgesOf, otherEnd, pct, relationFrom } from "@/lib/graph-utils";
import type { GraphApi } from "@/lib/useGraph";
import SuggestBox from "./SuggestBox";

interface Props {
  node: GraphNode;
  nodes: GraphNode[];
  edges: GraphEdge[];
  examples: Example[];
  api: GraphApi;
  aiEnabled: boolean;
  onSelect: (id: string) => void;
  onEdit: () => void;
  onAddEdge: () => void;
  onClose: () => void;
}

export default function NodePanel({ node, nodes, edges, examples, api, aiEnabled, onSelect, onEdit, onAddEdge, onClose }: Props) {
  const byId = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);
  const myEdges = useMemo(
    () =>
      edgesOf(edges, node.id)
        .map((e) => ({ edge: e, other: byId.get(otherEnd(e, node.id)), rel: relationFrom(e, node.id) }))
        .filter((x): x is { edge: GraphEdge; other: GraphNode; rel: Relation } => Boolean(x.other))
        .sort((a, b) => {
          if (a.rel !== b.rel) return order(a.rel) - order(b.rel);
          return b.edge.weight - a.edge.weight;
        }),
    [edges, node.id, byId],
  );
  const myExamples = useMemo(() => examples.filter((x) => x.node_id === node.id), [examples, node.id]);

  // 이 표현의 연결에 등장하는 상황 태그
  const situations = useMemo(
    () => Array.from(new Set(myEdges.map((x) => x.edge.situation).filter((s): s is string => Boolean(s)))),
    [myEdges],
  );
  const [situationFilter, setSituationFilter] = useState<string | null>(null);
  const activeSituation = situationFilter && situations.includes(situationFilter) ? situationFilter : null;

  // 언어별로 가장 적합한 대응 표현 (내 가중치 기준, 상황을 고르면 그 상황의 연결만)
  const bestByLang = useMemo(() => {
    const m = new Map<string, { other: GraphNode; weight: number; situation: string | null }>();
    for (const { edge, other, rel } of myEdges) {
      if (rel !== "equivalent") continue;
      if (activeSituation && edge.situation !== activeSituation) continue;
      const cur = m.get(other.lang);
      if (!cur || edge.weight > cur.weight) m.set(other.lang, { other, weight: edge.weight, situation: edge.situation });
    }
    return Array.from(m.entries());
  }, [myEdges, activeSituation]);

  const [exText, setExText] = useState("");
  const [exTr, setExTr] = useState("");
  const [exSit, setExSit] = useState("");
  const [showExForm, setShowExForm] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function addExample(e: React.FormEvent) {
    e.preventDefault();
    if (!exText.trim()) return;
    await api.addExample({ node_id: node.id, text: exText, translation: exTr, situation: exSit });
    setExText(""); setExTr(""); setExSit("");
    setShowExForm(false);
  }

  return (
    <aside className="panel">
      <section>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            <span className="chip lang" style={{ background: langColor(node.lang) }}>{langLabel(node.lang)}</span>
            <span className="chip">{KINDS[node.kind]}</span>
            {node.domain && <span className="chip">{node.domain}</span>}
            {node.register && <span className="chip">{registerLabel(node.register)}</span>}
          </div>
          <button className="btn ghost sm panel-close" onClick={onClose} aria-label="닫기">✕</button>
        </div>
        <h2>{node.preferred && <span style={{ color: langColor(node.lang) }}>★ </span>}{node.text}</h2>
        {node.note && <p className="muted" style={{ margin: 0, whiteSpace: "pre-wrap" }}>{node.note}</p>}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <button className="btn sm" onClick={() => api.updateNode(node.id, { preferred: !node.preferred })}>
            {node.preferred ? "★ 선호 해제" : "☆ 선호 표현으로"}
          </button>
          <button className="btn sm" onClick={onEdit}>수정</button>
          {confirmDelete ? (
            <>
              <button className="btn sm danger" onClick={() => { api.deleteNode(node.id); onClose(); }}>정말 삭제</button>
              <button className="btn sm" onClick={() => setConfirmDelete(false)}>취소</button>
            </>
          ) : (
            <button className="btn sm ghost danger" onClick={() => setConfirmDelete(true)}>삭제</button>
          )}
        </div>
      </section>

      {(bestByLang.length > 0 || situations.length > 0) && (
        <section>
          <h3>언어별 내 1순위 대응</h3>
          {situations.length > 0 && (
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              <button className="chip" style={chipStyle(activeSituation === null)} onClick={() => setSituationFilter(null)}>모든 상황</button>
              {situations.map((s) => (
                <button key={s} className="chip" style={chipStyle(activeSituation === s)} onClick={() => setSituationFilter(s)}>{s}</button>
              ))}
            </div>
          )}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {bestByLang.map(([lang, { other, weight, situation }]) => (
              <button key={lang} className="btn sm" onClick={() => onSelect(other.id)} style={{ borderColor: langColor(lang) }} title={situation ?? undefined}>
                <span className="chip lang" style={{ background: langColor(lang) }}>{langLabel(lang)}</span>
                <b>{other.text}</b>
                <span className="hint">{pct(weight)}</span>
              </button>
            ))}
            {bestByLang.length === 0 && <span className="hint">이 상황의 대응 번역이 아직 없습니다.</span>}
          </div>
        </section>
      )}

      <section>
        <h3>
          연결 {myEdges.length > 0 && <span className="hint">{myEdges.length}</span>}
          <button className="btn sm primary" onClick={onAddEdge}>+ 연결</button>
        </h3>
        {myEdges.length === 0 && (
          <div className="hint">아직 연결이 없습니다. 다른 언어의 대응 표현이나 헷갈리는 표현을 연결해 보세요.</div>
        )}
        {myEdges.map(({ edge, other, rel }) => (
          <EdgeItem key={edge.id} edge={edge} other={other} rel={rel} api={api} onSelect={onSelect} knownSituations={situations} />
        ))}
      </section>

      <section>
        <h3>
          예문 {myExamples.length > 0 && <span className="hint">{myExamples.length}</span>}
          <button className="btn sm" onClick={() => setShowExForm((v) => !v)}>{showExForm ? "닫기" : "+ 예문"}</button>
        </h3>
        {showExForm && (
          <form onSubmit={addExample} className="card" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <textarea className="textarea" value={exText} onChange={(e) => setExText(e.target.value)} placeholder="실제로 들었거나 쓴 문장" autoFocus style={{ minHeight: 56 }} />
            <textarea className="textarea" value={exTr} onChange={(e) => setExTr(e.target.value)} placeholder="내가 옮긴 문장 (선택)" style={{ minHeight: 56 }} />
            <input className="input" value={exSit} onChange={(e) => setExSit(e.target.value)} placeholder="상황 (예: 진료실 · 복약 지도, 법정 · 증인 신문)" />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 6 }}>
              <button type="submit" className="btn sm primary" disabled={!exText.trim()}>저장</button>
            </div>
          </form>
        )}
        {myExamples.length === 0 && !showExForm && (
          <div className="hint">실제 사용 예시를 적어 두면 단어가 아니라 상황을 기억하게 됩니다.</div>
        )}
        {myExamples.map((x) => (
          <div key={x.id} className="example-item" style={{ borderLeftColor: langColor(node.lang) }}>
            <div className="t">{x.text}</div>
            {x.translation && <div className="tr">{x.translation}</div>}
            <div className="meta">
              <span>{x.situation ?? ""}</span>
              <button className="btn ghost sm danger" style={{ minHeight: 22, padding: "0 6px" }} onClick={() => api.deleteExample(x.id)}>삭제</button>
            </div>
          </div>
        ))}
      </section>

      {aiEnabled && (
        <section>
          <h3>AI 제안</h3>
          <SuggestBox node={node} nodes={nodes} api={api} onSelect={onSelect} />
        </section>
      )}
    </aside>
  );
}

function chipStyle(active: boolean): React.CSSProperties {
  return {
    cursor: "pointer",
    border: "1px solid var(--border)",
    background: active ? "var(--accent)" : "var(--surface)",
    color: active ? "#fff" : "var(--text-2)",
  };
}

function order(r: Relation): number {
  return ["equivalent", "similar", "narrower", "broader", "contrast", "collocation"].indexOf(r);
}

function EdgeItem({
  edge, other, rel, api, onSelect, knownSituations,
}: { edge: GraphEdge; other: GraphNode; rel: Relation; api: GraphApi; onSelect: (id: string) => void; knownSituations: string[] }) {
  const meta = RELATIONS[rel];
  const [editing, setEditing] = useState(false);
  const [noteDraft, setNoteDraft] = useState(edge.note ?? "");
  const [situationDraft, setSituationDraft] = useState(edge.situation ?? "");
  const listId = `sit-${edge.id}`;

  function save() {
    api.updateEdge(edge.id, { note: noteDraft.trim() || null, situation: situationDraft.trim() || null });
    setEditing(false);
  }

  return (
    <div className="edge-item">
      <div className="target" onClick={() => onSelect(other.id)}>
        <span className="chip lang" style={{ background: langColor(other.lang) }}>{langLabel(other.lang)}</span>
        <span>{other.preferred ? "★ " : ""}{other.text}</span>
      </div>
      <span style={{ display: "flex", gap: 4, alignItems: "center" }}>
        {edge.situation && <span className="chip" title="상황">{edge.situation}</span>}
        <span className="rel" style={{ background: meta.color }} title={meta.label}>{meta.short}</span>
      </span>
      {editing ? (
        <div className="note" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <input className="input" list={listId} value={situationDraft} onChange={(e) => setSituationDraft(e.target.value)} placeholder="상황 (환자 설명, 법정, 계약서…)" />
          <datalist id={listId}>
            {Array.from(new Set([...knownSituations, ...SITUATIONS])).map((s) => <option key={s} value={s} />)}
          </datalist>
          <textarea className="textarea" value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)} placeholder="뉘앙스 차이, 언제 쓰는지" autoFocus style={{ minHeight: 56 }} />
          <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
            <button className="btn sm" onClick={() => setEditing(false)}>취소</button>
            <button className="btn sm primary" onClick={save}>저장</button>
          </div>
        </div>
      ) : (
        <div className="note" onClick={() => { setNoteDraft(edge.note ?? ""); setSituationDraft(edge.situation ?? ""); setEditing(true); }} style={{ cursor: "text" }}>
          {edge.note ?? <span className="hint">{edge.situation ? "뉘앙스 메모 추가…" : "상황·뉘앙스 메모 추가…"}</span>}
        </div>
      )}
      <div className="weight">
        <span style={{ minWidth: 58 }}>{rel === "equivalent" ? "적합도" : rel === "contrast" ? "혼동 위험" : "강도"}</span>
        <input type="range" min={0} max={1} step={0.05} value={edge.weight} onChange={(e) => api.setEdgeWeight(edge.id, Number(e.target.value))} style={{ accentColor: meta.color }} />
        <b style={{ minWidth: 36, textAlign: "right" }}>{pct(edge.weight)}</b>
      </div>
      <div className="actions">
        <button className="btn sm" title="실제 통역·번역에서 이 대응을 사용했을 때 눌러 두면 사용 횟수가 쌓입니다" onClick={() => api.bumpUses(edge.id)}>
          사용 {edge.uses > 0 ? `×${edge.uses}` : ""} +1
        </button>
        <button className="btn sm ghost danger" onClick={() => api.deleteEdge(edge.id)}>끊기</button>
      </div>
    </div>
  );
}
