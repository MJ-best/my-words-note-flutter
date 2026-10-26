"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut as firebaseSignOut } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase";
import { useGraph } from "@/lib/useGraph";
import { SEED } from "@/lib/seed";
import type { GraphNode, NodeInput, Relation } from "@/lib/types";
import { RELATIONS, RELATION_ORDER, langColor, langLabel } from "@/lib/types";
import GraphCanvas from "./GraphCanvas";
import NodePanel from "./NodePanel";
import NodeForm from "./NodeForm";
import EdgeForm from "./EdgeForm";

interface Props {
  userId: string;
  email: string;
  aiEnabled: boolean;
}

export default function Workspace({ userId, email, aiEnabled }: Props) {
  const router = useRouter();
  const api = useGraph(userId);
  const { nodes, edges, examples, loading, error } = api;

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focus, setFocus] = useState<{ id: string; tick: number } | null>(null);
  const [fitTick, setFitTick] = useState(0);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [langFilter, setLangFilter] = useState<Set<string>>(new Set());
  const [domainFilter, setDomainFilter] = useState<string>("");
  const [nodeForm, setNodeForm] = useState<{ mode: "new" } | { mode: "edit"; node: GraphNode } | null>(null);
  const [edgeForm, setEdgeForm] = useState<GraphNode | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const knownLangs = useMemo(() => Array.from(new Set(nodes.map((n) => n.lang))).sort(), [nodes]);
  const knownDomains = useMemo(
    () => Array.from(new Set(nodes.map((n) => n.domain).filter((d): d is string => Boolean(d)))).sort(),
    [nodes],
  );

  const visibleNodes = useMemo(
    () =>
      nodes.filter(
        (n) => (langFilter.size === 0 || langFilter.has(n.lang)) && (!domainFilter || n.domain === domainFilter),
      ),
    [nodes, langFilter, domainFilter],
  );
  const visibleIds = useMemo(() => new Set(visibleNodes.map((n) => n.id)), [visibleNodes]);
  const visibleEdges = useMemo(
    () => edges.filter((e) => visibleIds.has(e.source_id) && visibleIds.has(e.target_id)),
    [edges, visibleIds],
  );

  const selected = selectedId ? nodes.find((n) => n.id === selectedId) ?? null : null;
  useEffect(() => {
    if (selectedId && !nodes.some((n) => n.id === selectedId)) setSelectedId(null);
  }, [nodes, selectedId]);

  const select = useCallback((id: string | null) => {
    setSelectedId(id);
    if (id) setFocus((f) => ({ id, tick: (f?.tick ?? 0) + 1 }));
  }, []);

  const q = query.trim().toLowerCase();
  const results = useMemo(() => {
    if (!q) return [];
    return nodes
      .filter((n) => n.text.toLowerCase().includes(q) || (n.note ?? "").toLowerCase().includes(q) || (n.domain ?? "").toLowerCase().includes(q))
      .slice(0, 10);
  }, [nodes, q]);

  // 단축키: / 검색, Esc 닫기, n 새 표현
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const typing = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
      if (e.key === "/" && !typing) { e.preventDefault(); searchRef.current?.focus(); }
      if (e.key === "Escape" && !nodeForm && !edgeForm) { setSelectedId(null); setSearchOpen(false); }
      if (e.key === "n" && !typing && !nodeForm && !edgeForm) setNodeForm({ mode: "new" });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [nodeForm, edgeForm]);

  async function handleNodeSubmit(input: NodeInput) {
    if (nodeForm?.mode === "edit") {
      await api.updateNode(nodeForm.node.id, input);
    } else {
      const created = await api.addNode(input);
      if (created) {
        // 새 표현이 현재 필터에 가려지지 않게 한다
        if (langFilter.size && !langFilter.has(created.lang)) setLangFilter(new Set());
        if (domainFilter && created.domain !== domainFilter) setDomainFilter("");
        select(created.id);
      }
    }
    setNodeForm(null);
  }

  async function handleEdgeSubmit(input: { target: { id: string } | { text: string; lang: string }; relation: Relation; weight: number; note: string }) {
    if (!edgeForm) return;
    let targetId: string;
    if ("id" in input.target) targetId = input.target.id;
    else {
      const created = await api.addNode({ text: input.target.text, lang: input.target.lang, domain: edgeForm.domain ?? undefined });
      if (!created) return;
      targetId = created.id;
      if (langFilter.size && !langFilter.has(created.lang)) setLangFilter(new Set());
    }
    await api.addEdge({ source_id: edgeForm.id, target_id: targetId, relation: input.relation, weight: input.weight, note: input.note });
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
      await api.importGraph(data);
    } catch (err) {
      alert(`가져오기 실패: ${err instanceof Error ? err.message : String(err)}`);
    }
    setMenuOpen(false);
  }

  async function signOut() {
    await firebaseSignOut(getFirebaseAuth());
    router.replace("/login");
  }

  const toggleLang = (code: string) =>
    setLangFilter((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand"><span className="dot" />Nuance Graph</div>

        <div className="search">
          <span className="ico">⌕</span>
          <input
            ref={searchRef}
            className="input"
            placeholder="표현 검색 ( / )"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSearchOpen(true); }}
            onFocus={() => setSearchOpen(true)}
            onBlur={() => setTimeout(() => setSearchOpen(false), 150)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && results[0]) { select(results[0].id); setQuery(""); setSearchOpen(false); }
            }}
          />
          {searchOpen && results.length > 0 && (
            <div className="search-results">
              {results.map((n) => (
                <button key={n.id} onMouseDown={() => { select(n.id); setQuery(""); setSearchOpen(false); }}>
                  <span className="chip lang" style={{ background: langColor(n.lang) }}>{langLabel(n.lang)}</span>
                  <span>{n.preferred ? "★ " : ""}{n.text}</span>
                  {n.domain && <span className="hint">· {n.domain}</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", alignItems: "center" }}>
          {knownLangs.map((code) => {
            const on = langFilter.size === 0 || langFilter.has(code);
            return (
              <button
                key={code}
                className="chip lang"
                onClick={() => toggleLang(code)}
                title={`${langLabel(code)} 표시/숨김`}
                style={{ background: on ? langColor(code) : "var(--surface-2)", color: on ? "#fff" : "var(--text-3)", border: 0, cursor: "pointer", minHeight: 26 }}
              >
                {langLabel(code)}
              </button>
            );
          })}
          {knownDomains.length > 0 && (
            <select className="select" style={{ width: "auto", padding: "4px 8px", minHeight: 30, fontSize: 13 }} value={domainFilter} onChange={(e) => setDomainFilter(e.target.value)}>
              <option value="">모든 분야</option>
              {knownDomains.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          )}
        </div>

        <div style={{ marginLeft: "auto", display: "flex", gap: 6, alignItems: "center", position: "relative" }}>
          <button className="btn primary" onClick={() => setNodeForm({ mode: "new" })}>+ 표현</button>
          <button className="btn icon" onClick={() => setMenuOpen((v) => !v)} aria-label="메뉴">☰</button>
          {menuOpen && (
            <div className="search-results" style={{ left: "auto", right: 0, width: 260 }} onMouseLeave={() => setMenuOpen(false)}>
              <div className="hint" style={{ padding: "6px 10px" }}>{email}</div>
              <button onClick={() => { setFitTick((t) => t + 1); setMenuOpen(false); }}>전체 보기</button>
              <button onClick={downloadExport}>JSON으로 내보내기</button>
              <button onClick={() => fileRef.current?.click()}>JSON 가져오기</button>
              <button onClick={async () => { if (confirm("예시 그래프(감정·의료·법률)를 내 그래프에 추가할까요?")) { await api.importGraph(SEED); setFitTick((t) => t + 1); } setMenuOpen(false); }}>예시 그래프 추가</button>
              <button onClick={async () => { if (confirm("정말 내 그래프의 모든 표현과 연결을 삭제할까요? 되돌릴 수 없습니다.")) await api.clearAll(); setMenuOpen(false); }} style={{ color: "var(--danger)" }}>모두 삭제</button>
              <button onClick={signOut}>로그아웃</button>
            </div>
          )}
          <input ref={fileRef} type="file" accept="application/json" hidden onChange={handleImportFile} />
        </div>
      </header>

      <div className="main">
        <div style={{ position: "relative", minHeight: 0 }}>
          <GraphCanvas
            nodes={visibleNodes}
            edges={visibleEdges}
            selectedId={selectedId}
            focus={focus}
            fitTick={fitTick}
            onSelect={setSelectedId}
            onBackgroundDoubleClick={() => setNodeForm({ mode: "new" })}
          />
          <div className="legend">
            {RELATION_ORDER.filter((r) => r !== "narrower").map((r) => (
              <span key={r} className="chip" title={RELATIONS[r].hint}>
                <span className="swatch" style={{ background: RELATIONS[r].color }} />
                {r === "broader" ? "상위/하위" : RELATIONS[r].short}
              </span>
            ))}
          </div>
          {!loading && nodes.length > 0 && !selectedId && (
            <div className="canvas-hint">노드를 클릭해 연결과 뉘앙스를 보세요 · 빈 곳 더블클릭으로 새 표현</div>
          )}
          {loading && <div className="empty"><div className="card"><p className="muted">불러오는 중…</p></div></div>}
          {!loading && error && (
            <div className="empty">
              <div className="card">
                <h1>문제가 생겼습니다</h1>
                <p className="error" style={{ whiteSpace: "pre-wrap" }}>{error}</p>
                <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                  <button className="btn" onClick={api.reload}>다시 시도</button>
                  <button className="btn ghost" onClick={api.dismissError}>닫기</button>
                </div>
              </div>
            </div>
          )}
          {!loading && !error && nodes.length === 0 && (
            <div className="empty">
              <div className="card">
                <h1>표현 사이의 관계를 그려 보세요</h1>
                <p className="muted" style={{ margin: 0 }}>
                  단어를 외우는 대신, "사랑해"가 일본어에서는 愛してる보다 好き에 더 가깝다는 식의 관계와 뉘앙스를 선으로 잇고 가중치로 조정합니다.
                </p>
                <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
                  <button className="btn primary" onClick={async () => { await api.importGraph(SEED); setFitTick((t) => t + 1); }}>예시 그래프로 시작</button>
                  <button className="btn" onClick={() => setNodeForm({ mode: "new" })}>빈 그래프에서 시작</button>
                </div>
              </div>
            </div>
          )}
        </div>

        {selected ? (
          <NodePanel
            node={selected}
            nodes={nodes}
            edges={edges}
            examples={examples}
            api={api}
            aiEnabled={aiEnabled}
            onSelect={select}
            onEdit={() => setNodeForm({ mode: "edit", node: selected })}
            onAddEdge={() => setEdgeForm(selected)}
            onClose={() => setSelectedId(null)}
          />
        ) : (
          <aside className="panel hidden">
            <section>
              <h3>그래프</h3>
              <div className="muted small">
                표현 {nodes.length} · 연결 {edges.length} · 예문 {examples.length}
              </div>
            </section>
            <section>
              <h3>사용법</h3>
              <ul className="muted small" style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 4 }}>
                <li>노드를 클릭하면 오른쪽에 연결, 가중치, 예문이 보입니다.</li>
                <li>연결의 슬라이더는 "내가 느끼는 적합도"입니다. 사전이 아니라 내 감각으로 조정하세요.</li>
                <li>굵은 선 = 높은 적합도. 점선 = 유사·주의. 화살표 = 상위·하위 개념.</li>
                <li>실제 통역에서 어떤 대응을 썼다면 "사용 +1"을 눌러 두세요. 자주 쓰는 대응이 쌓입니다.</li>
                <li>위의 언어 칩으로 언어별 표시를 끄고 켤 수 있습니다.</li>
              </ul>
            </section>
          </aside>
        )}
      </div>

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
      {edgeForm && (
        <EdgeForm
          source={edgeForm}
          nodes={nodes}
          knownLangs={knownLangs.length ? knownLangs : ["ko", "en", "ja"]}
          onSubmit={handleEdgeSubmit}
          onClose={() => setEdgeForm(null)}
        />
      )}
    </div>
  );
}
