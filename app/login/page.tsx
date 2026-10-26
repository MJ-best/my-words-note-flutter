"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { getFirebaseAuth } from "@/lib/firebase";
import Brand, { PenguinMark } from "@/components/Brand";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const auth = getFirebaseAuth();
      if (mode === "signup") await createUserWithEmailAndPassword(auth, email, password);
      else await signInWithEmailAndPassword(auth, email, password);
      router.replace("/");
    } catch (err) {
      setError(translateAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth">
      <form className="card" onSubmit={submit}>
        <PenguinMark />
        <Brand />
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
        <button className="btn primary" type="submit" disabled={busy}>
          {busy ? "처리 중…" : mode === "signin" ? "로그인" : "계정 만들기"}
        </button>
        <button
          type="button"
          className="btn ghost"
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setError(null);
          }}
        >
          {mode === "signin" ? "계정이 없나요? 새로 만들기" : "이미 계정이 있나요? 로그인"}
        </button>
      </form>
    </main>
  );
}

function translateAuthError(err: unknown): string {
  const code = err instanceof FirebaseError ? err.code : "";
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "이메일 또는 비밀번호가 맞지 않습니다.";
    case "auth/email-already-in-use":
      return "이미 등록된 이메일입니다. 로그인해 주세요.";
    case "auth/weak-password":
      return "비밀번호는 6자 이상이어야 합니다.";
    case "auth/invalid-email":
      return "이메일 형식이 올바르지 않습니다.";
    case "auth/too-many-requests":
      return "요청이 너무 많습니다. 잠시 후 다시 시도하세요.";
    case "auth/operation-not-allowed":
      return "Firebase 콘솔 → Authentication → Sign-in method 에서 '이메일/비밀번호'를 사용 설정해야 합니다.";
    case "auth/network-request-failed":
      return "네트워크에 연결할 수 없습니다.";
    case "auth/invalid-api-key":
    case "auth/api-key-not-valid.-please-pass-a-valid-api-key.":
      return "NEXT_PUBLIC_FIREBASE_API_KEY 가 올바르지 않습니다.";
    default:
      return err instanceof Error ? err.message : String(err);
  }
}
