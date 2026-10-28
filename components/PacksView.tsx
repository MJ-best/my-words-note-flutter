"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, doc, getDocs, query, serverTimestamp, setDoc, where } from "firebase/firestore";
import { getDb } from "@/lib/firebase";

interface Showcase {
  id: string;
  icon: string;
  title: string;
  pair: string;
  domain: string;
  desc: string;
  bullets: string[];
}

/**
 * 준비 중인 전문가 팩의 예시 구성. 실제 상품이 아니며, 수요를 확인하기 위한 미리보기입니다.
 * 검수자·노드 수 같은 구체적 수치는 아직 없으므로 적지 않습니다.
 */
const SHOWCASE: Showcase[] = [
  { id: "med-ko-ru-surgery", icon: "🩺", title: "수술실·중환자실 통역", pair: "한국어 ↔ 러시아어", domain: "의료",
    desc: "수술 동의, 마취 설명, 중환자실 보호자 면담에서 환자 가족에게 쓰는 말과 의료진끼리 쓰는 말을 구분한 구성.",
    bullets: ["수술 전 설명·동의서 핵심 문장", "마취·회복실·중환자실 용어의 환자용/차트용 구분", "보호자 면담에서 피해야 할 직역"] },
  { id: "legal-ko-en-contract", icon: "⚖️", title: "영미 계약서 독소 조항·혼동 어휘", pair: "한국어 ↔ 영어", domain: "법률",
    desc: "M&A·용역 계약서에서 뜻이 비슷해 보여도 법적 효과가 다른 어휘와, 한국 계약 관행에 없는 조항의 번역 선택.",
    bullets: ["indemnify / hold harmless / warrant 류 구분", "best efforts vs reasonable efforts", "준거법·분쟁 해결 조항의 정형 표현"] },
  { id: "med-ko-ja-clinical", icon: "💊", title: "임상시험(CRO) 프로토콜 용어", pair: "한국어 ↔ 일본어", domain: "의료",
    desc: "임상시험 계획서, 동의 설명문, 이상 반응 보고에서 쓰는 정형 표현과 피험자에게 말할 때의 표현.",
    bullets: ["피험자 설명문 문장 패턴", "이상 반응·중대한 이상 반응 보고 어휘", "모니터링·감사 회의 용어"] },
  { id: "legal-ko-ru-criminal", icon: "🏛️", title: "형사 절차 단계별 심문 뉘앙스", pair: "한국어 ↔ 러시아어", domain: "법률",
    desc: "체포·조사·기소·재판 단계에 따라 바뀌는 러시아어 용어와 법정에서 쓰는 정형 문구.",
    bullets: ["задержание / арест / заключение под стражу 구분", "подозреваемый → обвиняемый → подсудимый", "권리 고지·인정신문 정형 문구"] },
];

interface Props {
  userId: string;
  onToast: (msg: string) => void;
}

export default function PacksView({ userId, onToast }: Props) {
  const db = useMemo(() => getDb(), []);
  const [signed, setSigned] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const snap = await getDocs(query(collection(db, "waitlist"), where("uid", "==", userId)));
        if (alive) setSigned(new Set(snap.docs.map((d) => (d.data() as { packId: string }).packId)));
      } catch (e) {
        console.error(e);
      }
    })();
    return () => { alive = false; };
  }, [db, userId]);

  async function signUp(packId: string, type: "buyer" | "creator") {
    setBusy(packId);
    try {
      await setDoc(doc(db, "waitlist", `${userId}_${packId}`), { uid: userId, packId, type, created_at: serverTimestamp() });
      setSigned((prev) => new Set(prev).add(packId));
      onToast(type === "creator" ? "파트너 신청을 기록했습니다. 준비되면 알려 드리겠습니다." : "출시 알림 신청을 기록했습니다.");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      onToast(/permission/i.test(msg) ? "신청을 저장할 수 없습니다. Firestore 규칙에 waitlist 항목이 게시되었는지 확인하세요." : `신청 실패: ${msg}`);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="packs">
      <div>
        <h2 style={{ margin: "0 0 4px" }}>전문가 뉘앙스 팩 <span className="chip" style={{ verticalAlign: "middle" }}>준비 중</span></h2>
        <p className="muted" style={{ margin: 0 }}>
          현업 통번역사가 다듬은 분야별 뉘앙스 그래프를 내 그래프에 바로 합칠 수 있게 준비하고 있습니다. 아래는 <b>예시 구성</b>이며 아직 판매하거나 배포하는 상품이 아닙니다. 관심 있는 팩에 알림을 신청해 주시면 우선순위를 정하는 데 참고합니다.
        </p>
      </div>

      <div className="banner">
        <div>
          <b>내 단어장을 공유하거나 수익화하고 싶으신가요?</b>
          <div className="small" style={{ opacity: 0.85 }}>직접 다듬은 분야별 그래프를 다른 통번역사에게 제공하는 파트너를 찾고 있습니다.</div>
        </div>
        <button className="btn" disabled={busy === "creator" || signed.has("creator")} onClick={() => signUp("creator", "creator")}>
          {signed.has("creator") ? "✓ 신청됨" : "🙋 파트너 신청"}
        </button>
      </div>

      <div className="cards">
        {SHOWCASE.map((p) => (
          <div key={p.id} className="pcard">
            <span className="tag">준비 중 · 예시 구성</span>
            <div style={{ fontSize: 20, fontWeight: 800 }}>{p.icon} {p.title}</div>
            <div style={{ display: "flex", gap: 6 }}>
              <span className="chip">{p.domain}</span>
              <span className="chip">{p.pair}</span>
            </div>
            <p className="muted small" style={{ margin: 0 }}>{p.desc}</p>
            <ul>{p.bullets.map((b) => <li key={b}>{b}</li>)}</ul>
            <button className="btn primary" style={{ alignSelf: "flex-start", marginTop: 4 }} disabled={busy === p.id || signed.has(p.id)} onClick={() => signUp(p.id, "buyer")}>
              {signed.has(p.id) ? "✓ 알림 신청됨" : "🔔 출시 알림 받기"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
