"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type {
  EdgeInput,
  Example,
  ExampleInput,
  GraphEdge,
  GraphNode,
  NodeInput,
} from "@/lib/types";

export interface GraphExport {
  version: 2;
  exported_at: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  examples: Example[];
}

export function useGraph(userId: string) {
  const supabase = useMemo(() => createClient(), []);
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [examples, setExamples] = useState<Example[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const weightTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const fail = useCallback((e: unknown) => {
    const msg = e instanceof Error ? e.message : typeof e === "object" && e && "message" in e ? String((e as { message: unknown }).message) : String(e);
    setError(msg);
    console.error(e);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [n, e, x] = await Promise.all([
      supabase.from("nodes").select("*").order("created_at"),
      supabase.from("edges").select("*").order("created_at"),
      supabase.from("examples").select("*").order("created_at"),
    ]);
    const err = n.error ?? e.error ?? x.error;
    if (err) {
      if (/relation .* does not exist|schema cache/i.test(err.message)) {
        setError(
          "데이터베이스 테이블이 없습니다. Supabase SQL Editor에서 supabase/migrations/0001_init.sql 을 실행하세요.",
        );
      } else fail(err);
    } else {
      setNodes((n.data ?? []) as GraphNode[]);
      setEdges((e.data ?? []) as GraphEdge[]);
      setExamples((x.data ?? []) as Example[]);
    }
    setLoading(false);
  }, [supabase, fail]);

  useEffect(() => {
    void load();
  }, [load]);

  // ----- 노드 -----
  const addNode = useCallback(
    async (input: NodeInput): Promise<GraphNode | null> => {
      const row = {
        user_id: userId,
        text: input.text.trim(),
        lang: input.lang,
        kind: input.kind ?? "word",
        domain: input.domain?.trim() || null,
        register: input.register || null,
        note: input.note?.trim() || null,
        preferred: input.preferred ?? false,
      };
      const { data, error } = await supabase.from("nodes").insert(row).select().single();
      if (error) {
        fail(error);
        return null;
      }
      const node = data as GraphNode;
      setNodes((prev) => [...prev, node]);
      return node;
    },
    [supabase, userId, fail],
  );

  const updateNode = useCallback(
    async (id: string, patch: Partial<NodeInput>) => {
      const clean: Record<string, unknown> = { ...patch };
      if (typeof clean.text === "string") clean.text = (clean.text as string).trim();
      if ("domain" in clean) clean.domain = (clean.domain as string | null)?.toString().trim() || null;
      if ("register" in clean) clean.register = clean.register || null;
      if ("note" in clean) clean.note = (clean.note as string | null)?.toString().trim() || null;
      setNodes((prev) => prev.map((n) => (n.id === id ? ({ ...n, ...clean } as GraphNode) : n)));
      const { error } = await supabase.from("nodes").update(clean).eq("id", id);
      if (error) {
        fail(error);
        void load();
      }
    },
    [supabase, fail, load],
  );

  const deleteNode = useCallback(
    async (id: string) => {
      setNodes((prev) => prev.filter((n) => n.id !== id));
      setEdges((prev) => prev.filter((e) => e.source_id !== id && e.target_id !== id));
      setExamples((prev) => prev.filter((x) => x.node_id !== id));
      const { error } = await supabase.from("nodes").delete().eq("id", id);
      if (error) {
        fail(error);
        void load();
      }
    },
    [supabase, fail, load],
  );

  // ----- 엣지 -----
  const addEdge = useCallback(
    async (input: EdgeInput): Promise<GraphEdge | null> => {
      if (input.source_id === input.target_id) return null;
      const row = {
        user_id: userId,
        source_id: input.source_id,
        target_id: input.target_id,
        relation: input.relation,
        weight: input.weight ?? 0.5,
        note: input.note?.trim() || null,
      };
      const { data, error } = await supabase.from("edges").insert(row).select().single();
      if (error) {
        fail(error);
        return null;
      }
      const edge = data as GraphEdge;
      setEdges((prev) => [...prev, edge]);
      return edge;
    },
    [supabase, userId, fail],
  );

  const updateEdge = useCallback(
    async (id: string, patch: Partial<Pick<GraphEdge, "relation" | "weight" | "note" | "uses">>) => {
      setEdges((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
      const { error } = await supabase.from("edges").update(patch).eq("id", id);
      if (error) {
        fail(error);
        void load();
      }
    },
    [supabase, fail, load],
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
          const { error } = await supabase.from("edges").update({ weight }).eq("id", id);
          if (error) fail(error);
        }, 400),
      );
    },
    [supabase, fail],
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
      const { error } = await supabase.from("edges").delete().eq("id", id);
      if (error) {
        fail(error);
        void load();
      }
    },
    [supabase, fail, load],
  );

  // ----- 예문 -----
  const addExample = useCallback(
    async (input: ExampleInput): Promise<Example | null> => {
      const row = {
        user_id: userId,
        node_id: input.node_id,
        text: input.text.trim(),
        translation: input.translation?.trim() || null,
        situation: input.situation?.trim() || null,
        source: input.source?.trim() || null,
      };
      const { data, error } = await supabase.from("examples").insert(row).select().single();
      if (error) {
        fail(error);
        return null;
      }
      const ex = data as Example;
      setExamples((prev) => [...prev, ex]);
      return ex;
    },
    [supabase, userId, fail],
  );

  const deleteExample = useCallback(
    async (id: string) => {
      setExamples((prev) => prev.filter((x) => x.id !== id));
      const { error } = await supabase.from("examples").delete().eq("id", id);
      if (error) {
        fail(error);
        void load();
      }
    },
    [supabase, fail, load],
  );

  // ----- 내보내기 / 가져오기 -----
  const exportGraph = useCallback((): GraphExport => {
    return { version: 2, exported_at: new Date().toISOString(), nodes, edges, examples };
  }, [nodes, edges, examples]);

  /** 외부 JSON(이 앱의 export 또는 시드 데이터)을 새 id로 복사해 넣는다. */
  const importGraph = useCallback(
    async (data: {
      nodes: Array<Partial<GraphNode> & { id: string; text: string; lang: string }>;
      edges: Array<Partial<GraphEdge> & { source_id: string; target_id: string; relation: GraphEdge["relation"] }>;
      examples?: Array<Partial<Example> & { node_id: string; text: string }>;
    }) => {
      setError(null);
      const idMap = new Map<string, string>();
      const nodeRows = data.nodes.map((n) => {
        const id = crypto.randomUUID();
        idMap.set(n.id, id);
        return {
          id,
          user_id: userId,
          text: n.text,
          lang: n.lang,
          kind: n.kind ?? "word",
          domain: n.domain ?? null,
          register: n.register ?? null,
          note: n.note ?? null,
          preferred: n.preferred ?? false,
        };
      });
      const edgeRows = data.edges
        .filter((e) => idMap.has(e.source_id) && idMap.has(e.target_id) && e.source_id !== e.target_id)
        .map((e) => ({
          user_id: userId,
          source_id: idMap.get(e.source_id)!,
          target_id: idMap.get(e.target_id)!,
          relation: e.relation,
          weight: e.weight ?? 0.5,
          note: e.note ?? null,
          uses: e.uses ?? 0,
        }));
      const exampleRows = (data.examples ?? [])
        .filter((x) => idMap.has(x.node_id))
        .map((x) => ({
          user_id: userId,
          node_id: idMap.get(x.node_id)!,
          text: x.text,
          translation: x.translation ?? null,
          situation: x.situation ?? null,
          source: x.source ?? null,
        }));

      if (nodeRows.length) {
        const { error } = await supabase.from("nodes").insert(nodeRows);
        if (error) return fail(error);
      }
      if (edgeRows.length) {
        const { error } = await supabase.from("edges").insert(edgeRows);
        if (error) return fail(error);
      }
      if (exampleRows.length) {
        const { error } = await supabase.from("examples").insert(exampleRows);
        if (error) return fail(error);
      }
      await load();
    },
    [supabase, userId, fail, load],
  );

  const clearAll = useCallback(async () => {
    const { error } = await supabase.from("nodes").delete().eq("user_id", userId);
    if (error) fail(error);
    await load();
  }, [supabase, userId, fail, load]);

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
