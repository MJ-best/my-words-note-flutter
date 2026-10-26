import type { GraphEdge, GraphNode, Relation } from "./types";
import { RELATIONS } from "./types";

/** 특정 노드의 입장에서 상대 노드가 어떤 관계인지 돌려준다 (broader/narrower는 방향이 뒤집힌다). */
export function relationFrom(edge: GraphEdge, nodeId: string): Relation {
  if (edge.source_id === nodeId || RELATIONS[edge.relation].symmetric) return edge.relation;
  if (edge.relation === "broader") return "narrower";
  if (edge.relation === "narrower") return "broader";
  return edge.relation;
}

export function otherEnd(edge: GraphEdge, nodeId: string): string {
  return edge.source_id === nodeId ? edge.target_id : edge.source_id;
}

export function edgesOf(edges: GraphEdge[], nodeId: string): GraphEdge[] {
  return edges.filter((e) => e.source_id === nodeId || e.target_id === nodeId);
}

export function degreeMap(edges: GraphEdge[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const e of edges) {
    m.set(e.source_id, (m.get(e.source_id) ?? 0) + 1);
    m.set(e.target_id, (m.get(e.target_id) ?? 0) + 1);
  }
  return m;
}

export function findNode(nodes: GraphNode[], text: string, lang: string): GraphNode | undefined {
  const t = text.trim().toLowerCase();
  return nodes.find((n) => n.lang === lang && n.text.trim().toLowerCase() === t);
}

/** 가중치(0..1)를 사람이 읽는 퍼센트로 */
export function pct(w: number): string {
  return `${Math.round(w * 100)}%`;
}

export function normalizeLang(input: string): string {
  return input.trim().toLowerCase().replace(/[^a-z-]/g, "").slice(0, 8) || "xx";
}
