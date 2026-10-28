"use client";

import { forwardRef, useMemo, useState } from "react";
import type { GraphEdge, GraphNode } from "@/lib/types";
import { langColor, langLabel } from "@/lib/types";

interface Props {
  nodes: GraphNode[];
  /** 연결의 상황 태그로도 검색하려면 넘긴다 */
  edges?: GraphEdge[];
  onPick: (id: string) => void;
  large?: boolean;
  className?: string;
  placeholder?: string;
}

/** 표현명·메모·분야·상황을 검색해 상위 8개를 보여 주는 검색창 */
const SearchBox = forwardRef<HTMLInputElement, Props>(function SearchBox({ nodes, edges, onPick, large, className, placeholder }, ref) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const q = query.trim().toLowerCase();

  // 노드별 상황 태그 모음 (검색용)
  const situationsOf = useMemo(() => {
    const m = new Map<string, string>();
    for (const e of edges ?? []) {
      if (!e.situation) continue;
      const s = e.situation.toLowerCase();
      m.set(e.source_id, `${m.get(e.source_id) ?? ""} ${s}`);
      m.set(e.target_id, `${m.get(e.target_id) ?? ""} ${s}`);
    }
    return m;
  }, [edges]);

  const results = useMemo(() => {
    if (!q) return [];
    const scored = nodes
      .map((n) => {
        const text = n.text.toLowerCase();
        let score = 0;
        if (text === q) score = 100;
        else if (text.startsWith(q)) score = 80;
        else if (text.includes(q)) score = 60;
        else if ((n.note ?? "").toLowerCase().includes(q)) score = 30;
        else if ((situationsOf.get(n.id) ?? "").includes(q)) score = 25;
        else if ((n.domain ?? "").toLowerCase().includes(q)) score = 20;
        return { n, score };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score || a.n.text.length - b.n.text.length);
    return scored.slice(0, 8).map((x) => x.n);
  }, [nodes, q, situationsOf]);

  function pick(id: string) {
    onPick(id);
    setQuery("");
    setOpen(false);
    setActive(0);
  }

  return (
    <div className={`${large ? "spotlight" : "search"} ${className ?? ""}`}>
      <span className="ico">⌕</span>
      <input
        ref={ref}
        className="input"
        placeholder={placeholder ?? "표현, 메모, 분야 검색"}
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); setActive(0); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(results.length - 1, a + 1)); }
          if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
          if (e.key === "Enter" && results[active]) pick(results[active].id);
          if (e.key === "Escape") { setQuery(""); setOpen(false); (e.target as HTMLInputElement).blur(); }
        }}
      />
      {large && <span className="kbd">⌘K</span>}
      {open && results.length > 0 && (
        <div className="search-results">
          {results.map((n, i) => (
            <button key={n.id} className={i === active ? "active" : ""} onMouseDown={() => pick(n.id)} onMouseEnter={() => setActive(i)}>
              <span className="chip lang" style={{ background: langColor(n.lang) }}>{langLabel(n.lang)}</span>
              <span>{n.preferred ? "★ " : ""}{n.text}</span>
              {n.domain && <span className="hint">· {n.domain}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

export default SearchBox;
