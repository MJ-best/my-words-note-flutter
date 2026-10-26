import type { Relation } from "./types";

type SeedNode = {
  id: string;
  text: string;
  lang: string;
  kind?: "word" | "phrase" | "sentence";
  domain?: string;
  register?: string;
  note?: string;
  preferred?: boolean;
};
type SeedEdge = { source_id: string; target_id: string; relation: Relation; weight?: number; note?: string };
type SeedExample = { node_id: string; text: string; translation?: string; situation?: string };

/**
 * 처음 시작할 때 앱의 개념을 보여주는 예시 그래프.
 * "사랑해"가 일본어에서는 愛してる보다 好き로 더 자주 대응된다는 뉘앙스,
 * 의료·법률 통역에서 상황에 따라 다른 표현을 고르는 예를 담았다.
 */
export const SEED: { nodes: SeedNode[]; edges: SeedEdge[]; examples: SeedExample[] } = {
  nodes: [
    // ---- 감정 표현 ----
    { id: "ko-love", text: "사랑해", lang: "ko", kind: "phrase", domain: "일상", register: "casual", note: "연인, 가족, 친구 사이에서 모두 폭넓게 쓰인다." },
    { id: "ja-suki", text: "好き", lang: "ja", kind: "phrase", domain: "일상", register: "casual", preferred: true, note: "고백과 일상 대화에서 가장 자연스러운 표현. '좋아해'로 직역되지만 실제 무게는 한국어 '사랑해'에 가깝다." },
    { id: "ja-aishiteru", text: "愛してる", lang: "ja", kind: "phrase", domain: "일상", register: "written", note: "강하고 무거운 표현. 드라마·노래·소설에서는 흔하지만 일상에서 입 밖에 내는 일은 드물다." },
    { id: "en-love", text: "I love you", lang: "en", kind: "phrase", domain: "일상", register: "casual" },

    // ---- 의료 ----
    { id: "ko-painkiller", text: "진통제", lang: "ko", domain: "의료", register: "clinical", note: "환자와 의료진 모두에게 쓰는 중립적 용어." },
    { id: "en-painkiller", text: "painkiller", lang: "en", domain: "의료", register: "casual", preferred: true, note: "환자에게 설명할 때 가장 잘 통하는 말." },
    { id: "en-analgesic", text: "analgesic", lang: "en", domain: "의료", register: "clinical", note: "차트, 처방, 의료진 사이 대화에서 쓰는 전문 용어. 환자에게 쓰면 못 알아듣는 경우가 많다." },
    { id: "ja-painkiller", text: "鎮痛剤", lang: "ja", domain: "의료", register: "clinical" },
    { id: "ja-itamidome", text: "痛み止め", lang: "ja", domain: "의료", register: "casual", preferred: true, note: "환자에게 설명할 때는 鎮痛剤보다 痛み止め가 훨씬 자연스럽다." },
    { id: "ko-medicine", text: "약", lang: "ko", domain: "의료", register: "casual" },

    // ---- 법률 ----
    { id: "ko-defendant-criminal", text: "피고인", lang: "ko", domain: "법률", register: "legal", note: "형사 재판에서 기소된 사람." },
    { id: "ko-defendant-civil", text: "피고", lang: "ko", domain: "법률", register: "legal", note: "민사 소송에서 소를 제기당한 쪽. 형사의 '피고인'과 섞어 쓰면 안 된다." },
    { id: "en-defendant", text: "defendant", lang: "en", domain: "법률", register: "legal", note: "영어는 민사·형사 모두 defendant 한 단어. 한국어로 옮길 때 사건 종류를 먼저 확인해야 한다." },
    { id: "ja-defendant-criminal", text: "被告人", lang: "ja", domain: "법률", register: "legal" },
    { id: "ja-defendant-civil", text: "被告", lang: "ja", domain: "법률", register: "legal" },
  ],
  edges: [
    // 감정
    { source_id: "ko-love", target_id: "ja-suki", relation: "equivalent", weight: 0.9, note: "일상 대화·고백에서는 好き가 자연스럽다." },
    { source_id: "ko-love", target_id: "ja-aishiteru", relation: "equivalent", weight: 0.45, note: "직역이지만 실제 사용 빈도는 낮다. 결혼식, 유언, 드라마 대사처럼 무게가 실릴 때만." },
    { source_id: "ja-suki", target_id: "ja-aishiteru", relation: "similar", weight: 0.6, note: "好き < 愛してる (감정의 강도). 好き는 가볍게, 愛してる는 평생을 건 느낌." },
    { source_id: "ko-love", target_id: "en-love", relation: "equivalent", weight: 0.95 },
    { source_id: "en-love", target_id: "ja-suki", relation: "equivalent", weight: 0.8, note: "영어권 영화 자막에서도 I love you → 好き로 옮기는 경우가 많다." },

    // 의료
    { source_id: "ko-painkiller", target_id: "en-painkiller", relation: "equivalent", weight: 0.85, note: "환자 상담, 복약 지도." },
    { source_id: "ko-painkiller", target_id: "en-analgesic", relation: "equivalent", weight: 0.65, note: "의사 간 대화, 차트 통역, 학회." },
    { source_id: "en-painkiller", target_id: "en-analgesic", relation: "similar", weight: 0.7, note: "뜻은 같고 격식만 다르다. 청자가 누구인지로 고른다." },
    { source_id: "ko-painkiller", target_id: "ja-painkiller", relation: "equivalent", weight: 0.7, note: "문서·처방전 표기." },
    { source_id: "ko-painkiller", target_id: "ja-itamidome", relation: "equivalent", weight: 0.9, note: "진료실에서 환자에게 말할 때." },
    { source_id: "ja-painkiller", target_id: "ja-itamidome", relation: "similar", weight: 0.7, note: "鎮痛剤는 전문 용어, 痛み止め는 일상어." },
    { source_id: "ko-painkiller", target_id: "ko-medicine", relation: "broader", weight: 0.8 },

    // 법률
    { source_id: "ko-defendant-criminal", target_id: "en-defendant", relation: "equivalent", weight: 0.9, note: "형사 사건." },
    { source_id: "ko-defendant-civil", target_id: "en-defendant", relation: "equivalent", weight: 0.9, note: "민사 사건." },
    { source_id: "ko-defendant-criminal", target_id: "ko-defendant-civil", relation: "contrast", weight: 0.9, note: "형사=피고인, 민사=피고. 법정에서 섞어 쓰면 바로 지적받는다." },
    { source_id: "ko-defendant-criminal", target_id: "ja-defendant-criminal", relation: "equivalent", weight: 0.95 },
    { source_id: "ko-defendant-civil", target_id: "ja-defendant-civil", relation: "equivalent", weight: 0.95 },
    { source_id: "ja-defendant-criminal", target_id: "ja-defendant-civil", relation: "contrast", weight: 0.9, note: "일본어도 형사 被告人 / 민사 被告로 구분한다." },
  ],
  examples: [
    { node_id: "ja-suki", text: "ずっと前から好きだった。", translation: "오래전부터 사랑했어.", situation: "고백" },
    { node_id: "ja-aishiteru", text: "何があっても、愛してる。", translation: "무슨 일이 있어도 사랑해.", situation: "드라마 대사" },
    { node_id: "ko-painkiller", text: "진통제 처방해 드릴 테니 식후에 드세요.", translation: "I'll prescribe you a painkiller. Take it after meals.", situation: "진료실 · 복약 지도" },
    { node_id: "en-analgesic", text: "Patient was started on an oral analgesic for post-operative pain.", translation: "수술 후 통증에 대해 경구 진통제 투여를 시작함.", situation: "차트 · 의료진 간 인계" },
    { node_id: "ko-defendant-criminal", text: "피고인은 진술을 거부할 권리가 있습니다.", translation: "The defendant has the right to remain silent.", situation: "형사 법정 · 인정신문" },
    { node_id: "en-defendant", text: "The defendant is ordered to pay damages to the plaintiff.", translation: "피고는 원고에게 손해를 배상하라.", situation: "민사 법정 · 판결 선고" },
  ],
};
