"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/useAuth";
import Workspace from "./Workspace";

export default function AuthGate({ aiEnabled }: { aiEnabled: boolean }) {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user === null) router.replace("/login");
  }, [user, router]);

  if (!user) {
    return (
      <main className="auth">
        <div className="card" style={{ textAlign: "center" }}>
          <div className="brand" style={{ justifyContent: "center" }}><span className="dot" /> Nuance Graph</div>
          <p className="muted" style={{ margin: 0 }}>{user === undefined ? "로그인 상태 확인 중…" : "로그인 화면으로 이동합니다…"}</p>
        </div>
      </main>
    );
  }
  return <Workspace userId={user.uid} email={user.email ?? ""} aiEnabled={aiEnabled} />;
}
