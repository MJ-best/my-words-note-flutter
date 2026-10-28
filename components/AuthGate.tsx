"use client";

import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/useAuth";
import Workspace from "./Workspace";
import Brand from "./Brand";

function Splash({ text }: { text: string }) {
  return (
    <main className="auth">
      <div className="card" style={{ textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center" }}><Brand /></div>
        <p className="muted" style={{ margin: 0 }}>{text}</p>
      </div>
    </main>
  );
}

export default function AuthGate({ aiEnabled }: { aiEnabled: boolean }) {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user === null) router.replace("/login");
  }, [user, router]);

  if (!user) return <Splash text={user === undefined ? "로그인 상태 확인 중…" : "로그인 화면으로 이동합니다…"} />;
  return (
    <Suspense fallback={<Splash text="불러오는 중…" />}>
      <Workspace userId={user.uid} email={user.email ?? ""} aiEnabled={aiEnabled} />
    </Suspense>
  );
}
