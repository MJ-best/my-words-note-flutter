"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Example, GraphEdge, GraphNode } from "@/lib/types";
import { langColor, langLabel } from "@/lib/types";
import { bestByLang, pct } from "@/lib/graph-utils";
import SearchBox from "./SearchBox";

type Tab = "preferred" | "contrast" | "top" | "recent";

interface Props {
  nodes: GraphNode[];
  edges: GraphEdge[];
  examples: Example[];
  onOpen: (id: string) => void;
}

export default function Dashboard({ nodes, edges, examples, onOpen }: Props) {
  const searchRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<Tab>("preferred");

  // Cmd/Ctrl+K 또는 / 로 검색창 포커스
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const typing = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); searchRef.current?.focus(); }
      else if (e.key === "/" && !typing) { e.preventDefault(); searchRef.current?.focus(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const byId = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);

  const stats = useMemo(() => {
    const langs = new Map<string, number>();
    for (const n of nodes) langs.set(n.lang, (langs.get(n.lang) ?? 0) + 1);
    const uses = edges.reduce((s, e) => s + e.uses, 0);
    const contrastIds = new Set<string>();
    for (const e of edges) if (e.relation === "contrast") { contrastIds.add(e.source_id); contrastIds.add(e.target_id); }
    const focus = nodes.filter((n) => n.preferred || contrastIds.has(n.id)).length;
    return { langs: Array.from(langs.entries()).sort((a, b) => b[1] - a[1]), uses, focus, contrastIds };
  }, [nodes, edges]);

  const usesByNode = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of edges) {
      if (!e.uses) continue;
      m.set(e.source_id, (m.get(e.source_id) ?? 0) + e.uses);
      m.set(e.target_id, (m.get(e.target_id) ?? 0) + e.uses);
    }
    return m;
  }, [edges]);

  const list = useMemo(() => {
    switch (tab) {
      case "preferred":
        return nodes.filter((n) => n.preferred).sort((a, b) => b.updated_at.localeCompare(a.updated_at));
      case "contrast":
        return nodes.filter((n) => stats.contrastIds.has(n.id)).sort((a, b) => a.text.localeCompare(b.text));
      case "top":
        return nodes
          .filter((n) => (usesByNode.get(n.id) ?? 0) > 0)
          .sort((a, b) => (usesByNode.get(b.id) ?? 0) - (usesByNode.get(a.id) ?? 0))
          .slice(0, 12);
      case "recent":
        return [...nodes].sort((a, b) => b.updated_at.localeCompare(a.updated_at)).slice(0, 12);
    }
  }, [tab, nodes, stats.contrastIds, usesByNode]);

  const exampleOf = (id: string) => examples.find((x) => x.node_id === id);
  const degree = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of edges) { m.set(e.source_id, (m.get(e.source_id) ?? 0) + 1); m.set(e.target_id, (m.get(e.target_id) ?? 0) + 1); }
    return m;
  }, [edges]);

  const emptyText: Record<Tab, string> = {
    preferred: "패널에서 ☆ 선호 표현으로 표시한 표현이 여기에 모입니다.",
    contrast: "\"혼동 주의\" 관계로 연결된 표현이 여기에 모입니다.",
    top: "실제 통역에서 쓴 대응에 \"사용 +1\"을 누르면 자주 쓰는 표현이 여기에 쌓입니다.",
    recent: "아직 표현이 없습니다.",
  };

  return (
    <div className="dash">
      <SearchBox ref={searchRef} nodes={nodes} onPick={onOpen} large placeholder="표현, 메모, 분야 검색 — 선택하면 그 표현을 중심으로 그래프가 열립니다" />

      <div className="stats">
        <div className="stat">
          <span className="label">수집한 표현</span>
          <span className="value">{nodes.length}</span>
          <div className="bar" title={stats.langs.map(([l, c]) => `${langLabel(l)} ${c}`).join(" · ")}>
            {stats.langs.map(([l, c]) => (
              <span key={l} style={{ width: `${(c / Math.max(1, nodes.length)) * 100}%`, background: langColor(l) }} />
            ))}
          </div>
          <span className="sub">{stats.langs.slice(0, 4).map(([l, c]) => `${langLabel(l)} ${c}`).join(" · ")}</span>
        </div>
        <div className="stat">
          <span className="label">뉘앙스 연결</span>
          <span className="value">{edges.length}</span>
          <span className="sub">상황 태그 {edges.filter((e) => e.situation).length}개 · 혼동 주의 {edges.filter((e) => e.relation === "contrast").length}개</span>
        </div>
        <div className="stat">
          <span className="label">실전 사용 누적</span>
          <span className="value">{stats.uses}</span>
          <span className="sub">연결의 "사용 +1" 합계</span>
        </div>
        <div className="stat">
          <span className="label">집중 관리 표현</span>
          <span className="value">{stats.focus}</span>
          <span className="sub">★ 선호 또는 ⚠ 혼동 주의 보유</span>
        </div>
      </div>

      <div className="tabs" role="tablist">
        {([
          ["preferred", "★ 선호 표현"],
          ["contrast", "⚠ 혼동 주의"],
          ["top", "🔥 실전 다빈도"],
          ["recent", "🕒 최근 기록"],
        ] as [Tab, string][]).map(([t, label]) => (
          <button key={t} role="tab" className={tab === t ? "active" : ""} onClick={() => setTab(t)}>{label}</button>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="dash-empty">{emptyText[tab]}</div>
      ) : (
        <div className="cards">
          {list.map((n) => {
            const best = bestByLang(byId, edges, n.id).sort((a, b) => b.weight - a.weight).slice(0, 3);
            const ex = exampleOf(n.id);
            const uses = usesByNode.get(n.id) ?? 0;
            return (
              <button key={n.id} className="wcard" onClick={() => onOpen(n.id)}>
                <div className="head">
                  <span className="chip lang" style={{ background: langColor(n.lang) }}>{langLabel(n.lang)}</span>
                  {n.domain && <span className="chip">{n.domain}</span>}
                  {stats.contrastIds.has(n.id) && <span className="chip" style={{ color: "var(--danger)" }}>⚠ 주의</span>}
                </div>
                <div className="title">{n.preferred ? "★ " : ""}{n.text}</div>
                {best.length > 0 ? (
                  <div className="best">
                    {best.map((b) => (
                      <div key={b.lang}>
                        <span className="chip lang" style={{ background: langColor(b.lang) }}>{langLabel(b.lang)}</span>
                        <b>{b.other.text}</b>
                        <span className="hint">{pct(b.weight)}{b.situation ? ` · ${b.situation}` : ""}</span>
                      </div>
                    ))}
                  </div>
                ) : n.note ? (
                  <div className="ex" style={{ borderLeftColor: langColor(n.lang) }}>{n.note}</div>
                ) : null}
                {ex && <div className="ex">{ex.text}</div>}
                <div className="meta">
                  <span>연결 {degree.get(n.id) ?? 0}</span>
                  {uses > 0 && <span>사용 {uses}</span>}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
