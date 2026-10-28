/**
 * Firebase ID 토큰 검증 (서버 전용). 서비스 계정 없이 Identity Toolkit의 accounts:lookup 으로 확인한다.
 * 로컬 에뮬레이터 모드면 에뮬레이터 주소로 보낸다. 유효하면 uid, 아니면 null.
 */
export async function verifyIdToken(header: string | null): Promise<string | null> {
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!token || !apiKey) return null;
  const base =
    process.env.NEXT_PUBLIC_FIREBASE_USE_EMULATOR === "1"
      ? "http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1"
      : "https://identitytoolkit.googleapis.com/v1";
  try {
    const res = await fetch(`${base}/accounts:lookup?key=${apiKey}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ idToken: token }),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { users?: Array<{ localId?: string }> };
    return data.users?.[0]?.localId ?? null;
  } catch {
    return null;
  }
}
