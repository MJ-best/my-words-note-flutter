"use client";

import { useMemo, useState } from "react";
import Modal from "./Modal";
import type { GraphApi, ImportData } from "@/lib/useGraph";
import type { InboxItem, Relation } from "@/lib/types";
import { RELATIONS, RELATION_ORDER, SITUATIONS, langColor, langLabel } from "@/lib/types";
import { pct } from "@/lib/graph-utils";

interface Props {
  api: GraphApi;
  onDone: (summary: string) => void;
  onClose: () => void;
}

const CONF_ORDER = { low: 0, medium: 1, high: 2 } as const;
const CONF_LABEL = { low: "확신 낮음", medium: "보통", high: "확신 높음" } as const;
const CONF_COLOR = { low: "var(--danger)", medium: "#b8862b", high: "#2f7a6b" } as const;

/** AI 추출 결과 검수 대기열. 확신도가 낮은 항목이 위로 온다. */
export default function InboxModal({ api, onDone, onClose }: Props) {
  const items = useMemo(() => [...api.inbox].sort((a, b) => CONF_ORDER[a.confidence] - CONF_ORDER[b.confidence] || a.row - b.row), [api.inbox]);
  const [selected, setSelected] = useState<Set<string>>(() => new Set(items.map((i) => i.id)));
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const allSelected = items.length > 0 && items.every((i) => selected.has(i.id));

  const toggle = (id: string) => setSelected((p) => { const n = new Set(p); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  async function apply() {
    const chosen = items.filter((i) => selected.has(i.id));
    if (chosen.length === 0) return;
    setBusy(true);
    const nodes = new Map<string, ImportData["nodes"][number]>();
    const nodeFor = (text: string, lang: string, register: string | null, domain: string | null) => {
      const id = `${lang}:${text.trim().toLowerCase()}`;
      if (!nodes.has(id)) nodes.set(id, { id, text: text.trim(), lang, domain, register, note: null });
      else if (register && !nodes.get(id)!.register) nodes.get(id)!.register = register;
      return id;
    };
    const edges: ImportData["edges"] = [];
    const examples: NonNullable<ImportData["examples"]> = [];
    for (const it of chosen) {
      const s = nodeFor(it.source_text, it.source_lang, null, it.domain);
      const t = nodeFor(it.target_text, it.target_lang, it.register, it.domain);
      if (s === t) continue;
      edges.push({ source_id: s, target_id: t, relation: it.relation, weight: it.weight, note: it.note, situation: it.situation });
      if (it.example?.text) examples.push({ node_id: s, text: it.example.text, translation: it.example.translation || null, situation: it.example.situation ?? it.situation });
    }
    const r = await api.importGraph({ nodes: Array.from(nodes.values()), edges, examples }, { dedupe: true, label: `AI 추출 검수 · ${chosen.length}건` });
    await api.deleteInboxItems(chosen.map((i) => i.id));
    setBusy(false);
    onDone(`검수한 ${chosen.length}건을 반영했습니다: 표현 ${r.nodes}개, 연결 ${r.edges}개, 예문 ${r.examples}개 추가.`);
  }

  async function discardSelected() {
    const ids = items.filter((i) => selected.has(i.id)).map((i) => i.id);
    if (ids.length === 0 || !confirm(`${ids.length}건을 대기열에서 삭제할까요?`)) return;
    setBusy(true);
    await api.deleteInboxItems(ids);
    setBusy(false);
    setSelected(new Set());
  }

  return (
    <Modal title={`검수 대기열 · ${items.length}건`} onClose={onClose}>
      <div className="hint">
        AI가 시트에서 뽑은 후보입니다. 아직 그래프에 들어가지 않았습니다. 가중치·상황·관계를 고친 뒤 <b>선택 반영</b>을 누르면 본 그래프에 합쳐집니다. 이미 있는 표현은 재사용합니다.
      </div>
      <div className="row" style={{ alignItems: "center" }}>
        <label className="small" style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <input type="checkbox" checked={allSelected} onChange={(e) => setSelected(e.target.checked ? new Set(items.map((i) => i.id)) : new Set())} /> 전체 선택 ({selected.size})
        </label>
        <span className="hint" style={{ flex: "0 0 auto" }}>확신 낮음 → 높음 순</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: "48dvh", overflowY: "auto" }}>
        {items.length === 0 && <div className="dash-empty">대기 중인 항목이 없습니다.</div>}
        {items.map((it) => (
          <InboxRow key={it.id} item={it} checked={selected.has(it.id)} onToggle={() => toggle(it.id)} open={open === it.id} onOpen={() => setOpen(open === it.id ? null : it.id)} api={api} />
        ))}
      </div>
      <div className="footer">
        <button type="button" className="btn ghost danger" disabled={busy || selected.size === 0} onClick={discardSelected}>선택 삭제</button>
        <button type="button" className="btn" onClick={onClose}>닫기</button>
        <button type="button" className="btn primary" disabled={busy || selected.size === 0} onClick={apply}>{busy ? "반영 중…" : `선택 반영 (${selected.size})`}</button>
      </div>
    </Modal>
  );
}

