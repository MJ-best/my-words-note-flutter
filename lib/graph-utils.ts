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

/** 언어별로 가중치가 가장 높은 대응 번역 (상황을 주면 그 상황의 연결만) */
export function bestByLang(
  nodes: Map<string, GraphNode>,
  edges: GraphEdge[],
  nodeId: string,
  situation: string | null = null,
): Array<{ lang: string; other: GraphNode; weight: number; situation: string | null }> {
  const m = new Map<string, { lang: string; other: GraphNode; weight: number; situation: string | null }>();
  for (const e of edges) {
    if (e.source_id !== nodeId && e.target_id !== nodeId) continue;
    if (relationFrom(e, nodeId) !== "equivalent") continue;
    if (situation && e.situation !== situation) continue;
    const other = nodes.get(otherEnd(e, nodeId));
    if (!other) continue;
    const cur = m.get(other.lang);
    if (!cur || e.weight > cur.weight) m.set(other.lang, { lang: other.lang, other, weight: e.weight, situation: e.situation });
  }
  return Array.from(m.values());
}

/**
 * 펼쳐진 노드 집합에서 보이는 서브그래프를 파생한다.
 * 보이는 노드 = 펼쳐진 노드 + 그 1촌 이웃. 보이는 연결 = 한쪽 끝이 펼쳐진 노드인 연결.
 */
export function subgraph(
  nodes: GraphNode[],
  edges: GraphEdge[],
  expanded: Iterable<string>,
): { nodes: GraphNode[]; edges: GraphEdge[]; ids: Set<string> } {
  const exp = new Set(expanded);
  if (exp.size === 0) return { nodes: [], edges: [], ids: new Set() };
  const ids = new Set<string>(exp);
  const vEdges: GraphEdge[] = [];
  for (const e of edges) {
    if (exp.has(e.source_id) || exp.has(e.target_id)) {
      ids.add(e.source_id);
      ids.add(e.target_id);
      vEdges.push(e);
    }
  }
  const byId = new Set(nodes.map((n) => n.id));
  for (const id of Array.from(ids)) if (!byId.has(id)) ids.delete(id);
  return {
    nodes: nodes.filter((n) => ids.has(n.id)),
    edges: vEdges.filter((e) => ids.has(e.source_id) && ids.has(e.target_id)),
    ids,
  };
}
