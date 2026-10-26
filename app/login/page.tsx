"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setInfo(null);
    const supabase = createClient();

    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (!data.session) {
          // 이메일 확인이 켜져 있는 프로젝트. README의 설정 안내를 따르면 바로 로그인된다.
          setInfo(
            "계정이 만들어졌습니다. Supabase에서 이메일 확인(Confirm email)이 켜져 있으면 받은 메일의 링크를 눌러야 합니다. 꺼져 있으면 바로 로그인하세요.",
          );
          setMode("signin");
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      router.replace("/");
      router.refresh();
    } catch (err) {
      setError(translateAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth">
      <form className="card" onSubmit={submit}>
        <div className="brand">
          <span className="dot" /> Nuance Graph
        </div>
        <h1>{mode === "signin" ? "로그인" : "계정 만들기"}</h1>
        <p className="muted small">
          이메일 인증 없이 아무 이메일 형식과 비밀번호(6자 이상)로 계정을 만들 수 있습니다. 데이터는
          계정별로 분리되어 저장됩니다.
        </p>
        <div className="field">
          <label>이메일</label>
          <input
            className="input"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="me@example.com"
          />
        </div>
        <div className="field">
          <label>비밀번호</label>
          <input
            className="input"
            type="password"
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="6자 이상"
          />
        </div>
        {error && <div className="error">{error}</div>}
        {info && <div className="ok">{info}</div>}
        <button className="btn primary" type="submit" disabled={busy}>
          {busy ? "처리 중…" : mode === "signin" ? "로그인" : "계정 만들기"}
        </button>
        <button
          type="button"
          className="btn ghost"
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setError(null);
            setInfo(null);
          }}
        >
          {mode === "signin" ? "계정이 없나요? 새로 만들기" : "이미 계정이 있나요? 로그인"}
        </button>
      </form>
    </main>
  );
}

function translateAuthError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (/invalid login credentials/i.test(msg)) return "이메일 또는 비밀번호가 맞지 않습니다.";
  if (/already registered/i.test(msg)) return "이미 등록된 이메일입니다. 로그인해 주세요.";
  if (/password should be at least/i.test(msg)) return "비밀번호는 6자 이상이어야 합니다.";
  if (/email not confirmed/i.test(msg))
    return "이메일 확인이 필요한 계정입니다. Supabase 설정에서 Confirm email을 끄거나 메일의 링크를 눌러 주세요.";
  if (/rate limit/i.test(msg)) return "요청이 너무 많습니다. 잠시 후 다시 시도하세요.";
  if (/invalid.*email/i.test(msg)) return "이메일 형식이 올바르지 않습니다.";
  return msg;
}
