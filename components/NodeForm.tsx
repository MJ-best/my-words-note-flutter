"use client";

import { useState } from "react";
import Modal from "./Modal";
import LangSelect from "./LangSelect";
import type { GraphNode, Kind, NodeInput } from "@/lib/types";
import { KINDS, REGISTERS } from "@/lib/types";

interface Props {
  initial?: GraphNode | null;
  defaultLang: string;
  knownLangs: string[];
  knownDomains: string[];
  onSubmit: (input: NodeInput) => Promise<void>;
  onClose: () => void;
}

export default function NodeForm({ initial, defaultLang, knownLangs, knownDomains, onSubmit, onClose }: Props) {
  const [text, setText] = useState(initial?.text ?? "");
  const [lang, setLang] = useState(initial?.lang ?? defaultLang);
  const [kind, setKind] = useState<Kind>(initial?.kind ?? "word");
  const [domain, setDomain] = useState(initial?.domain ?? "");
  const [register, setRegister] = useState(initial?.register ?? "");
  const [note, setNote] = useState(initial?.note ?? "");
  const [preferred, setPreferred] = useState(initial?.preferred ?? false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || !lang) return;
    setBusy(true);
    await onSubmit({ text, lang, kind, domain, register, note, preferred });
    setBusy(false);
  }

  return (
    <Modal title={initial ? "표현 수정" : "새 표현"} onClose={onClose}>
      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div className="field">
          <label>표현</label>
          <input
            className="input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="단어, 구, 또는 문장"
            autoFocus
            required
          />
        </div>
        <div className="row">
          <div className="field">
            <label>언어</label>
            <LangSelect value={lang} onChange={setLang} known={knownLangs} />
          </div>
          <div className="field">
            <label>종류</label>
            <select className="select" value={kind} onChange={(e) => setKind(e.target.value as Kind)}>
              {(Object.keys(KINDS) as Kind[]).map((k) => (
                <option key={k} value={k}>{KINDS[k]}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="row">
          <div className="field">
            <label>분야</label>
            <input
              className="input"
              list="domain-list"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="의료, 법률, 일상…"
            />
            <datalist id="domain-list">
              {knownDomains.map((d) => <option key={d} value={d} />)}
            </datalist>
          </div>
          <div className="field">
            <label>격식·문체</label>
            <select className="select" value={register} onChange={(e) => setRegister(e.target.value)}>
              {REGISTERS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="field">
          <label>내 뉘앙스 메모</label>
          <textarea
            className="textarea"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="이 표현이 주는 느낌, 누가 언제 쓰는지, 피해야 할 상황…"
          />
        </div>
        <label style={{ display: "flex", gap: 8, alignItems: "center", cursor: "pointer" }}>
          <input type="checkbox" checked={preferred} onChange={(e) => setPreferred(e.target.checked)} />
          <span>★ 내가 선호하는 표현 (비슷한 표현 중 내가 주로 고르는 것)</span>
        </label>
        <div className="footer">
          <button type="button" className="btn" onClick={onClose}>취소</button>
          <button type="submit" className="btn primary" disabled={busy || !text.trim() || !lang}>
            {initial ? "저장" : "추가"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
