import { NextResponse } from "next/server";
import { verifyIdToken } from "@/lib/server/auth";
import { parseGoogleSheetUrl } from "@/lib/sheets";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_BYTES = 5 * 1024 * 1024;

/** "링크가 있는 모든 사용자에게 보기 허용"된 구글 시트를 CSV로 가져온다. */
export async function POST(req: Request) {
  const uid = await verifyIdToken(req.headers.get("authorization"));
  if (!uid) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  let body: { url?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청" }, { status: 400 });
  }
  const parsed = parseGoogleSheetUrl(body.url ?? "");
  if (!parsed) return NextResponse.json({ error: "구글 스프레드시트 링크가 아닙니다. docs.google.com/spreadsheets/d/… 형태여야 합니다." }, { status: 400 });

  const exportUrl = `https://docs.google.com/spreadsheets/d/${parsed.id}/export?format=csv${parsed.gid ? `&gid=${parsed.gid}` : ""}`;
  try {
    const res = await fetch(exportUrl, { redirect: "follow", cache: "no-store", headers: { accept: "text/csv,*/*" } });
    const type = res.headers.get("content-type") ?? "";
    if (!res.ok || /text\/html/i.test(type)) {
      return NextResponse.json(
        { error: "시트를 읽을 수 없습니다. 구글 시트에서 공유 → '링크가 있는 모든 사용자' → '뷰어'로 바꾼 뒤 다시 시도하세요." },
        { status: 403 },
      );
    }
    const len = Number(res.headers.get("content-length") ?? 0);
    if (len > MAX_BYTES) return NextResponse.json({ error: "시트가 너무 큽니다 (5MB 초과)." }, { status: 413 });
    const text = await res.text();
    if (text.length > MAX_BYTES) return NextResponse.json({ error: "시트가 너무 큽니다 (5MB 초과)." }, { status: 413 });
    return NextResponse.json({ csv: text });
  } catch (err) {
    return NextResponse.json({ error: `시트를 가져오지 못했습니다: ${err instanceof Error ? err.message : String(err)}` }, { status: 502 });
  }
}
