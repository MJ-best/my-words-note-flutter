import { hasFirebaseEnv } from "@/lib/firebase";
import AuthGate from "@/components/AuthGate";
import SetupNotice from "@/components/SetupNotice";

// 환경 변수를 빌드 시점이 아니라 요청 시점에 읽는다
export const dynamic = "force-dynamic";

export default function Page() {
  if (!hasFirebaseEnv()) return <SetupNotice />;
  // ANTHROPIC_API_KEY는 서버에서만 읽는다. 클라이언트에는 켜짐 여부만 전달.
  return <AuthGate aiEnabled={Boolean(process.env.ANTHROPIC_API_KEY)} />;
}
