"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export type ViewMode = "dashboard" | "graph" | "packs";

/** 화면 상태를 URL에 둔다 (?view=graph&node=...). 뒤로 가기와 링크 공유가 된다. */
export function useViewState() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const rawView = params.get("view");
  const view: ViewMode = rawView === "graph" || rawView === "packs" ? rawView : "dashboard";
  const centerId = params.get("node");

  const navigate = useCallback(
    (next: { view?: ViewMode; node?: string | null }, replace = false) => {
      const p = new URLSearchParams(params.toString());
      const v = next.view ?? view;
      if (v === "dashboard") p.delete("view");
      else p.set("view", v);
      if (next.node === null || (next.view && next.view !== "graph" && next.node === undefined)) p.delete("node");
      else if (next.node) p.set("node", next.node);
      const qs = p.toString();
      const url = qs ? `${pathname}?${qs}` : pathname;
      if (replace) router.replace(url);
      else router.push(url);
    },
    [params, pathname, router, view],
  );

  return { view, centerId, navigate };
}
