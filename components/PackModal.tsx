"use client";

import { useMemo, useState } from "react";
import Modal from "./Modal";
import { STARTER_PACKS, compilePack } from "@/lib/packs";
import type { GraphApi } from "@/lib/useGraph";
import { langColor, langLabel } from "@/lib/types";

interface Props {
  api: GraphApi;
  onDone: (summary: string) => void;
  onClose: () => void;
}

export default function PackModal({ api, onDone, onClose }: Props) {
  const [packId, setPackId] = useState(STARTER_PACKS[0].id);
  const pack = STARTER_PACKS.find((p) => p.id === packId) ?? STARTER_PACKS[0];
  const [langs, setLangs] = useState<Set<string>>(new Set(pack.langs));
  const [busy, setBusy] = useState(false);

  const chosen = pack.langs.filter((l) => langs.has(l));
  const compiled = useMemo(() => compilePack(pack, chosen), [pack, chosen]);

  // 이미 있는 표현은 제외하고 실제로 추가될 수를 센다
  const key = (text: string, lang: string) => `${lang}\u0000${text.trim().toLowerCase()}`;
  const existing = useMemo(() => new Set(api.nodes.map((n) => key(n.text, n.lang))), [api.nodes]);
  const newNodes = compiled.nodes.filter((n) => !existing.has(key(n.text, n.lang))).length;

  function toggle(code: string) {
    setLangs((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }

  async function run() {
    setBusy(true);
    const r = await api.importGraph(compiled, { dedupe: true, label: `스타터 팩 · ${pack.title}` });
    setBusy(false);
    onDone(`${pack.title} 팩에서 표현 ${r.nodes}개, 연결 ${r.edges}개, 예문 ${r.examples}개를 추가했습니다.`);
  }

  return (
    <Modal title="스타터 팩 추가" onClose={onClose}>
      <div className="hint">
        분야별로 미리 만들어 둔 표현·관계·뉘앙스 메모를 한 번에 넣습니다. 가중치와 메모는 <b>초안</b>이니, 내 현장 감각과 다르면
        패널에서 바로 고치세요. 이미 있는 표현은 중복 생성하지 않고 그 노드에 연결만 더합니다.
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {STARTER_PACKS.map((p) => (
          <label key={p.id} className="card" style={{ display: "flex", gap: 10, cursor: "pointer", borderColor: p.id === packId ? "var(--accent)" : undefined }}>
            <input type="radio" name="pack" checked={p.id === packId} onChange={() => { setPackId(p.id); setLangs(new Set(p.langs)); }} />
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <b>{p.title} <span className="hint">· 개념 {p.concepts.length}개</span></b>
              <span className="small muted">{p.description}</span>
            </div>
          </label>
        ))}
      </div>
      <div className="field">
        <label>포함할 언어</label>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {pack.langs.map((code) => {
            const on = langs.has(code);
            return (
              <button
                key={code}
                type="button"
                className="chip lang"
                onClick={() => toggle(code)}
                style={{ background: on ? langColor(code) : "var(--surface-2)", color: on ? "#fff" : "var(--text-3)", border: 0, cursor: "pointer", minHeight: 28, padding: "4px 12px" }}
              >
                {langLabel(code)}
              </button>
            );
          })}
        </div>
        <div className="hint">한국어는 다른 언어를 잇는 허브이므로 포함하는 것을 권합니다.</div>
      </div>
      <div className="card small">
        추가될 표현 <b>{newNodes}</b>개{compiled.nodes.length !== newNodes && <span className="hint"> (이미 있는 {compiled.nodes.length - newNodes}개는 재사용)</span>}
        · 연결 {compiled.edges.length}개 · 예문 {compiled.examples?.length ?? 0}개
      </div>
      <div className="footer">
        <button type="button" className="btn" onClick={onClose}>취소</button>
        <button type="button" className="btn primary" disabled={busy || chosen.length < 2} onClick={run}>
          {busy ? "추가하는 중…" : "그래프에 추가"}
        </button>
      </div>
    </Modal>
  );
}
