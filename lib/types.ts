export type Kind = "word" | "phrase" | "sentence";

export type Relation =
  | "equivalent"
  | "similar"
  | "broader"
  | "narrower"
  | "contrast"
  | "collocation";

export interface GraphNode {
  id: string;
  user_id: string;
  text: string;
  lang: string;
  kind: Kind;
  domain: string | null;
  register: string | null;
  note: string | null;
  preferred: boolean;
  created_at: string;
  updated_at: string;
}

export interface GraphEdge {
  id: string;
  user_id: string;
  source_id: string;
  target_id: string;
  relation: Relation;
  weight: number; // 0..1
  note: string | null;
  situation: string | null; // 이 대응이 적합한 상황 (환자 설명, 법정, 차트 ...)
  uses: number;
  created_at: string;
  updated_at: string;
}

export interface Example {
  id: string;
  user_id: string;
  node_id: string;
  text: string;
  translation: string | null;
  situation: string | null;
  source: string | null;
  created_at: string;
}

export type NodeInput = Pick<GraphNode, "text" | "lang"> &
  Partial<Pick<GraphNode, "kind" | "domain" | "register" | "note" | "preferred">>;

export type EdgeInput = Pick<GraphEdge, "source_id" | "target_id" | "relation"> &
  Partial<Pick<GraphEdge, "weight" | "note" | "situation">>;

export type ExampleInput = Pick<Example, "node_id" | "text"> &
  Partial<Pick<Example, "translation" | "situation" | "source">>;

// ---------------------------------------------------------------
// 표시용 메타데이터
// ---------------------------------------------------------------
export const RELATIONS: Record<
  Relation,
  { label: string; short: string; symmetric: boolean; color: string; hint: string }
> = {
  equivalent: {
    label: "대응 번역",
    short: "대응",
    symmetric: true,
    color: "#2f6fed",
    hint: "서로 번역으로 쓸 수 있는 표현. 가중치는 이 상황에서 내가 느끼는 적합도",
  },
  similar: {
    label: "비슷하지만 뉘앙스 다름",
    short: "유사",
    symmetric: true,
    color: "#8a63d2",
    hint: "같은 언어 안에서 비슷한 뜻이지만 느낌·강도·격식이 다른 표현",
  },
  broader: {
    label: "상위 개념",
    short: "상위",
    symmetric: false,
    color: "#2e9e6b",
    hint: "연결한 표현이 더 넓은 개념(예: 진통제 → 약)",
  },
  narrower: {
    label: "하위 개념",
    short: "하위",
    symmetric: false,
    color: "#2e9e6b",
    hint: "연결한 표현이 더 구체적인 개념(예: 약 → 진통제)",
  },
  contrast: {
    label: "혼동 주의 · 대조",
    short: "주의",
    symmetric: true,
    color: "#d9534f",
    hint: "헷갈리기 쉽거나 반대되는 표현. 쓰면 안 되는 이유를 메모",
  },
  collocation: {
    label: "함께 쓰임",
    short: "연어",
    symmetric: true,
    color: "#c48a1b",
    hint: "같은 문장·상황에서 함께 자주 쓰이는 표현",
  },
};

export const RELATION_ORDER: Relation[] = [
  "equivalent",
  "similar",
  "broader",
  "narrower",
  "contrast",
  "collocation",
];

export const LANGS: Record<string, { label: string; color: string }> = {
  ko: { label: "한국어", color: "#2f6fed" },
  ja: { label: "日本語", color: "#e0557a" },
  en: { label: "English", color: "#2e9e6b" },
  zh: { label: "中文", color: "#d9822b" },
  es: { label: "Español", color: "#c48a1b" },
  fr: { label: "Français", color: "#5a7fd6" },
  de: { label: "Deutsch", color: "#6b6f7a" },
  vi: { label: "Tiếng Việt", color: "#b0558f" },
  ru: { label: "Русский", color: "#4a7c99" },
  ar: { label: "العربية", color: "#3f8f8f" },
};

export function langLabel(code: string): string {
  return LANGS[code]?.label ?? code.toUpperCase();
}

export function langColor(code: string): string {
  if (LANGS[code]) return LANGS[code].color;
  // 등록되지 않은 언어는 코드에서 안정적인 색을 만든다
  let h = 0;
  for (const ch of code) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return `hsl(${h} 55% 50%)`;
}

export const KINDS: Record<Kind, string> = {
  word: "단어",
  phrase: "구·표현",
  sentence: "문장",
};

export const REGISTERS: { value: string; label: string }[] = [
  { value: "", label: "미지정" },
  { value: "formal", label: "격식·공식" },
  { value: "casual", label: "일상·구어" },
  { value: "clinical", label: "전문·임상" },
  { value: "legal", label: "법률 문어" },
  { value: "written", label: "문어체" },
  { value: "spoken", label: "구어체" },
];

/** 자주 쓰는 상황 태그. 자유 입력도 가능하고, 그래프에 있는 태그가 datalist로 함께 제시된다. */
export const SITUATIONS: string[] = [
  "환자 설명",
  "의료진 간",
  "차트·문서",
  "진료실 문진",
  "복약 지도",
  "수술·시술 동의",
  "응급",
  "법정",
  "경찰 조사",
  "변호인 상담",
  "계약서·서면",
  "행정 민원",
  "일상 대화",
  "격식 자리",
];

export function registerLabel(value: string | null): string {
  if (!value) return "";
  return REGISTERS.find((r) => r.value === value)?.label ?? value;
}