function InboxRow({ item, checked, onToggle, open, onOpen, api }: { item: InboxItem; checked: boolean; onToggle: () => void; open: boolean; onOpen: () => void; api: GraphApi }) {
  const meta = RELATIONS[item.relation];
  return (
    <div className="edge-item" style={{ gridTemplateColumns: "auto 1fr auto", borderColor: item.confidence === "low" ? "var(--danger)" : undefined }}>
      <input type="checkbox" checked={checked} onChange={onToggle} style={{ alignSelf: "start", marginTop: 4 }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
          <span className="chip lang" style={{ background: langColor(item.source_lang) }}>{langLabel(item.source_lang)}</span>
          <b>{item.source_text}</b>
          <span className="hint">→</span>
          <span className="chip lang" style={{ background: langColor(item.target_lang) }}>{langLabel(item.target_lang)}</span>
          <b>{item.target_text}</b>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", fontSize: 12.5 }}>
          <span className="rel" style={{ background: meta.color }}>{meta.short}</span>
          {item.situation && <span className="chip">{item.situation}</span>}
          <span>{pct(item.weight)}</span>
          <span style={{ color: CONF_COLOR[item.confidence], fontWeight: 700 }}>{CONF_LABEL[item.confidence]}</span>
          <span className="hint">· {item.row}행</span>
        </div>
        {item.note && <div className="small muted" style={{ whiteSpace: "pre-wrap" }}>{item.note}</div>}
        {open && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
            <div className="row">
              <select className="select" value={item.relation} onChange={(e) => api.updateInboxItem(item.id, { relation: e.target.value as Relation })}>
                {RELATION_ORDER.map((r) => <option key={r} value={r}>{RELATIONS[r].label}</option>)}
              </select>
              <input className="input" list="inbox-situations" value={item.situation ?? ""} placeholder="상황" onChange={(e) => api.updateInboxItem(item.id, { situation: e.target.value || null })} />
              <datalist id="inbox-situations">{SITUATIONS.map((s) => <option key={s} value={s} />)}</datalist>
            </div>
            <div className="weight" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className="small">가중치</span>
              <input type="range" min={0} max={1} step={0.05} value={item.weight} onChange={(e) => api.updateInboxItem(item.id, { weight: Number(e.target.value) })} style={{ flex: 1, accentColor: meta.color }} />
              <b style={{ minWidth: 36, textAlign: "right" }}>{pct(item.weight)}</b>
            </div>
            <textarea className="textarea" value={item.note ?? ""} placeholder="뉘앙스 메모" onChange={(e) => api.updateInboxItem(item.id, { note: e.target.value || null })} style={{ minHeight: 48 }} />
            {item.example && (
              <div className="example-item"><div className="t">{item.example.text}</div>{item.example.translation && <div className="tr">{item.example.translation}</div>}</div>
            )}
          </div>
        )}
      </div>
      <button type="button" className="btn sm ghost" onClick={onOpen} style={{ alignSelf: "start" }}>{open ? "접기" : "수정"}</button>
    </div>
  );
}
