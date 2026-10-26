export default function SetupNotice() {
  return (
    <main className="auth">
      <div className="card">
        <h1>환경 변수가 필요합니다</h1>
        <p className="muted">
          Firebase 웹 앱 설정값(<code>NEXT_PUBLIC_FIREBASE_API_KEY</code>,{" "}
          <code>NEXT_PUBLIC_FIREBASE_PROJECT_ID</code>, <code>NEXT_PUBLIC_FIREBASE_APP_ID</code> 등)을
          설정한 뒤 다시 실행하세요. 로컬에서는 <code>.env.local</code>, Vercel에서는 Project Settings →
          Environment Variables에 넣습니다.
        </p>
        <p className="hint">자세한 순서는 저장소의 README를 참고하세요.</p>
      </div>
    </main>
  );
}
