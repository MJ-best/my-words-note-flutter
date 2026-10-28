"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { GraphApi } from "@/lib/useGraph";
import type { GraphNode } from "@/lib/types";
import { RELATIONS, RELATION_ORDER, langColor, langLabel } from "@/lib/types";
import { subgraph } from "@/lib/graph-utils";
import GraphCanvas from "./GraphCanvas";
import NodePanel from "./NodePanel";

const MAX_VISIBLE = 40;
const ALL_WARN = 150;

interface Props {
  api: GraphApi;
  centerId: string | null;
  selectedId: string | null;
  aiEnabled: boolean;
  onSelect: (id: string | null) => void;
  onCenter: (id: string) => void;
  onEditNode: (node: GraphNode) => void;
  onAddEdge: (node: GraphNode) => void;
  onNewNode: () => void;
  onToast: (msg: string) => void;
}

export default function GraphExplorer({ api, centerId, selectedId, aiEnabled, onSelect, onCenter, onEditNode, onAddEdge, onNewNode, onToast }: Props) {
  const { nodes, edges, examples } = api;
  const [mode, setMode] = useState<"focus" | "all">(centerId ? "focus" : "all");
  const [expanded, setExpanded] = useState<string[]>(centerId ? [centerId] : []);
  const [crumbs, setCrumbs] = useState<string[]>(centerId ? [centerId] : []);
  const [langFilter, setLangFilter] = useState<Set<string>>(new Set());
  const [domainFilter, setDomainFilter] = useState("");
  const [focus, setFocus] = useState<{ id: string; tick: number } | null>(null);
  const [fitTick, setFitTick] = useState(0);
  const prevCenter = useRef<string | null>(null);

  const byId = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);
  const knownLangs = useMemo(() => Array.from(new Set(nodes.map((n) => n.lang))).sort(), [nodes]);
  const knownDomains = useMemo(() => Array.from(new Set(nodes.map((n) => n.domain).filter((d): d is string => Boolean(d)))).sort(), [nodes]);

  // 중심 노드가 바뀌면: 펼침 상태를 초기화하고 브레드크럼을 갱신
  useEffect(() => {
    if (!centerId || centerId === prevCenter.current) return;
    prevCenter.current = centerId;
    if (!byId.has(centerId)) return;
    setMode("focus");
    setExpanded([centerId]);
    setCrumbs((prev) => {
      const i = prev.indexOf(centerId);
      const next = i >= 0 ? prev.slice(0, i + 1) : [...prev, centerId].slice(-8);
      return next;
    });
    onSelect(centerId);
    setFocus((f) => ({ id: centerId, tick: (f?.tick ?? 0) + 1 }));
  }, [centerId, byId, onSelect]);

  // 언어·분야 필터 (두 모드 공통)
  const passes = useCallback(
    (n: GraphNode) => (langFilter.size === 0 || langFilter.has(n.lang)) && (!domainFilter || n.domain === domainFilter),
    [langFilter, domainFilter],
  );

  const view = useMemo(() => {
    if (mode === "all") {
      const vn = nodes.filter(passes);
      const ids = new Set(vn.map((n) => n.id));
      return { nodes: vn, edges: edges.filter((e) => ids.has(e.source_id) && ids.has(e.target_id)), ids, badges: {} as Record<string, "+" | "-"> };
    }
    const sg = subgraph(nodes, edges, expanded);
    const vn = sg.nodes.filter((n) => passes(n) || expanded.includes(n.id));
    const ids = new Set(vn.map((n) => n.id));
    const ve = sg.edges.filter((e) => ids.has(e.source_id) && ids.has(e.target_id));
    // 배지: 숨은 이웃이 있으면 "+", 펼쳐진 노드(중심 제외)는 "-"
    const hiddenNeighbors = new Map<string, number>();
    for (const e of edges) {
      if (ids.has(e.source_id) && !ids.has(e.target_id)) hiddenNeighbors.set(e.source_id, (hiddenNeighbors.get(e.source_id) ?? 0) + 1);
      if (ids.has(e.target_id) && !ids.has(e.source_id)) hiddenNeighbors.set(e.target_id, (hiddenNeighbors.get(e.target_id) ?? 0) + 1);
    }
    const badges: Record<string, "+" | "-"> = {};
    for (const n of vn) {
      if (expanded.includes(n.id)) {
        if (n.id !== centerId) badges[n.id] = "-";
      } else if ((hiddenNeighbors.get(n.id) ?? 0) > 0) badges[n.id] = "+";
    }
    return { nodes: vn, edges: ve, ids, badges };
  }, [mode, nodes, edges, expanded, passes, centerId]);

  const toggleExpand = useCallback(
    (id: string) => {
      if (mode === "all") return;
      setExpanded((prev) => {
        if (prev.includes(id)) {
          if (id === centerId) return prev;
          return prev.filter((x) => x !== id);
        }
        let next = [...prev, id];
        // 40개 상한: 경로(중심·브레드크럼)와 방금 펼친 노드는 제외하고 가장 오래된 것부터 접는다
        const protectedIds = new Set([centerId, id, ...crumbs]);
        while (subgraph(nodes, edges, next).ids.size > MAX_VISIBLE) {
          const victim = next.find((x) => !protectedIds.has(x));
          if (!victim) {
            onToast(`한 번에 ${MAX_VISIBLE}개까지만 펼칩니다. 다른 가지를 접거나 이 표현을 중심으로 다시 여세요.`);
            break;
          }
          next = next.filter((x) => x !== victim);
        }
        return next;
      });
      onSelect(id);
    },
    [mode, centerId, crumbs, nodes, edges, onSelect, onToast],
  );

  // 패널에서 이웃을 고르면: 보이지 않는 노드면 현재 선택을 펼쳐서 보이게 한 뒤 선택
  const selectFromPanel = useCallback(
    (id: string) => {
      if (mode === "focus" && !view.ids.has(id) && selectedId && !expanded.includes(selectedId)) {
        setExpanded((prev) => [...prev, selectedId]);
      }
      onSelect(id);
      setFocus((f) => ({ id, tick: (f?.tick ?? 0) + 1 }));
    },
    [mode, view.ids, selectedId, expanded, onSelect],
  );

  const selected = selectedId ? byId.get(selectedId) ?? null : null;
  const toggleLang = (code: string) =>
    setLangFilter((prev) => { const next = new Set(prev); if (next.has(code)) next.delete(code); else next.add(code); return next; });

  return (
    <div className="main">
      <div style={{ position: "relative", minHeight: 0 }}>
        <GraphCanvas
          nodes={view.nodes}
          edges={view.edges}
          selectedId={selectedId}
          focus={focus}
          fitTick={fitTick}
          onSelect={onSelect}
          onBackgroundDoubleClick={onNewNode}
          badges={mode === "focus" ? view.badges : undefined}
          onToggleExpand={mode === "focus" ? toggleExpand : undefined}
        />

        <div className="explorer-bar">
          {mode === "focus" && crumbs.length > 0 && (
            <div className="crumbs" aria-label="탐색 경로">
              {crumbs.map((id, i) => {
                const n = byId.get(id);
                if (!n) return null;
                const current = id === centerId;
                return (
                  <span key={id} style={{ display: "contents" }}>
                    {i > 0 && <span className="sep">›</span>}
                    <button className={current ? "current" : ""} onClick={() => !current && onCenter(id)} title={n.text}>
                      {n.text.length > 14 ? n.text.slice(0, 13) + "…" : n.text}
                    </button>
                  </span>
                );
              })}
            </div>
          )}
          <div className="nav" style={{ padding: 2 }}>
            <button className={mode === "focus" ? "active" : ""} onClick={() => { if (centerId) setMode("focus"); else onToast("대시보드나 검색에서 표현을 하나 고르면 그 표현을 중심으로 펼칩니다."); }} style={{ minHeight: 28, padding: "4px 10px", fontSize: 12.5 }}>가지 보기</button>
            <button className={mode === "all" ? "active" : ""} onClick={() => { setMode("all"); setFitTick((t) => t + 1); }} style={{ minHeight: 28, padding: "4px 10px", fontSize: 12.5 }}>전체 보기</button>
          </div>
          <div className="filters" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 999, padding: "3px 6px", margin: 0 }}>
            {knownLangs.map((code) => {
              const on = langFilter.size === 0 || langFilter.has(code);
              return (
                <button key={code} className="chip lang" onClick={() => toggleLang(code)} title={`${langLabel(code)} 표시/숨김`}
                  style={{ background: on ? langColor(code) : "var(--surface-2)", color: on ? "#fff" : "var(--text-3)", border: 0, cursor: "pointer", minHeight: 24 }}>
                  {langLabel(code)}
                </button>
              );
            })}
            {knownDomains.length > 0 && (
              <select className="select" style={{ width: "auto", padding: "2px 6px", minHeight: 24, fontSize: 12.5, borderRadius: 999 }} value={domainFilter} onChange={(e) => setDomainFilter(e.target.value)}>
                <option value="">모든 분야</option>
                {knownDomains.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            )}
          </div>
        </div>

        <div className="legend">
          {RELATION_ORDER.filter((r) => r !== "narrower").map((r) => (
            <span key={r} className="chip" title={RELATIONS[r].hint}>
              <span className="swatch" style={{ background: RELATIONS[r].color }} />
              {r === "broader" ? "상위/하위" : RELATIONS[r].short}
            </span>
          ))}
        </div>

        {mode === "focus" && view.nodes.length > 0 && !selectedId && (
          <div className="explorer-note">노드의 + 를 누르거나 더블클릭하면 가지가 펼쳐집니다 · 표시 중 {view.nodes.length}개</div>
        )}
        {mode === "all" && view.nodes.length > ALL_WARN && (
          <div className="explorer-note">노드 {view.nodes.length}개 · 언어·분야 필터로 줄이거나 표현을 골라 "가지 보기"로 보세요</div>
        )}
        {mode === "focus" && view.nodes.length === 0 && (
          <div className="empty">
            <div className="card">
              <p className="muted" style={{ margin: 0 }}>대시보드나 검색에서 표현을 고르면 그 표현과 1촌 이웃부터 보여 줍니다.</p>
              <button className="btn" onClick={() => { setMode("all"); setFitTick((t) => t + 1); }}>전체 보기</button>
            </div>
          </div>
        )}
        {!selected && (
          <button className="fab mobile-only" onClick={onNewNode} aria-label="새 표현">＋</button>
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
          onSelect={selectFromPanel}
          onEdit={() => onEditNode(selected)}
          onAddEdge={() => onAddEdge(selected)}
          onClose={() => onSelect(null)}
          onCenter={() => onCenter(selected.id)}
          isCenter={mode === "focus" && selected.id === centerId}
        />
      ) : (
        <aside className="panel hidden">
          <section>
            <h3>그래프</h3>
            <div className="muted small">표시 중 {view.nodes.length} / 전체 표현 {nodes.length} · 연결 {edges.length}</div>
          </section>
          <section>
            <h3>사용법</h3>
            <ul className="muted small" style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 4 }}>
              <li>노드를 클릭하면 연결, 가중치, 예문이 보입니다.</li>
              <li>노드의 <b>+</b> 배지(또는 더블클릭)로 가지를 펼치고, <b>–</b> 로 접습니다. 한 번에 {MAX_VISIBLE}개까지 보입니다.</li>
              <li>패널의 "◎ 중심으로"를 누르면 그 표현을 중심으로 다시 시작하고 위의 경로에 쌓입니다.</li>
              <li>굵은 선 = 높은 적합도. 점선 = 유사·주의. 화살표 = 상위·하위 개념.</li>
              <li>단축키: / 검색, n 새 표현, Esc 닫기.</li>
            </ul>
          </section>
        </aside>
      )}
    </div>
  );
}
