"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
  type Simulation,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from "d3-force";
import { select } from "d3-selection";
import { zoom, zoomIdentity, type D3ZoomEvent, type ZoomBehavior, type ZoomTransform } from "d3-zoom";
import { drag, type D3DragEvent } from "d3-drag";
import type { GraphEdge, GraphNode } from "@/lib/types";
import { RELATIONS, langColor } from "@/lib/types";
import { pct } from "@/lib/graph-utils";

interface SimNode extends SimulationNodeDatum {
  id: string;
  node: GraphNode;
  w: number; // pill width
  h: number; // pill height
  label: string;
}
interface SimLink extends SimulationLinkDatum<SimNode> {
  id: string;
  edge: GraphEdge;
}

interface Props {
  nodes: GraphNode[];
  edges: GraphEdge[];
  selectedId: string | null;
  /** 바뀔 때마다 해당 노드로 화면을 이동 */
  focus: { id: string; tick: number } | null;
  /** 바뀔 때마다 전체 보기 */
  fitTick: number;
  onSelect: (id: string | null) => void;
  onBackgroundDoubleClick?: () => void;
}

const FONT_FAMILY =
  '"Pretendard", -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Noto Sans KR", "Hiragino Sans", "Noto Sans JP", "Segoe UI", Roboto, sans-serif';
const NODE_FONT = `600 13px ${FONT_FAMILY}`;
const LABEL_FONT = `600 11px ${FONT_FAMILY}`;
const PILL_H = 28;

function truncate(text: string, max = 26): string {
  const t = text.replace(/\s+/g, " ").trim();
  return t.length > max ? t.slice(0, max - 1) + "…" : t;
}

