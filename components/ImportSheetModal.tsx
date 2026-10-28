"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Modal from "./Modal";
import LangSelect from "./LangSelect";
import { CSV_TEMPLATE, csvToImport, parseCsv } from "@/lib/csv";
import { guessLangsInRows, parseGoogleSheetUrl, parseSpreadsheetFile } from "@/lib/sheets";
import { getFirebaseAuth } from "@/lib/firebase";
import type { GraphApi } from "@/lib/useGraph";
import type { InboxItem } from "@/lib/types";
import { LANGS, langColor, langLabel } from "@/lib/types";
import { CHUNK_ROWS, type ExtractedItem } from "@/app/api/extract-nuance/schema";

interface Props {
  api: GraphApi;
  aiEnabled: boolean;
  knownLangs: string[];
  knownDomains: string[];
  onDone: (summary: string, openInbox: boolean) => void;
  onClose: () => void;
}

type Method = "map" | "ai";

export default function ImportSheetModal({ api, aiEnabled, knownLangs, knownDomains, onDone, onClose }: Props) {
  // ----- 1. 원본 -----
  const [rows, setRows] = useState<string[][]>([]);
  const [sourceName, setSourceName] = useState<string | null>(null);
  const [hasHeader, setHasHeader] = useState(true);
  const [sheetUrl, setSheetUrl] = useState("");
  const [loadingUrl, setLoadingUrl] = useState(false);
  const [paste, setPaste] = useState("");
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // ----- 2. 방법 -----
  const [method, setMethod] = useState<Method>("map");
  const [sourceLang, setSourceLang] = useState(knownLangs.includes("ko") ? "ko" : knownLangs[0] ?? "ko");
  const [targetLang, setTargetLang] = useState(knownLangs.find((l) => l !== "ko") ?? "en");
  const [domain, setDomain] = useState("");
  const [weight, setWeight] = useState(0.7);
  const [aiLangs, setAiLangs] = useState<Set<string>>(new Set());
  const [hint, setHint] = useState("");
  const [rowLimit, setRowLimit] = useState(200);
  const [aiInfo, setAiInfo] = useState<{ model: string; perChunkUsd: number } | null>(null);

  // ----- 3. 실행 -----
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0, items: 0, failed: 0 });
  const cancelRef = useRef(false);

  useEffect(() => {
    if (!aiEnabled) return;
    fetch("/api/extract-nuance").then((r) => r.json()).then((j) => j.enabled && setAiInfo({ model: j.model, perChunkUsd: j.perChunkUsd })).catch(() => {});
  }, [aiEnabled]);

  const header = hasHeader ? rows[0] ?? [] : [];
  const body = useMemo(() => (hasHeader ? rows.slice(1) : rows), [rows, hasHeader]);
  const detectedLangs = useMemo(() => guessLangsInRows(body), [body]);

  useEffect(() => {
    // 시트가 바뀌면 AI 언어 기본값을 시트에서 추정
    setAiLangs(new Set(detectedLangs.length >= 2 ? detectedLangs : Array.from(new Set([...detectedLangs, "ko", "en"]))));
    setRowLimit(Math.min(200, body.length));
  }, [detectedLangs, body.length]);

  const mapping = useMemo(() => {
    if (rows.length === 0) return null;
    try {
      return csvToImport(hasHeader ? rows : [["source", "target"], ...rows], { sourceLang, targetLang, domain, defaultWeight: weight });
    } catch {
      return null;
    }
  }, [rows, hasHeader, sourceLang, targetLang, domain, weight]);

  function loadRows(next: string[][], name: string | null) {
    setError(null);
    setRows(next);
    setSourceName(name);
    setHasHeader(true);
  }

  async function pickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    try {
      const { rows: r, sheetName } = await parseSpreadsheetFile(f);
      loadRows(r, sheetName ? `${f.name} · ${sheetName}` : f.name);
    } catch (err) {
      setError(`파일을 읽지 못했습니다: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async function loadFromUrl() {
    if (!parseGoogleSheetUrl(sheetUrl)) { setError("구글 스프레드시트 링크가 아닙니다."); return; }
    setLoadingUrl(true);
    setError(null);
    try {
      const token = await getFirebaseAuth().currentUser?.getIdToken();
      const res = await fetch("/api/import-sheet", { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${token}` }, body: JSON.stringify({ url: sheetUrl }) });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? `실패 (${res.status})`);
      loadRows(parseCsv(j.csv), "구글 시트");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoadingUrl(false);
    }
  }

  function downloadTemplate() {
    const blob = new Blob(["﻿" + CSV_TEMPLATE], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "nuance-graph-template.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function runMapping() {
    if (!mapping) return;
    setRunning(true);
    const r = await api.importGraph(mapping.data, { dedupe: true, label: `시트 · ${sourceName ?? "붙여넣기"}` });
    setRunning(false);
    onDone(`표현 ${r.nodes}개, 연결 ${r.edges}개, 예문 ${r.examples}개를 추가했습니다.${mapping.skipped ? ` (비어 있는 ${mapping.skipped}행 건너뜀)` : ""}`, false);
  }

  const chunks = useMemo(() => {
    const limited = body.slice(0, rowLimit);
    const out: Array<{ offset: number; rows: string[][] }> = [];
    for (let i = 0; i < limited.length; i += CHUNK_ROWS) out.push({ offset: i, rows: limited.slice(i, i + CHUNK_ROWS) });
    return out;
  }, [body, rowLimit]);
  const estUsd = aiInfo ? chunks.length * aiInfo.perChunkUsd : null;

  async function runAi() {
    const langs = Array.from(aiLangs);
    if (langs.length < 2) { setError("언어를 두 개 이상 고르세요."); return; }
    setRunning(true);
    setError(null);
    cancelRef.current = false;
    setProgress({ done: 0, total: chunks.length, items: 0, failed: 0 });
    const token = await getFirebaseAuth().currentUser?.getIdToken();
    const importId = crypto.randomUUID().replace(/-/g, "").slice(0, 20);
    const hdr = header.map((h) => h.slice(0, 500));

    const runChunk = async (c: { offset: number; rows: string[][] }, attempt = 0): Promise<ExtractedItem[]> => {
      const res = await fetch("/api/extract-nuance", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify({ header: hdr, rows: c.rows.map((r) => r.map((x) => x.slice(0, 500))), langs, domain: domain || null, hint: hint || null }),
      });
      const j = await res.json();
      if (!res.ok) {
        if (attempt < 1 && res.status >= 500) return runChunk(c, attempt + 1);
        throw new Error(j.error ?? `실패 (${res.status})`);
      }
      return (j.items as ExtractedItem[]).map((it) => ({ ...it, row: it.row + c.offset + (hasHeader ? 1 : 0) }));
    };

    // 동시 2개씩 처리하고, 청크가 끝날 때마다 대기열에 저장한다
    let next = 0;
    const worker = async () => {
      while (next < chunks.length && !cancelRef.current) {
        const c = chunks[next++];
        try {
          const items = await runChunk(c);
          const inboxItems: Array<Omit<InboxItem, "id" | "created_at">> = items.map((it) => ({
            import_id: importId,
            source_text: it.source_text.trim(),
            source_lang: it.source_lang,
            target_text: it.target_text.trim(),
            target_lang: it.target_lang,
            relation: it.relation as InboxItem["relation"],
            weight: Math.min(1, Math.max(0, it.weight / 100)),
            situation: it.situation,
            note: it.note || null,
            register: it.register,
            domain: domain || null,
            example: it.example ? { text: it.example.text, translation: it.example.translation, situation: it.example.situation } : null,
            confidence: it.confidence,
            row: it.row,
          }));
          await api.addInboxItems(inboxItems);
          setProgress((p) => ({ ...p, done: p.done + 1, items: p.items + inboxItems.length }));
        } catch (err) {
          setProgress((p) => ({ ...p, done: p.done + 1, failed: p.failed + 1 }));
          setError(err instanceof Error ? err.message : String(err));
        }
      }
    };
    await Promise.all([worker(), worker()]);
    setRunning(false);
    onDone(cancelRef.current ? "중단했습니다. 지금까지 추출한 항목은 검수 대기열에 있습니다." : "추출이 끝났습니다. 검수 대기열에서 확인하고 반영하세요.", true);
  }

  const preview = rows.slice(0, 6);
  const width = Math.max(0, ...preview.map((r) => r.length));

  return (
    <Modal title="시트·CSV 가져오기" onClose={() => { if (running) cancelRef.current = true; onClose(); }}>
      {rows.length === 0 ? (
        <>
          <div className="hint">
            엑셀(.xlsx)이나 CSV 파일, 또는 <b>링크가 있는 모든 사용자에게 보기 허용</b>된 구글 시트 링크를 넣으세요. 데이터는 브라우저에서 읽고, 내 계정에만 저장됩니다.
          </div>
          <div className="row">
            <button type="button" className="btn primary" onClick={() => fileRef.current?.click()}>파일 선택 (.xlsx / .csv)</button>
            <button type="button" className="btn ghost" onClick={downloadTemplate}>샘플 CSV 받기</button>
            <input ref={fileRef} type="file" accept=".xlsx,.xlsm,.xls,.ods,.csv,.tsv,.txt" hidden onChange={pickFile} />
          </div>
          <div className="field">
            <label>구글 시트 링크</label>
            <div className="row">
              <input className="input" value={sheetUrl} onChange={(e) => setSheetUrl(e.target.value)} placeholder="https://docs.google.com/spreadsheets/d/…" />
              <button type="button" className="btn" style={{ flex: "0 0 auto" }} disabled={loadingUrl || !sheetUrl} onClick={loadFromUrl}>{loadingUrl ? "불러오는 중…" : "불러오기"}</button>
            </div>
          </div>
          <div className="field">
            <label>또는 붙여넣기</label>
            <textarea className="textarea" value={paste} onChange={(e) => setPaste(e.target.value)} placeholder={"source,target\n진통제,painkiller"} style={{ minHeight: 70, fontFamily: "ui-monospace, monospace", fontSize: 12.5 }} />
            {paste.trim() && <button type="button" className="btn sm" style={{ alignSelf: "flex-start" }} onClick={() => loadRows(parseCsv(paste), "붙여넣기")}>이 내용 사용</button>}
          </div>
          {error && <div className="error">{error}</div>}
        </>
      ) : (
        <>
          <div className="row" style={{ alignItems: "center" }}>
            <div className="small"><b>{sourceName}</b> · {rows.length}행</div>
            <label className="small" style={{ display: "flex", gap: 6, alignItems: "center", flex: "0 0 auto" }}>
              <input type="checkbox" checked={hasHeader} onChange={(e) => setHasHeader(e.target.checked)} /> 첫 줄은 제목 행
            </label>
            <button type="button" className="btn sm" style={{ flex: "0 0 auto" }} onClick={() => setRows([])} disabled={running}>다른 원본</button>
          </div>
          <div style={{ overflowX: "auto", border: "1px solid var(--border)", borderRadius: 10 }}>
            <table style={{ borderCollapse: "collapse", fontSize: 12.5, minWidth: "100%" }}>
              <tbody>
                {preview.map((r, i) => (
                  <tr key={i} style={{ background: hasHeader && i === 0 ? "var(--surface-2)" : undefined }}>
                    {Array.from({ length: width }).map((_, c) => (
                      <td key={c} style={{ padding: "4px 8px", borderBottom: "1px solid var(--border)", whiteSpace: "nowrap", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", fontWeight: hasHeader && i === 0 ? 700 : 400 }}>{r[c] ?? ""}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!running && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label className="card" style={{ display: "flex", gap: 10, cursor: "pointer", borderColor: method === "map" ? "var(--accent)" : undefined }}>
                <input type="radio" name="method" checked={method === "map"} onChange={() => setMethod("map")} />
                <div>
                  <b>열 매핑으로 바로 가져오기</b>
                  <div className="small muted">source/target(원문/번역) 열을 찾아 그대로 넣습니다. AI 키가 없어도 됩니다. 메모는 연결 메모로 들어갑니다.</div>
                </div>
              </label>
              <label className="card" style={{ display: "flex", gap: 10, cursor: aiEnabled ? "pointer" : "not-allowed", opacity: aiEnabled ? 1 : 0.6, borderColor: method === "ai" ? "var(--accent)" : undefined }}>
                <input type="radio" name="method" checked={method === "ai"} disabled={!aiEnabled} onChange={() => setMethod("ai")} />
                <div>
                  <b>AI로 뉘앙스 추출</b>
                  <div className="small muted">
                    "painkiller(환자용), analgesic(의사용)" 같은 비정형 메모를 표현·관계·상황·가중치로 분리합니다. 결과는 바로 들어가지 않고 <b>검수 대기열</b>에 쌓입니다.
                    {!aiEnabled && " (Vercel 환경 변수 ANTHROPIC_API_KEY 가 필요합니다)"}
                  </div>
                </div>
              </label>
            </div>
          )}

          {method === "map" && !running && (
            <>
              <div className="row">
                <div className="field"><label>원문 언어 (source_lang 열이 없을 때)</label><LangSelect value={sourceLang} onChange={setSourceLang} known={knownLangs} /></div>
                <div className="field"><label>번역 언어 (target_lang 열이 없을 때)</label><LangSelect value={targetLang} onChange={setTargetLang} known={knownLangs} /></div>
              </div>
              <div className="row">
                <div className="field">
                  <label>기본 분야</label>
                  <input className="input" list="sheet-domain-list" value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="의료, 법률…" />
                  <datalist id="sheet-domain-list">{knownDomains.map((d) => <option key={d} value={d} />)}</datalist>
                </div>
                <div className="field">
                  <label>기본 적합도 · {Math.round(weight * 100)}%</label>
                  <input type="range" min={0} max={1} step={0.05} value={weight} onChange={(e) => setWeight(Number(e.target.value))} style={{ marginTop: 10 }} />
                </div>
              </div>
              {mapping && (
                <div className="card small">
                  인식한 열: {mapping.columns.join(", ") || "(없음)"} → 표현 {mapping.data.nodes.length}개, 연결 {mapping.data.edges.length}개, 예문 {mapping.data.examples?.length ?? 0}개
                  {mapping.skipped > 0 && <span className="hint"> · 비어 있는 {mapping.skipped}행 건너뜀</span>}
                  {mapping.data.edges.length === 0 && <div className="error" style={{ marginTop: 4 }}>원문·번역 열을 찾지 못했습니다. 첫 줄을 source,target 으로 바꾸거나 "AI로 뉘앙스 추출"을 쓰세요.</div>}
                </div>
              )}
            </>
          )}

          {method === "ai" && !running && (
            <>
              <div className="field">
                <label>시트에 등장하는 언어</label>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {Array.from(new Set([...detectedLangs, ...knownLangs, ...Object.keys(LANGS).slice(0, 4)])).map((code) => {
                    const on = aiLangs.has(code);
                    return (
                      <button key={code} type="button" className="chip lang" onClick={() => setAiLangs((p) => { const n = new Set(p); if (n.has(code)) n.delete(code); else n.add(code); return n; })}
                        style={{ background: on ? langColor(code) : "var(--surface-2)", color: on ? "#fff" : "var(--text-3)", border: 0, cursor: "pointer", minHeight: 28, padding: "4px 12px" }}>
                        {langLabel(code)}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="row">
                <div className="field">
                  <label>기본 분야</label>
                  <input className="input" list="sheet-domain-list2" value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="의료, 법률…" />
                  <datalist id="sheet-domain-list2">{knownDomains.map((d) => <option key={d} value={d} />)}</datalist>
                </div>
                <div className="field">
                  <label>처리할 행 수 (처음부터)</label>
                  <input className="input" type="number" min={1} max={body.length} value={rowLimit} onChange={(e) => setRowLimit(Math.max(1, Math.min(body.length, Number(e.target.value) || 1)))} />
                </div>
              </div>
              <div className="field">
                <label>시트 설명 (선택)</label>
                <textarea className="textarea" value={hint} onChange={(e) => setHint(e.target.value)} placeholder="예: B열은 환자에게 쓰는 말, C열은 차트용. 괄호 안은 상황. '주의'라고 적은 건 혼동 주의." style={{ minHeight: 56 }} />
              </div>
              <div className="card small">
                {rowLimit}행 → {chunks.length}번 호출 ({CHUNK_ROWS}행씩, 동시에 2개)
                {aiInfo && estUsd != null && <> · 모델 {aiInfo.model} · 예상 비용 약 <b>${estUsd.toFixed(2)}</b></>}
                <div className="hint">비용을 낮추려면 Vercel 환경 변수 ANTHROPIC_MODEL 을 claude-haiku-5-5 로 바꾸세요. 처음에는 50행 정도로 결과 품질을 먼저 확인하는 것을 권합니다.</div>
              </div>
            </>
          )}

          {running && (
            <div className="card" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <b>{method === "ai" ? "AI 추출 중…" : "가져오는 중…"}</b>
              {method === "ai" && (
                <>
                  <div className="small">청크 {progress.done} / {progress.total} · 추출 {progress.items}건{progress.failed ? ` · 실패 ${progress.failed}` : ""}</div>
                  <div style={{ height: 6, background: "var(--surface-2)", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%`, height: "100%", background: "var(--accent)", transition: "width 0.3s" }} />
                  </div>
                  <div className="hint">끝난 청크는 바로 검수 대기열에 저장됩니다. 창을 닫아도 지금까지의 결과는 남습니다.</div>
                </>
              )}
            </div>
          )}
          {error && <div className="error">{error}</div>}

          <div className="footer">
            {running ? (
              <button type="button" className="btn" onClick={() => { cancelRef.current = true; }}>중단</button>
            ) : (
              <>
                <button type="button" className="btn" onClick={onClose}>취소</button>
                {method === "map" ? (
                  <button type="button" className="btn primary" disabled={!mapping || mapping.data.edges.length === 0} onClick={runMapping}>가져오기</button>
                ) : (
                  <button type="button" className="btn primary" disabled={!aiEnabled || chunks.length === 0 || aiLangs.size < 2} onClick={runAi}>AI 추출 시작</button>
                )}
              </>
            )}
          </div>
        </>
      )}
    </Modal>
  );
}
