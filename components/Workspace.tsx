"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut as firebaseSignOut } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase";
import { useGraph } from "@/lib/useGraph";
import { useViewState, type ViewMode } from "@/lib/useViewState";
import { SEED } from "@/lib/seed";
import type { GraphNode, NodeInput, Relation } from "@/lib/types";
import Dashboard from "./Dashboard";
import GraphExplorer from "./GraphExplorer";
import PacksView from "./PacksView";
import SearchBox from "./SearchBox";
import NodeForm from "./NodeForm";
import EdgeForm from "./EdgeForm";
import PackModal from "./PackModal";
import ImportCsvModal from "./ImportCsvModal";
import Brand, { PenguinMark } from "./Brand";

interface Props {
  userId: string;
  email: string;
  aiEnabled: boolean;
}

export default function Workspace({ userId, email, aiEnabled }: Props) {
  const router = useRouter();
  const api = useGraph(userId);
  const { nodes, edges, examples, loading, error } = api;
  const { view, centerId, navigate } = useViewState();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [nodeForm, setNodeForm] = useState<{ mode: "new" } | { mode: "edit"; node: GraphNode } | null>(null);
  const [edgeForm, setEdgeForm] = useState<GraphNode | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [packOpen, setPackOpen] = useState(false);
  const [csvOpen, setCsvOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 5000);
  }, []);
  const fileRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const knownLangs = useMemo(() => Array.from(new Set(nodes.map((n) => n.lang))).sort(), [nodes]);
  const knownDomains = useMemo(
    () => Array.from(new Set(nodes.map((n) => n.domain).filter((d): d is string => Boolean(d)))).sort(),
    [nodes],
  );
  const knownSituations = useMemo(
    () => Array.from(new Set(edges.map((e) => e.situation).filter((d): d is string => Boolean(d)))).sort(),
    [edges],
  );

  const selected = selectedId ? nodes.find((n) => n.id === selectedId) ?? null : null;
  useEffect(() => {
    if (selectedId && !nodes.some((n) => n.id === selectedId)) setSelectedId(null);
  }, [nodes, selectedId]);

  /** 표현을 중심으로 그래프 탐색기를 연다 */
  const openNode = useCallback((id: string) => navigate({ view: "graph", node: id }), [navigate]);
  const setView = useCallback((v: ViewMode) => navigate({ view: v, node: v === "graph" ? centerId ?? undefined : null }), [navigate, centerId]);

  // 단축키: / 검색(그래프 화면), Esc 닫기, n 새 표현
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const typing = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
      if (view !== "dashboard" && ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k" || (e.key === "/" && !typing))) {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === "Escape" && !nodeForm && !edgeForm) setSelectedId(null);
      if (e.key === "n" && !typing && !nodeForm && !edgeForm) setNodeForm({ mode: "new" });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [nodeForm, edgeForm, view]);

  async function handleNodeSubmit(input: NodeInput) {
    if (nodeForm?.mode === "edit") {
      await api.updateNode(nodeForm.node.id, input);
    } else {
      const created = await api.addNode(input);
      if (created) openNode(created.id);
    }
    setNodeForm(null);
  }

  async function handleEdgeSubmit(input: { target: { id: string } | { text: string; lang: string }; relation: Relation; weight: number; note: string; situation: string }) {
    if (!edgeForm) return;
    let targetId: string;
    if ("id" in input.target) targetId = input.target.id;
    else {
      const created = await api.addNode({ text: input.target.text, lang: input.target.lang, domain: edgeForm.domain ?? undefined });
      if (!created) return;
      targetId = created.id;
    }
    await api.addEdge({ source_id: edgeForm.id, target_id: targetId, relation: input.relation, weight: input.weight, note: input.note, situation: input.situation });
    setEdgeForm(null);
  }

  function downloadExport() {
    const data = api.exportGraph();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `nuance-graph-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    setMenuOpen(false);
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (!Array.isArray(data.nodes) || !Array.isArray(data.edges)) throw new Error("nodes/edges 배열이 없는 파일입니다.");
      const r = await api.importGraph(data, { dedupe: true, label: `JSON · ${file.name}` });
      showToast(`표현 ${r.nodes}개, 연결 ${r.edges}개, 예문 ${r.examples}개를 가져왔습니다.`);
    } catch (err) {
      alert(`가져오기 실패: ${err instanceof Error ? err.message : String(err)}`);
    }
    setMenuOpen(false);
  }

  async function undoLastImport() {
    const last = api.imports[0];
    if (!last) return;
    setMenuOpen(false);
    if (!confirm(`"${last.label}" (표현 ${last.nodes}, 연결 ${last.edges}, 예문 ${last.examples})으로 들어온 항목을 모두 삭제할까요?`)) return;
    const r = await api.undoImport(last.id);
    if (r) showToast(`되돌렸습니다: 표현 ${r.nodes}개, 연결 ${r.edges}개, 예문 ${r.examples}개 삭제`);
  }

  async function signOut() {
    await firebaseSignOut(getFirebaseAuth());
    router.replace("/login");
  }

  const lastImport = api.imports[0];

  return (
    <div className="app">
      <header className="topbar">
        <Brand />

        <nav className="nav" aria-label="화면">
          <button className={view === "dashboard" ? "active" : ""} onClick={() => setView("dashboard")}>대시보드</button>
          <button className={view === "graph" ? "active" : ""} onClick={() => setView("graph")}>그래프</button>
          <button className={view === "packs" ? "active" : ""} onClick={() => setView("packs")}>전문가 팩</button>
        </nav>

        {view !== "dashboard" && (
          <SearchBox ref={searchRef} nodes={nodes} onPick={openNode} className="hide-mobile" placeholder="표현 검색" />
        )}

        <div style={{ marginLeft: "auto", display: "flex", gap: 6, alignItems: "center", position: "relative" }}>
          <button className="btn primary desktop-only" onClick={() => setNodeForm({ mode: "new" })}>+ 표현</button>
          <button className="btn icon" onClick={() => setMenuOpen((v) => !v)} aria-label="메뉴">☰</button>
          {menuOpen && (
            <div className="search-results" style={{ left: "auto", right: 0, width: 280 }} onMouseLeave={() => setMenuOpen(false)}>
              <div className="hint" style={{ padding: "6px 10px" }}>{email}</div>
              <button onClick={() => { setPackOpen(true); setMenuOpen(false); }}>스타터 팩 추가…</button>
              <button onClick={() => { setCsvOpen(true); setMenuOpen(false); }}>CSV 용어집 가져오기…</button>
              <button onClick={downloadExport}>JSON으로 내보내기</button>
              <button onClick={() => fileRef.current?.click()}>JSON 가져오기</button>
              {lastImport && (
                <button onClick={undoLastImport} title={lastImport.label}>
                  최근 가져오기 되돌리기 <span className="hint">({lastImport.nodes}·{lastImport.edges})</span>
                </button>
              )}
              <button onClick={async () => { if (confirm("예시 그래프(감정·의료·법률)를 내 그래프에 추가할까요?")) { await api.importGraph(SEED, { dedupe: true, label: "예시 그래프" }); } setMenuOpen(false); }}>예시 그래프 추가</button>
              <button onClick={async () => { if (confirm("정말 내 그래프의 모든 표현과 연결을 삭제할까요? 되돌릴 수 없습니다.")) await api.clearAll(); setMenuOpen(false); }} style={{ color: "var(--danger)" }}>모두 삭제</button>
              <button onClick={signOut}>로그아웃</button>
            </div>
          )}
          <input ref={fileRef} type="file" accept="application/json" hidden onChange={handleImportFile} />
        </div>
      </header>

      {loading ? (
        <div className="empty" style={{ position: "relative" }}><div className="card"><p className="muted">불러오는 중…</p></div></div>
      ) : error ? (
        <div className="empty" style={{ position: "relative" }}>
          <div className="card">
            <h1>문제가 생겼습니다</h1>
            <p className="error" style={{ whiteSpace: "pre-wrap" }}>{error}</p>
            <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
              <button className="btn" onClick={api.reload}>다시 시도</button>
              <button className="btn ghost" onClick={api.dismissError}>닫기</button>
            </div>
          </div>
        </div>
      ) : view === "packs" ? (
        <PacksView userId={userId} onToast={showToast} />
      ) : nodes.length === 0 ? (
        <div className="empty" style={{ position: "relative" }}>
          <div className="card">
            <PenguinMark />
            <h1>표현 사이의 관계를 그려 보세요</h1>
            <p className="muted" style={{ margin: 0 }}>
              단어를 외우는 대신, "사랑해"가 일본어에서는 愛してる보다 好き에 더 가깝다는 식의 관계와 뉘앙스를 선으로 잇고 가중치로 조정합니다.
            </p>
            <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
              <button className="btn primary" onClick={() => setPackOpen(true)}>스타터 팩으로 시작</button>
              <button className="btn" onClick={async () => { await api.importGraph(SEED, { label: "예시 그래프" }); }}>작은 예시 그래프</button>
              <button className="btn" onClick={() => setCsvOpen(true)}>내 용어집 CSV 가져오기</button>
              <button className="btn ghost" onClick={() => setNodeForm({ mode: "new" })}>빈 그래프에서 시작</button>
            </div>
            <p className="hint" style={{ margin: 0 }}>스타터 팩: 의료 통역·법률 통역 (한국어·영어·일본어·러시아어)</p>
          </div>
        </div>
      ) : view === "graph" ? (
        <GraphExplorer
          api={api}
          centerId={centerId}
          selectedId={selectedId}
          aiEnabled={aiEnabled}
          onSelect={setSelectedId}
          onCenter={openNode}
          onEditNode={(n) => setNodeForm({ mode: "edit", node: n })}
          onAddEdge={(n) => setEdgeForm(n)}
          onNewNode={() => setNodeForm({ mode: "new" })}
          onToast={showToast}
        />
      ) : (
        <Dashboard nodes={nodes} edges={edges} examples={examples} onOpen={openNode} />
      )}

      {nodeForm && (
        <NodeForm
          initial={nodeForm.mode === "edit" ? nodeForm.node : null}
          defaultLang={selected?.lang ?? knownLangs[0] ?? "ko"}
          knownLangs={knownLangs}
          knownDomains={knownDomains}
          onSubmit={handleNodeSubmit}
          onClose={() => setNodeForm(null)}
        />
      )}
      {packOpen && (
        <PackModal
          api={api}
          onDone={(msg) => { setPackOpen(false); showToast(msg); }}
          onClose={() => setPackOpen(false)}
        />
      )}
      {csvOpen && (
        <ImportCsvModal
          api={api}
          knownLangs={knownLangs.length ? knownLangs : ["ko", "en", "ja", "ru"]}
          knownDomains={knownDomains}
          onDone={(msg) => { setCsvOpen(false); showToast(msg); }}
          onClose={() => setCsvOpen(false)}
        />
      )}
      {toast && (
        <div className="toast" role="status" onClick={() => setToast(null)}>{toast}</div>
      )}
      {edgeForm && (
        <EdgeForm
          source={edgeForm}
          nodes={nodes}
          knownLangs={knownLangs.length ? knownLangs : ["ko", "en", "ja", "ru"]}
          knownSituations={knownSituations}
          onSubmit={handleEdgeSubmit}
          onClose={() => setEdgeForm(null)}
        />
      )}
    </div>
  );
}
