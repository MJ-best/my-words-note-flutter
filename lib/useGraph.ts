"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  writeBatch,
  type CollectionReference,
  type DocumentData,
} from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import type {
  EdgeInput,
  Example,
  ExampleInput,
  GraphEdge,
  GraphNode,
  NodeInput,
} from "@/lib/types";

export interface ImportData {
  nodes: Array<Partial<GraphNode> & { id: string; text: string; lang: string }>;
  edges: Array<Partial<GraphEdge> & { source_id: string; target_id: string; relation: GraphEdge["relation"] }>;
  examples?: Array<Partial<Example> & { node_id: string; text: string }>;
}

export interface GraphExport {
  version: 2;
  exported_at: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  examples: Example[];
}

const BATCH_LIMIT = 450; // Firestore 배치 한도 500보다 여유 있게

function now() {
  return new Date().toISOString();
}

/** Firestore 문서에는 id를 넣지 않고, 읽을 때 doc.id로 채운다 */
function strip<T extends { id: string }>(row: T): Omit<T, "id"> {
  const { id: _id, ...rest } = row;
  void _id;
  return rest;
}

export function useGraph(userId: string) {
  const db = useMemo(() => getDb(), []);
  const cols = useMemo(
    () => ({
      nodes: collection(db, "users", userId, "nodes") as CollectionReference<DocumentData>,
      edges: collection(db, "users", userId, "edges") as CollectionReference<DocumentData>,
      examples: collection(db, "users", userId, "examples") as CollectionReference<DocumentData>,
    }),
    [db, userId],
  );

  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [examples, setExamples] = useState<Example[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const weightTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const fail = useCallback((e: unknown) => {
    const msg = e instanceof Error ? e.message : String(e);
    if (/permission-denied|Missing or insufficient permissions/i.test(msg)) {
      setError(
        "Firestore 접근이 거부되었습니다. Firebase 콘솔 → Firestore → 규칙에 firestore.rules 내용을 붙여 넣고 게시했는지 확인하세요.",
      );
    } else if (/unavailable|offline|network/i.test(msg)) {
      setError("네트워크에 연결할 수 없습니다. 잠시 후 다시 시도하세요.");
    } else setError(msg);
    console.error(e);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [n, e, x] = await Promise.all([getDocs(cols.nodes), getDocs(cols.edges), getDocs(cols.examples)]);
      const byCreated = <T extends { created_at: string }>(a: T, b: T) => a.created_at.localeCompare(b.created_at);
      setNodes(n.docs.map((d) => ({ ...(d.data() as Omit<GraphNode, "id">), id: d.id })).sort(byCreated));
      setEdges(
        e.docs
          .map((d) => {
            const data = d.data() as Omit<GraphEdge, "id">;
            return { ...data, situation: data.situation ?? null, id: d.id };
          })
          .sort(byCreated),
      );
      setExamples(x.docs.map((d) => ({ ...(d.data() as Omit<Example, "id">), id: d.id })).sort(byCreated));
    } catch (err) {
      fail(err);
    }
    setLoading(false);
  }, [cols, fail]);

  useEffect(() => {
    void load();
  }, [load]);

  // ----- 노드 -----
  const addNode = useCallback(
    async (input: NodeInput): Promise<GraphNode | null> => {
      const ref = doc(cols.nodes);
      const ts = now();
      const node: GraphNode = {
        id: ref.id,
        user_id: userId,
        text: input.text.trim(),
        lang: input.lang,
        kind: input.kind ?? "word",
        domain: input.domain?.trim() || null,
        register: input.register || null,
        note: input.note?.trim() || null,
        preferred: input.preferred ?? false,
        created_at: ts,
        updated_at: ts,
      };
      try {
        await setDoc(ref, strip(node));
      } catch (err) {
        fail(err);
        return null;
      }
      setNodes((prev) => [...prev, node]);
      return node;
    },
    [cols, userId, fail],
  );

  const updateNode = useCallback(
    async (id: string, patch: Partial<NodeInput>) => {
      const clean: Record<string, unknown> = { ...patch, updated_at: now() };
      if (typeof clean.text === "string") clean.text = (clean.text as string).trim();
      if ("domain" in clean) clean.domain = (clean.domain as string | null)?.toString().trim() || null;
      if ("register" in clean) clean.register = clean.register || null;
      if ("note" in clean) clean.note = (clean.note as string | null)?.toString().trim() || null;
      setNodes((prev) => prev.map((n) => (n.id === id ? ({ ...n, ...clean } as GraphNode) : n)));
      try {
        await updateDoc(doc(cols.nodes, id), clean);
      } catch (err) {
        fail(err);
        void load();
      }
    },
    [cols, fail, load],
  );

  /** 노드와 그에 딸린 연결·예문을 함께 삭제 */
  const deleteNode = useCallback(
    async (id: string) => {
      const deadEdges = edges.filter((e) => e.source_id === id || e.target_id === id);
      const deadExamples = examples.filter((x) => x.node_id === id);
      setNodes((prev) => prev.filter((n) => n.id !== id));
      setEdges((prev) => prev.filter((e) => e.source_id !== id && e.target_id !== id));
      setExamples((prev) => prev.filter((x) => x.node_id !== id));
      try {
        const batch = writeBatch(db);
        batch.delete(doc(cols.nodes, id));
        for (const e of deadEdges) batch.delete(doc(cols.edges, e.id));
        for (const x of deadExamples) batch.delete(doc(cols.examples, x.id));
        await batch.commit();
      } catch (err) {
        fail(err);
        void load();
      }
    },
    [db, cols, edges, examples, fail, load],
  );

  // ----- 엣지 -----
  const addEdge = useCallback(
    async (input: EdgeInput): Promise<GraphEdge | null> => {
      if (input.source_id === input.target_id) return null;
      const ref = doc(cols.edges);
      const ts = now();
      const edge: GraphEdge = {
        id: ref.id,
        user_id: userId,
        source_id: input.source_id,
        target_id: input.target_id,
        relation: input.relation,
        weight: Math.min(1, Math.max(0, input.weight ?? 0.5)),
        note: input.note?.trim() || null,
        situation: input.situation?.trim() || null,
        uses: 0,
        created_at: ts,
        updated_at: ts,
      };
      try {
        await setDoc(ref, strip(edge));
      } catch (err) {
        fail(err);
        return null;
      }
      setEdges((prev) => [...prev, edge]);
      return edge;
    },
    [cols, userId, fail],
  );

  const updateEdge = useCallback(
    async (id: string, patch: Partial<Pick<GraphEdge, "relation" | "weight" | "note" | "situation" | "uses">>) => {
      setEdges((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
      try {
        await updateDoc(doc(cols.edges, id), { ...patch, updated_at: now() });
      } catch (err) {
        fail(err);
        void load();
      }
    },
    [cols, fail, load],
  );

  /** 슬라이더용: 화면은 즉시, 저장은 400ms 뒤에 한 번만 */
  const setEdgeWeight = useCallback(
    (id: string, weight: number) => {
      setEdges((prev) => prev.map((e) => (e.id === id ? { ...e, weight } : e)));
      const timers = weightTimers.current;
      const t = timers.get(id);
      if (t) clearTimeout(t);
      timers.set(
        id,
        setTimeout(async () => {
          timers.delete(id);
          try {
            await updateDoc(doc(cols.edges, id), { weight, updated_at: now() });
          } catch (err) {
            fail(err);
          }
        }, 400),
      );
    },
    [cols, fail],
  );

  const bumpUses = useCallback(
    async (id: string) => {
      const edge = edges.find((e) => e.id === id);
      if (!edge) return;
      await updateEdge(id, { uses: edge.uses + 1 });
    },
    [edges, updateEdge],
  );

  const deleteEdge = useCallback(
    async (id: string) => {
      setEdges((prev) => prev.filter((e) => e.id !== id));
      try {
        await deleteDoc(doc(cols.edges, id));
      } catch (err) {
        fail(err);
        void load();
      }
    },
    [cols, fail, load],
  );

  // ----- 예문 -----
  const addExample = useCallback(
    async (input: ExampleInput): Promise<Example | null> => {
      const ref = doc(cols.examples);
      const ex: Example = {
        id: ref.id,
        user_id: userId,
        node_id: input.node_id,
        text: input.text.trim(),
        translation: input.translation?.trim() || null,
        situation: input.situation?.trim() || null,
        source: input.source?.trim() || null,
        created_at: now(),
      };
      try {
        await setDoc(ref, strip(ex));
      } catch (err) {
        fail(err);
        return null;
      }
      setExamples((prev) => [...prev, ex]);
      return ex;
    },
    [cols, userId, fail],
  );

  const deleteExample = useCallback(
    async (id: string) => {
      setExamples((prev) => prev.filter((x) => x.id !== id));
      try {
        await deleteDoc(doc(cols.examples, id));
      } catch (err) {
        fail(err);
        void load();
      }
    },
    [cols, fail, load],
  );

  // ----- 내보내기 / 가져오기 -----
  const exportGraph = useCallback((): GraphExport => {
    return { version: 2, exported_at: now(), nodes, edges, examples };
  }, [nodes, edges, examples]);

  /**
   * 외부 JSON(이 앱의 export, 시드, 스타터 팩, CSV 변환 결과)을 새 id로 복사해 넣는다.
   * dedupe=true 면 같은 언어·같은 글자의 표현은 기존 노드를 재사용하고, 완전히 같은 연결·예문은 건너뛴다.
   */
  const importGraph = useCallback(
    async (
      data: ImportData,
      options: { dedupe?: boolean } = {},
    ): Promise<{ nodes: number; edges: number; examples: number }> => {
      setError(null);
      const ts = now();
      const idMap = new Map<string, string>();
      const writes: Array<{ col: CollectionReference<DocumentData>; id: string; data: DocumentData }> = [];
      const counts = { nodes: 0, edges: 0, examples: 0 };
      const dedupe = options.dedupe ?? false;
      const key = (text: string, lang: string) => `${lang}\u0000${text.trim().toLowerCase()}`;
      const existingNodes = new Map(nodes.map((n) => [key(n.text, n.lang), n.id]));
      const existingEdges = new Set(edges.map((e) => `${e.source_id}|${e.target_id}|${e.relation}|${e.situation ?? ""}`));
      const existingExamples = new Set(examples.map((x) => `${x.node_id}|${x.text.trim()}`));

      for (const n of data.nodes) {
        if (dedupe) {
          const hit = existingNodes.get(key(n.text, n.lang));
          if (hit) {
            idMap.set(n.id, hit);
            continue;
          }
        }
        const id = doc(cols.nodes).id;
        idMap.set(n.id, id);
        existingNodes.set(key(n.text, n.lang), id);
        counts.nodes++;
        writes.push({
          col: cols.nodes,
          id,
          data: {
            user_id: userId,
            text: n.text,
            lang: n.lang,
            kind: n.kind ?? "word",
            domain: n.domain ?? null,
            register: n.register ?? null,
            note: n.note ?? null,
            preferred: n.preferred ?? false,
            created_at: ts,
            updated_at: ts,
          },
        });
      }
      for (const e of data.edges) {
        if (!idMap.has(e.source_id) || !idMap.has(e.target_id)) continue;
        const sid = idMap.get(e.source_id)!, tid = idMap.get(e.target_id)!;
        if (sid === tid) continue;
        const sig = `${sid}|${tid}|${e.relation}|${e.situation ?? ""}`;
        const sigRev = `${tid}|${sid}|${e.relation}|${e.situation ?? ""}`;
        if (dedupe && (existingEdges.has(sig) || existingEdges.has(sigRev))) continue;
        existingEdges.add(sig);
        counts.edges++;
        writes.push({
          col: cols.edges,
          id: doc(cols.edges).id,
          data: {
            user_id: userId,
            source_id: sid,
            target_id: tid,
            relation: e.relation,
            weight: e.weight ?? 0.5,
            note: e.note ?? null,
            situation: e.situation ?? null,
            uses: e.uses ?? 0,
            created_at: ts,
            updated_at: ts,
          },
        });
      }
      for (const x of data.examples ?? []) {
        if (!idMap.has(x.node_id)) continue;
        const nid = idMap.get(x.node_id)!;
        const sig = `${nid}|${x.text.trim()}`;
        if (dedupe && existingExamples.has(sig)) continue;
        existingExamples.add(sig);
        counts.examples++;
        writes.push({
          col: cols.examples,
          id: doc(cols.examples).id,
          data: {
            user_id: userId,
            node_id: nid,
            text: x.text,
            translation: x.translation ?? null,
            situation: x.situation ?? null,
            source: x.source ?? null,
            created_at: ts,
          },
        });
      }

      try {
        for (let i = 0; i < writes.length; i += BATCH_LIMIT) {
          const batch = writeBatch(db);
          for (const w of writes.slice(i, i + BATCH_LIMIT)) batch.set(doc(w.col, w.id), w.data);
          await batch.commit();
        }
      } catch (err) {
        fail(err);
      }
      await load();
      return counts;
    },
    [db, cols, userId, nodes, edges, examples, fail, load],
  );

  const clearAll = useCallback(async () => {
    try {
      const refs = [
        ...nodes.map((n) => doc(cols.nodes, n.id)),
        ...edges.map((e) => doc(cols.edges, e.id)),
        ...examples.map((x) => doc(cols.examples, x.id)),
      ];
      for (let i = 0; i < refs.length; i += BATCH_LIMIT) {
        const batch = writeBatch(db);
        for (const r of refs.slice(i, i + BATCH_LIMIT)) batch.delete(r);
        await batch.commit();
      }
    } catch (err) {
      fail(err);
    }
    await load();
  }, [db, cols, nodes, edges, examples, fail, load]);

  return {
    nodes,
    edges,
    examples,
    loading,
    error,
    reload: load,
    addNode,
    updateNode,
    deleteNode,
    addEdge,
    updateEdge,
    setEdgeWeight,
    bumpUses,
    deleteEdge,
    addExample,
    deleteExample,
    exportGraph,
    importGraph,
    clearAll,
    dismissError: () => setError(null),
  };
}

export type GraphApi = ReturnType<typeof useGraph>;