export default function GraphCanvas({
  nodes,
  edges,
  selectedId,
  focus,
  fitTick,
  onSelect,
  onBackgroundDoubleClick,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const simRef = useRef<Simulation<SimNode, SimLink> | null>(null);
  const simNodesRef = useRef<SimNode[]>([]);
  const simLinksRef = useRef<SimLink[]>([]);
  const transformRef = useRef<ZoomTransform>(zoomIdentity);
  const zoomRef = useRef<ZoomBehavior<HTMLCanvasElement, unknown> | null>(null);
  const selectedRef = useRef<string | null>(selectedId);
  const hoverRef = useRef<string | null>(null);
  const draggingRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const animRef = useRef<number | null>(null);
  const themeRef = useRef({ text: "#1f2a44", surface: "#fffcf4", accent: "#e0a63a", bg: "#f4efe2", muted: "#8a90a3" });
  const onSelectRef = useRef(onSelect);
  const onDblRef = useRef(onBackgroundDoubleClick);
  onSelectRef.current = onSelect;
  onDblRef.current = onBackgroundDoubleClick;
  selectedRef.current = selectedId;

  // ---------- 그리기 ----------
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = wrap.clientWidth;
    const height = wrap.clientHeight;
    if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
    }

    const t = transformRef.current;
    const theme = themeRef.current;
    const sel = selectedRef.current;
    const hov = hoverRef.current;
    const simNodes = simNodesRef.current;
    const simLinks = simLinksRef.current;

    // 강조 집합
    const focusId = sel ?? hov;
    const neighbors = new Set<string>();
    if (focusId) {
      neighbors.add(focusId);
      for (const l of simLinks) {
        const s = (l.source as SimNode).id;
        const d = (l.target as SimNode).id;
        if (s === focusId) neighbors.add(d);
        if (d === focusId) neighbors.add(s);
      }
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.translate(t.x, t.y);
    ctx.scale(t.k, t.k);

    // ----- 엣지 -----
    ctx.lineCap = "round";
    for (const l of simLinks) {
      const s = l.source as SimNode;
      const d = l.target as SimNode;
      if (s.x == null || s.y == null || d.x == null || d.y == null) continue;
      const rel = RELATIONS[l.edge.relation];
      const touches = focusId ? s.id === focusId || d.id === focusId : false;
      const alpha = focusId ? (touches ? 1 : 0.12) : 0.75;
      const w = 1 + l.edge.weight * 4;

      ctx.globalAlpha = alpha;
      ctx.strokeStyle = rel.color;
      ctx.lineWidth = w;
      if (l.edge.relation === "similar") ctx.setLineDash([7, 5]);
      else if (l.edge.relation === "contrast") ctx.setLineDash([2, 5]);
      else if (l.edge.relation === "collocation") ctx.setLineDash([1, 4]);
      else ctx.setLineDash([]);

      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(d.x, d.y);
      ctx.stroke();
      ctx.setLineDash([]);

      // 방향이 있는 관계는 화살표
      if (l.edge.relation === "broader" || l.edge.relation === "narrower") {
        const p = edgePoint(d, s);
        const ang = Math.atan2(d.y - s.y, d.x - s.x);
        const size = 7 + w;
        ctx.fillStyle = rel.color;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - size * Math.cos(ang - 0.45), p.y - size * Math.sin(ang - 0.45));
        ctx.lineTo(p.x - size * Math.cos(ang + 0.45), p.y - size * Math.sin(ang + 0.45));
        ctx.closePath();
        ctx.fill();
      }

      // 선택된 노드에 닿은 엣지만 라벨 표시
      if (touches && t.k > 0.45) {
        const mx = (s.x + d.x) / 2;
        const my = (s.y + d.y) / 2;
        const sit = l.edge.situation ? ` · ${l.edge.situation.length > 7 ? l.edge.situation.slice(0, 6) + "…" : l.edge.situation}` : "";
        const label = `${rel.short}${sit} ${pct(l.edge.weight)}`;
        ctx.font = LABEL_FONT;
        const tw = ctx.measureText(label).width;
        // 두 노드 사이가 좁으면 라벨이 노드를 가리므로 생략
        const len = Math.hypot(d.x - s.x, d.y - s.y);
        if (len < (s.w + d.w) / 2 + tw + 16) continue;
        ctx.globalAlpha = 1;
        ctx.fillStyle = theme.surface;
        roundRect(ctx, mx - tw / 2 - 6, my - 9, tw + 12, 18, 9);
        ctx.fill();
        ctx.strokeStyle = rel.color;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = rel.color;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(label, mx, my + 0.5);
      }
    }

    // ----- 노드 -----
    ctx.font = NODE_FONT;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const ordered = sel ? [...simNodes.filter((n) => n.id !== sel), ...simNodes.filter((n) => n.id === sel)] : simNodes;
    for (const n of ordered) {
      if (n.x == null || n.y == null) continue;
      const color = langColor(n.node.lang);
      const dim = focusId ? !neighbors.has(n.id) : false;
      ctx.globalAlpha = dim ? 0.18 : 1;

      const x = n.x - n.w / 2;
      const y = n.y - n.h / 2;

      if (n.id === sel) {
        ctx.fillStyle = theme.accent;
        ctx.globalAlpha = 0.9;
        roundRect(ctx, x - 5, y - 5, n.w + 10, n.h + 10, (n.h + 10) / 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      ctx.fillStyle = color;
      roundRect(ctx, x, y, n.w, n.h, n.h / 2);
      ctx.fill();
      if (n.id === sel || n.id === hov) {
        ctx.strokeStyle = theme.surface;
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }
      ctx.fillStyle = "#fff";
      ctx.font = NODE_FONT;
      ctx.fillText(n.label, n.x, n.y + 0.5);
    }
    ctx.globalAlpha = 1;
  }, []);

  const requestDraw = useCallback(() => {
    if (rafRef.current != null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      draw();
    });
  }, [draw]);

  // ---------- 좌표 변환 / 히트 테스트 ----------
  const hitTest = useCallback((clientX: number, clientY: number): SimNode | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const t = transformRef.current;
    const x = (clientX - rect.left - t.x) / t.k;
    const y = (clientY - rect.top - t.y) / t.k;
    const list = simNodesRef.current;
    for (let i = list.length - 1; i >= 0; i--) {
      const n = list[i];
      if (n.x == null || n.y == null) continue;
      if (Math.abs(x - n.x) <= n.w / 2 + 2 && Math.abs(y - n.y) <= n.h / 2 + 2) return n;
    }
    return null;
  }, []);

  const animateTo = useCallback(
    (target: ZoomTransform, ms = 380) => {
      const canvas = canvasRef.current;
      const z = zoomRef.current;
      if (!canvas || !z) return;
      if (animRef.current) cancelAnimationFrame(animRef.current);
      const from = transformRef.current;
      const start = performance.now();
      const sel = select(canvas);
      const step = (now: number) => {
        const p = Math.min(1, (now - start) / ms);
        const e = 1 - Math.pow(1 - p, 3);
        const k = from.k + (target.k - from.k) * e;
        const x = from.x + (target.x - from.x) * e;
        const y = from.y + (target.y - from.y) * e;
        z.transform(sel, zoomIdentity.translate(x, y).scale(k));
        if (p < 1) animRef.current = requestAnimationFrame(step);
        else animRef.current = null;
      };
      animRef.current = requestAnimationFrame(step);
    },
    [],
  );

  const fitAll = useCallback(() => {
    const wrap = wrapRef.current;
    const list = simNodesRef.current.filter((n) => n.x != null && n.y != null);
    if (!wrap || list.length === 0) return;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const n of list) {
      minX = Math.min(minX, n.x! - n.w / 2);
      maxX = Math.max(maxX, n.x! + n.w / 2);
      minY = Math.min(minY, n.y! - n.h / 2);
      maxY = Math.max(maxY, n.y! + n.h / 2);
    }
    const w = wrap.clientWidth, h = wrap.clientHeight;
    const bw = Math.max(1, maxX - minX), bh = Math.max(1, maxY - minY);
    const k = Math.max(0.2, Math.min(2.2, 0.85 / Math.max(bw / w, bh / h)));
    const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
    animateTo(zoomIdentity.translate(w / 2 - cx * k, h / 2 - cy * k).scale(k));
  }, [animateTo]);

  // ---------- 초기화: 시뮬레이션, 줌, 드래그 ----------
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const readTheme = () => {
      const cs = getComputedStyle(document.documentElement);
      themeRef.current = {
        text: cs.getPropertyValue("--text").trim() || "#15181e",
        surface: cs.getPropertyValue("--surface").trim() || "#fff",
        accent: cs.getPropertyValue("--highlight").trim() || "#e0a63a",
        bg: cs.getPropertyValue("--bg").trim() || "#f6f7f9",
        muted: cs.getPropertyValue("--text-3").trim() || "#8b93a1",
      };
    };
    readTheme();
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onTheme = () => { readTheme(); requestDraw(); };
    mq.addEventListener("change", onTheme);

    const sim = forceSimulation<SimNode, SimLink>([])
      .force(
        "link",
        forceLink<SimNode, SimLink>([])
          .id((d) => d.id)
          .distance((l) => 70 + (1 - l.edge.weight) * 90 + ((l.source as SimNode).w + (l.target as SimNode).w) / 4)
          .strength((l) => 0.25 + l.edge.weight * 0.55),
      )
      .force("charge", forceManyBody<SimNode>().strength(-320).distanceMax(600))
      .force("collide", forceCollide<SimNode>().radius((d) => d.w / 2 + 12).iterations(2))
      .force("center", forceCenter(wrap.clientWidth / 2, wrap.clientHeight / 2))
      .force("x", forceX<SimNode>(wrap.clientWidth / 2).strength(0.03))
      .force("y", forceY<SimNode>(wrap.clientHeight / 2).strength(0.03))
      .on("tick", requestDraw);
    simRef.current = sim;

    const z = zoom<HTMLCanvasElement, unknown>()
      .scaleExtent([0.15, 4])
      .filter((event: Event & { type: string; button?: number; ctrlKey?: boolean }) => {
        if (event.type === "wheel") return true;
        if ((event as MouseEvent).button) return false;
        const me = event as MouseEvent & TouchEvent;
        const pt = me.touches?.[0] ?? me;
        // 노드 위에서는 드래그가, 빈 곳에서는 팬이 동작
        return !hitTest(pt.clientX, pt.clientY);
      })
      .on("zoom", (event: D3ZoomEvent<HTMLCanvasElement, unknown>) => {
        transformRef.current = event.transform;
        requestDraw();
      });
    zoomRef.current = z;

    const d = drag<HTMLCanvasElement, unknown, SimNode>()
      .container(canvas)
      .subject((event: D3DragEvent<HTMLCanvasElement, unknown, SimNode>) => {
        const se = event.sourceEvent as MouseEvent & TouchEvent;
        const pt = se.touches?.[0] ?? se;
        // undefined를 돌려주면 d3-drag가 드래그를 시작하지 않는다 (타입 정의가 이를 허용하지 않아 캐스팅)
        return (hitTest(pt.clientX, pt.clientY) ?? undefined) as unknown as SimNode;
      })
      .on("start", (event) => {
        draggingRef.current = true;
        const n = event.subject;
        n.fx = n.x;
        n.fy = n.y;
        sim.alphaTarget(0.25).restart();
      })
      .on("drag", (event) => {
        const n = event.subject;
        const t = transformRef.current;
        n.fx = (n.fx ?? 0) + event.dx / t.k;
        n.fy = (n.fy ?? 0) + event.dy / t.k;
      })
      .on("end", (event) => {
        draggingRef.current = false;
        const n = event.subject;
        n.fx = null;
        n.fy = null;
        sim.alphaTarget(0);
      });

    const sel = select(canvas);
    sel.call(d).call(z).on("dblclick.zoom", null);

    const onMove = (e: PointerEvent) => {
      if (draggingRef.current) return;
      const hit = hitTest(e.clientX, e.clientY);
      const id = hit?.id ?? null;
      canvas.style.cursor = hit ? "pointer" : "grab";
      if (id !== hoverRef.current) {
        hoverRef.current = id;
        requestDraw();
      }
    };
    const onLeave = () => {
      if (hoverRef.current) {
        hoverRef.current = null;
        requestDraw();
      }
    };
    const onClick = (e: MouseEvent) => {
      const hit = hitTest(e.clientX, e.clientY);
      onSelectRef.current(hit ? hit.id : null);
    };
    const onDbl = (e: MouseEvent) => {
      if (!hitTest(e.clientX, e.clientY)) onDblRef.current?.();
    };
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerleave", onLeave);
    canvas.addEventListener("click", onClick);
    canvas.addEventListener("dblclick", onDbl);

    const ro = new ResizeObserver(() => {
      const w = wrap.clientWidth, h = wrap.clientHeight;
      (sim.force("center") as ReturnType<typeof forceCenter>).x(w / 2).y(h / 2);
      (sim.force("x") as ReturnType<typeof forceX<SimNode>>).x(w / 2);
      (sim.force("y") as ReturnType<typeof forceY<SimNode>>).y(h / 2);
      requestDraw();
    });
    ro.observe(wrap);

    return () => {
      mq.removeEventListener("change", onTheme);
      sim.stop();
      ro.disconnect();
      sel.on(".zoom", null).on(".drag", null);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
      canvas.removeEventListener("click", onClick);
      canvas.removeEventListener("dblclick", onDbl);
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      if (animRef.current != null) cancelAnimationFrame(animRef.current);
      // StrictMode 이중 마운트 때 취소된 핸들이 남아 requestDraw가 막히지 않도록 반드시 비운다
      rafRef.current = null;
      animRef.current = null;
    };
  }, [hitTest, requestDraw]);

  // ---------- 데이터 → 시뮬레이션 반영 ----------
  useEffect(() => {
    const sim = simRef.current;
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!sim || !canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.font = NODE_FONT;

    const prev = new Map(simNodesRef.current.map((n) => [n.id, n]));
    const byId = new Map<string, SimNode>();
    const cx = wrap.clientWidth / 2, cy = wrap.clientHeight / 2;
    const isFirst = prev.size === 0;

    const simNodes: SimNode[] = nodes.map((node) => {
      const label = (node.preferred ? "★ " : "") + truncate(node.text);
      const w = Math.max(44, ctx.measureText(label).width + 22);
      const old = prev.get(node.id);
      const sn: SimNode = old
        ? Object.assign(old, { node, label, w, h: PILL_H })
        : { id: node.id, node, label, w, h: PILL_H, x: undefined, y: undefined };
      byId.set(node.id, sn);
      return sn;
    });

    // 새 노드는 연결된 이웃 근처(없으면 중앙 근처)에서 시작
    for (const sn of simNodes) {
      if (sn.x != null && sn.y != null) continue;
      const e = edges.find((ed) => ed.source_id === sn.id || ed.target_id === sn.id);
      const other = e ? byId.get(e.source_id === sn.id ? e.target_id : e.source_id) : undefined;
      const bx = other?.x ?? cx, by = other?.y ?? cy;
      const spread = isFirst ? 220 : 60;
      sn.x = bx + (Math.random() - 0.5) * spread;
      sn.y = by + (Math.random() - 0.5) * spread;
    }

    const simLinks: SimLink[] = edges
      .filter((e) => byId.has(e.source_id) && byId.has(e.target_id))
      .map((e) => ({ id: e.id, edge: e, source: byId.get(e.source_id)!, target: byId.get(e.target_id)! }));

    simNodesRef.current = simNodes;
    simLinksRef.current = simLinks;
    sim.nodes(simNodes);
    (sim.force("link") as ReturnType<typeof forceLink<SimNode, SimLink>>).links(simLinks);
    sim.alpha(isFirst ? 1 : 0.5).restart();

    if (isFirst && simNodes.length) {
      // 레이아웃이 어느 정도 안정된 뒤 전체 보기
      const timer = setTimeout(fitAll, 700);
      return () => clearTimeout(timer);
    }
    requestDraw();
  }, [nodes, edges, requestDraw, fitAll]);

  // 선택이 바뀌면 다시 그림
  useEffect(() => {
    requestDraw();
  }, [selectedId, requestDraw]);

  // 포커스 이동
  useEffect(() => {
    if (!focus) return;
    const wrap = wrapRef.current;
    const n = simNodesRef.current.find((s) => s.id === focus.id);
    if (!wrap || !n || n.x == null || n.y == null) return;
    const k = Math.max(transformRef.current.k, 1.3);
    // 모바일에서는 아래쪽 70%를 패널이 덮으므로 위쪽 영역의 가운데로 맞춘다
    const mobile = window.matchMedia("(max-width: 860px)").matches;
    const cy = wrap.clientHeight * (mobile ? 0.15 : 0.5);
    animateTo(zoomIdentity.translate(wrap.clientWidth / 2 - n.x * k, cy - n.y * k).scale(k));
  }, [focus, animateTo]);

  // 전체 보기
  const fitRef = useRef(fitTick);
  useEffect(() => {
    if (fitRef.current !== fitTick) {
      fitRef.current = fitTick;
      fitAll();
    }
  }, [fitTick, fitAll]);

  const zoomBy = (factor: number) => {
    const canvas = canvasRef.current, z = zoomRef.current;
    if (!canvas || !z) return;
    const wrap = wrapRef.current!;
    const t = transformRef.current;
    const cx = wrap.clientWidth / 2, cy = wrap.clientHeight / 2;
    const k = Math.max(0.15, Math.min(4, t.k * factor));
    const x = cx - ((cx - t.x) / t.k) * k;
    const y = cy - ((cy - t.y) / t.k) * k;
    animateTo(zoomIdentity.translate(x, y).scale(k), 200);
  };

  return (
    <div className="canvas-wrap" ref={wrapRef}>
      <canvas ref={canvasRef} aria-label="표현 관계 그래프" />
      <div className="canvas-tools">
        <button className="btn icon" title="확대" onClick={() => zoomBy(1.4)}>＋</button>
        <button className="btn icon" title="축소" onClick={() => zoomBy(1 / 1.4)}>－</button>
        <button className="btn icon" title="전체 보기" onClick={fitAll}>⤢</button>
      </div>
    </div>
  );
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

/** 사각형 노드 target의 경계에서, source 방향으로 선이 나가는 점 */
function edgePoint(target: SimNode, source: SimNode) {
  const dx = source.x! - target.x!, dy = source.y! - target.y!;
  const hw = target.w / 2 + 2, hh = target.h / 2 + 2;
  if (dx === 0 && dy === 0) return { x: target.x!, y: target.y! };
  const t = Math.min(dx !== 0 ? Math.abs(hw / dx) : Infinity, dy !== 0 ? Math.abs(hh / dy) : Infinity);
  return { x: target.x! + dx * t, y: target.y! + dy * t };
}
