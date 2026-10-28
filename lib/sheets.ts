import { parseCsv } from "./csv";

/** 구글 스프레드시트 링크에서 id 와 gid 를 뽑는다 */
export function parseGoogleSheetUrl(url: string): { id: string; gid: string | null } | null {
  const m = url.trim().match(/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!m) return null;
  const gid = url.match(/[#&?]gid=(\d+)/)?.[1] ?? null;
  return { id: m[1], gid };
}

export function isSpreadsheetFile(name: string): boolean {
  return /\.(xlsx|xlsm|xls|ods)$/i.test(name);
}

/** 엑셀·CSV 파일을 문자열 행렬로. 엑셀은 첫 시트만 읽는다 (SheetJS 는 필요할 때만 로드). */
export async function parseSpreadsheetFile(file: File): Promise<{ rows: string[][]; sheetName: string | null }> {
  if (isSpreadsheetFile(file.name)) {
    const XLSX = await import("xlsx");
    const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
    const name = wb.SheetNames[0];
    const ws = wb.Sheets[name];
    const aoa = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, raw: false, defval: "" });
    const rows = aoa
      .map((r) => r.map((c) => (c == null ? "" : String(c))))
      .filter((r) => r.some((c) => c.trim() !== ""));
    return { rows, sheetName: name };
  }
  return { rows: parseCsv(await file.text()), sheetName: null };
}

/** 셀 안의 글자를 보고 언어를 추정한다 (AI 없이 매핑할 때 열 언어 기본값용) */
export function guessLang(text: string): string | null {
  if (/[가-힯]/.test(text)) return "ko";
  if (/[぀-ヿ]/.test(text)) return "ja";
  if (/[一-鿿]/.test(text)) return "zh";
  if (/[Ѐ-ӿ]/.test(text)) return "ru";
  if (/[a-zA-Z]/.test(text)) return "en";
  return null;
}

/** 열마다 가장 흔한 언어 추정 */
export function guessColumnLangs(rows: string[][], skipHeader: boolean): Array<string | null> {
  const body = skipHeader ? rows.slice(1) : rows;
  const width = Math.max(0, ...body.map((r) => r.length));
  const out: Array<string | null> = [];
  for (let c = 0; c < width; c++) {
    const counts = new Map<string, number>();
    for (const r of body.slice(0, 200)) {
      const g = guessLang(r[c] ?? "");
      if (g) counts.set(g, (counts.get(g) ?? 0) + 1);
    }
    out.push(Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null);
  }
  return out;
}

/** 시트 전체에서 등장하는 언어들 */
export function guessLangsInRows(rows: string[][]): string[] {
  const set = new Set<string>();
  for (const r of rows.slice(0, 300)) for (const c of r) { const g = guessLang(c); if (g) set.add(g); }
  return Array.from(set);
}
