"use client";

import { useMemo, useState } from "react";
import Modal from "./Modal";
import LangSelect from "./LangSelect";
import { CSV_TEMPLATE, csvToImport, parseCsv } from "@/lib/csv";
import type { GraphApi } from "@/lib/useGraph";
import { langLabel } from "@/lib/types";

interface Props {
  api: GraphApi;
  knownLangs: string[];
  knownDomains: string[];
  onDone: (summary: string) => void;
  onClose: () => void;
}

export default function ImportCsvModal({ api, knownLangs, knownDomains, onDone, onClose }: Props) {
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [sourceLang, setSourceLang] = useState(knownLangs.includes("ko") ? "ko" : knownLangs[0] ?? "ko");
  const [targetLang, setTargetLang] = useState(knownLangs.find((l) => l !== sourceLang) ?? "en");
  const [domain, setDomain] = useState("");
  const [weight, setWeight] = useState(0.7);
  const [busy, setBusy] = useState(false);

  const conv = useMemo(() => {
    if (!text.trim()) return null;
    try {
      return csvToImport(parseCsv(text), { sourceLang, targetLang, domain, defaultWeight: weight });
    } catch {
      return null;
    }
  }, [text, sourceLang, targetLang, domain, weight]);

  async function pickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setFileName(f.name);
    setText(await f.text());
  }

  function downloadTemplate() {
    const blob = new Blob(["﻿" + CSV_TEMPLATE], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "nuance-graph-template.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function run() {
    if (!conv) return;
    setBusy(true);
    const r = await api.importGraph(conv.data, { dedupe: true, label: `CSV · ${fileName ?? "붙여넣기"}` });
    setBusy(false);
    onDone(`표현 ${r.nodes}개, 연결 ${r.edges}개, 예문 ${r.examples}개를 추가했습니다.${conv.skipped ? ` (비어 있는 ${conv.skipped}행은 건너뜀)` : ""}`);
  }

  const preview = conv?.data.edges.slice(0, 5) ?? [];
  const nodeText = (id: string) => conv?.data.nodes.find((n) => n.id === id)?.text ?? "";

  return (
    <Modal title="CSV 용어집 가져오기" onClose={onClose}>
      <div className="hint">
        첫 줄에 열 이름이 있는 CSV(또는 탭·세미콜론 구분) 파일을 넣으세요. <b>source, target</b> 두 열만 있으면 되고,
        <b> source_lang, target_lang, domain, situation, weight, note, register, relation, example, example_translation</b> 열은 있으면 함께 읽습니다. 한국어 열 이름(원문, 번역, 분야, 상황, 가중치, 메모, 예문)도 됩니다.
        열 이름이 없으면 1열=원문, 2열=번역으로 봅니다. 같은 언어·같은 글자의 표현은 이미 있는 노드에 합쳐집니다.
      </div>
      <div className="row">
        <label className="btn" style={{ cursor: "pointer" }}>
          파일 선택
          <input type="file" accept=".csv,.tsv,.txt,text/csv" hidden onChange={pickFile} />
        </label>
        <button type="button" className="btn ghost" onClick={downloadTemplate}>샘플 CSV 받기</button>
      </div>
      {fileName && <div className="small muted">{fileName}</div>}
      <textarea
        className="textarea"
        value={text}
        onChange={(e) => { setText(e.target.value); setFileName(null); }}
        placeholder={"또는 여기에 붙여 넣기:\nsource,target\n진통제,painkiller"}
        style={{ minHeight: 90, fontFamily: "ui-monospace, monospace", fontSize: 12.5 }}
      />
      <div className="row">
        <div className="field">
          <label>원문 언어 (source_lang 열이 없을 때)</label>
          <LangSelect value={sourceLang} onChange={setSourceLang} known={knownLangs} />
        </div>
        <div className="field">
          <label>번역 언어 (target_lang 열이 없을 때)</label>
          <LangSelect value={targetLang} onChange={setTargetLang} known={knownLangs} />
        </div>
      </div>
      <div className="row">
        <div className="field">
          <label>기본 분야 (domain 열이 없을 때)</label>
          <input className="input" list="csv-domain-list" value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="의료, 법률…" />
          <datalist id="csv-domain-list">{knownDomains.map((d) => <option key={d} value={d} />)}</datalist>
        </div>
        <div className="field">
          <label>기본 적합도 · {Math.round(weight * 100)}%</label>
          <input type="range" min={0} max={1} step={0.05} value={weight} onChange={(e) => setWeight(Number(e.target.value))} style={{ marginTop: 10 }} />
        </div>
      </div>
      {conv && (
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div className="small">
            <b>{conv.rows}행</b> → 표현 {conv.data.nodes.length}개, 연결 {conv.data.edges.length}개, 예문 {conv.data.examples?.length ?? 0}개
            {conv.skipped > 0 && <span className="hint"> · 비어 있는 {conv.skipped}행 건너뜀</span>}
          </div>
          <div className="hint">인식한 열: {conv.columns.join(", ") || "(없음)"}</div>
          {preview.map((e, i) => (
            <div key={i} className="small" style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
              <span>{nodeText(e.source_id)}</span>
              <span className="hint">→</span>
              <span>{nodeText(e.target_id)}</span>
              <span className="hint">{langLabel(e.target_id.split(":")[0])}{e.situation ? ` · ${e.situation}` : ""} · {Math.round((e.weight ?? 0) * 100)}%</span>
            </div>
          ))}
          {conv.data.edges.length > 5 && <div className="hint">… 외 {conv.data.edges.length - 5}개</div>}
        </div>
      )}
      <div className="footer">
        <button type="button" className="btn" onClick={onClose}>취소</button>
        <button type="button" className="btn primary" disabled={!conv || conv.data.edges.length === 0 || busy} onClick={run}>
          {busy ? "가져오는 중…" : "가져오기"}
        </button>
      </div>
    </Modal>
  );
}
