import type { StarterPack } from "./types";

const 환자 = "환자 설명";
const 의료진 = "의료진 간";
const 차트 = "차트·문서";

/**
 * 의료 통역 스타터 팩 (ko · en · ja · ru)
 * 가중치와 메모는 일반적인 현장 감각을 적은 초안입니다. 내 경험에 맞게 바꾸세요.
 */
export const MEDICAL_PACK: StarterPack = {
  id: "medical",
  title: "의료 통역",
  description: "진료실·병동·응급실에서 자주 나오는 표현. 환자에게 말할 때와 의료진·차트용 표현을 구분했습니다.",
  domain: "의료",
  langs: ["ko", "en", "ja", "ru"],
  concepts: [
    {
      terms: {
        ko: [{ t: "진통제", register: "clinical", note: "환자·의료진 모두에게 쓰는 중립적 용어." }],
        en: [
          { t: "painkiller", register: "casual", w: 0.9, situation: 환자, preferred: true, why: "환자에게 설명할 때 가장 잘 통한다." },
          { t: "analgesic", register: "clinical", w: 0.85, situation: 의료진, why: "차트, 처방, 의료진 사이 대화. 환자는 못 알아듣는 경우가 많다." },
          { t: "pain medication", register: "casual", w: 0.8, situation: 환자, why: "painkiller보다 조금 더 중립적. 미국 병원에서 자주 쓴다." },
        ],
        ja: [
          { t: "痛み止め", register: "casual", w: 0.9, situation: 환자, preferred: true, why: "진료실에서 환자에게 말할 때." },
          { t: "鎮痛剤", register: "clinical", w: 0.85, situation: 차트, why: "처방전, 설명서, 의료진 간." },
        ],
        ru: [
          { t: "обезболивающее", register: "casual", w: 0.9, situation: 환자, preferred: true, why: "환자에게는 이 말. 형용사가 명사화된 일상어." },
          { t: "анальгетик", register: "clinical", w: 0.8, situation: 의료진, why: "의학 용어. 처방·차트." },
        ],
      },
      examples: [
        { lang: "ko", text: "진통제 처방해 드릴 테니 식후에 드세요.", translation: "I'll prescribe you a painkiller. Take it after meals.", situation: "복약 지도" },
        { lang: "en", text: "Are you taking any painkillers at home?", translation: "집에서 드시는 진통제가 있나요?", situation: "진료실 문진" },
      ],
    },
    {
      terms: {
        ko: [{ t: "약", register: "casual" }],
        en: [{ t: "medicine", register: "casual" }, { t: "medication", register: "clinical", w: 0.85, why: "복약 중인 약 전체를 가리킬 때. 'Are you on any medication?'" }],
        ja: [{ t: "薬", register: "casual" }],
        ru: [{ t: "лекарство", register: "casual" }, { t: "препарат", register: "clinical", w: 0.8, why: "의료진이 쓰는 말. 환자에게는 лекарство." }],
      },
    },
    {
      terms: {
        ko: [{ t: "항생제" }],
        en: [{ t: "antibiotic" }],
        ja: [{ t: "抗生物質", register: "casual" }, { t: "抗生剤", register: "clinical", w: 0.8, why: "의료진이 더 자주 쓰는 줄임말." }],
        ru: [{ t: "антибиотик" }],
      },
    },
    {
      terms: {
        ko: [{ t: "혈압" }],
        en: [{ t: "blood pressure" }],
        ja: [{ t: "血圧" }],
        ru: [
          { t: "давление", register: "casual", w: 0.9, situation: 환자, why: "환자는 그냥 давление라고 한다. '혈압이 높다' = давление высокое." },
          { t: "артериальное давление", register: "clinical", w: 0.85, situation: 차트, why: "차트·의료진 표현. 약어 АД." },
        ],
      },
    },
    {
      terms: {
        ko: [{ t: "고혈압" }],
        en: [
          { t: "high blood pressure", register: "casual", w: 0.9, situation: 환자 },
          { t: "hypertension", register: "clinical", w: 0.85, situation: 의료진, why: "차트 약어 HTN." },
        ],
        ja: [{ t: "高血圧" }],
        ru: [
          { t: "гипертония", register: "casual", w: 0.9, situation: 환자, why: "환자도 의사도 흔히 쓴다." },
          { t: "артериальная гипертензия", register: "clinical", w: 0.8, situation: 차트, why: "진단서·차트의 정식 명칭." },
          { t: "высокое давление", register: "casual", w: 0.8, situation: 환자, why: "증상을 말할 때. 병명으로는 гипертония." },
        ],
      },
    },
    {
      terms: {
        ko: [{ t: "당뇨병" }, { t: "당뇨", register: "casual", why: "구어에서는 '당뇨'로 줄여 말한다." }],
        en: [{ t: "diabetes" }],
        ja: [{ t: "糖尿病" }],
        ru: [{ t: "диабет", register: "casual" }, { t: "сахарный диабет", register: "clinical", w: 0.85, why: "정식 명칭. 환자도 자주 쓴다." }],
      },
    },
    {
      terms: {
        ko: [{ t: "심근경색" }, { t: "심장마비", register: "casual", why: "환자·가족이 쓰는 말. 의학적으로는 심정지와 구분된다." }],
        en: [
          { t: "heart attack", register: "casual", w: 0.9, situation: 환자 },
          { t: "myocardial infarction", register: "clinical", w: 0.85, situation: 의료진, why: "차트 약어 MI." },
        ],
        ja: [{ t: "心筋梗塞" }],
        ru: [{ t: "инфаркт", register: "casual", w: 0.9, situation: 환자 }, { t: "инфаркт миокарда", register: "clinical", w: 0.85, situation: 차트 }],
      },
    },
    {
      terms: {
        ko: [{ t: "뇌졸중" }, { t: "중풍", register: "casual", why: "고령 환자가 자주 쓰는 말." }],
        en: [{ t: "stroke" }],
        ja: [{ t: "脳卒中" }],
        ru: [{ t: "инсульт" }],
      },
    },
    {
      terms: {
        ko: [{ t: "수술" }],
        en: [{ t: "surgery" }, { t: "operation", w: 0.8, why: "영국식·구어. 'have an operation'." }],
        ja: [{ t: "手術" }],
        ru: [{ t: "операция" }],
      },
    },
    {
      terms: {
        ko: [{ t: "마취" }],
        en: [{ t: "anesthesia" }],
        ja: [{ t: "麻酔" }],
        ru: [
          { t: "наркоз", register: "casual", w: 0.85, why: "환자는 마취 전반을 наркоз라고 부르지만, 원래는 전신마취 뜻. 국소마취는 местная анестезия." },
          { t: "анестезия", register: "clinical", w: 0.9, situation: 의료진 },
        ],
      },
    },
    {
      terms: {
        ko: [{ t: "전신마취" }],
        en: [{ t: "general anesthesia" }],
        ja: [{ t: "全身麻酔" }],
        ru: [{ t: "общий наркоз" }],
      },
    },
    {
      terms: {
        ko: [{ t: "부분마취" }, { t: "국소마취", register: "clinical" }],
        en: [{ t: "local anesthesia" }],
        ja: [{ t: "局所麻酔" }],
        ru: [{ t: "местная анестезия" }],
      },
    },
    {
      terms: {
        ko: [{ t: "처방전" }],
        en: [{ t: "prescription" }],
        ja: [{ t: "処方箋" }],
        ru: [{ t: "рецепт" }],
      },
    },
    {
      terms: {
        ko: [{ t: "부작용" }],
        en: [{ t: "side effect" }],
        ja: [{ t: "副作用" }],
        ru: [{ t: "побочный эффект" }, { t: "побочное действие", register: "clinical", w: 0.8, why: "약 설명서(инструкция)에 쓰는 표현." }],
      },
    },
    {
      terms: {
        ko: [{ t: "알레르기" }],
        en: [{ t: "allergy" }],
        ja: [{ t: "アレルギー" }],
        ru: [{ t: "аллергия" }],
      },
      examples: [{ lang: "en", text: "Do you have any allergies to medications?", translation: "약물 알레르기가 있으신가요?", situation: "진료실 문진" }],
    },
    {
      terms: {
        ko: [{ t: "응급실" }],
        en: [{ t: "emergency room", w: 0.9, why: "미국. 줄여서 ER." }, { t: "A&E", w: 0.7, why: "영국(Accident & Emergency)." }],
        ja: [{ t: "救急外来" }, { t: "救急救命室", register: "clinical", w: 0.7 }],
        ru: [{ t: "приёмное отделение", w: 0.85, why: "병원 입구에서 환자를 받는 부서. 일상에서는 приёмный покой." }, { t: "отделение неотложной помощи", register: "clinical", w: 0.75 }],
      },
    },
    {
      terms: {
        ko: [{ t: "입원" }],
        en: [{ t: "hospitalization" }, { t: "admission", register: "clinical", w: 0.85, situation: 의료진, why: "'be admitted' 가 실제로 더 자주 쓰인다." }],
        ja: [{ t: "入院" }],
        ru: [{ t: "госпитализация", register: "formal" }, { t: "лечь в больницу", register: "casual", w: 0.9, situation: 환자, why: "환자에게는 동사구로 말한다. 'Вам нужно лечь в больницу.'" }],
      },
    },
    {
      terms: {
        ko: [{ t: "퇴원" }],
        en: [{ t: "discharge" }],
        ja: [{ t: "退院" }],
        ru: [{ t: "выписка" }],
      },
    },
    {
      terms: {
        ko: [{ t: "진단" }],
        en: [{ t: "diagnosis" }],
        ja: [{ t: "診断" }],
        ru: [{ t: "диагноз" }],
      },
    },
    {
      terms: {
        ko: [{ t: "증상" }],
        en: [{ t: "symptom" }],
        ja: [{ t: "症状" }],
        ru: [{ t: "симптом" }, { t: "жалобы", register: "clinical", w: 0.7, situation: 차트, why: "차트의 '주소(主訴)' 항목. 환자가 호소하는 증상." }],
      },
    },
    {
      terms: {
        ko: [{ t: "통증" }, { t: "아픔", register: "casual" }],
        en: [{ t: "pain" }],
        ja: [{ t: "痛み" }],
        ru: [{ t: "боль" }],
      },
      examples: [{ lang: "en", text: "On a scale of zero to ten, how bad is the pain?", translation: "0에서 10까지라면 통증이 어느 정도인가요?", situation: "진료실 문진" }],
    },
    {
      terms: {
        ko: [{ t: "염증" }],
        en: [{ t: "inflammation" }],
        ja: [{ t: "炎症" }],
        ru: [{ t: "воспаление" }],
      },
    },
    {
      terms: {
        ko: [{ t: "골절" }, { t: "뼈가 부러짐", register: "casual", kind: "phrase" }],
        en: [{ t: "fracture", register: "clinical" }, { t: "broken bone", register: "casual", w: 0.9, situation: 환자 }],
        ja: [{ t: "骨折" }],
        ru: [{ t: "перелом" }],
      },
    },
    {
      terms: {
        ko: [{ t: "수혈" }],
        en: [{ t: "blood transfusion" }],
        ja: [{ t: "輸血" }],
        ru: [{ t: "переливание крови" }],
      },
    },
    {
      terms: {
        ko: [{ t: "금식" }],
        en: [{ t: "fasting", w: 0.85 }, { t: "NPO", register: "clinical", w: 0.8, situation: 차트, why: "nil per os. 차트와 의료진 지시에만. 환자에게는 'nothing to eat or drink'." }],
        ja: [{ t: "絶食" }],
        ru: [{ t: "натощак", w: 0.8, situation: 환자, why: "'공복 상태로 오세요' = Приходите натощак. 수술 전 금식 지시는 'Ничего не есть и не пить'." }],
      },
    },
    {
      terms: {
        ko: [{ t: "동의서" }],
        en: [{ t: "consent form" }, { t: "informed consent", register: "clinical", w: 0.8, why: "설명을 듣고 하는 동의라는 절차 자체." }],
        ja: [{ t: "同意書" }],
        ru: [{ t: "согласие на операцию", w: 0.85 }, { t: "информированное согласие", register: "formal", w: 0.8, situation: 차트 }],
      },
    },
    {
      terms: {
        ko: [{ t: "보호자", note: "한국 병원 특유의 말. 가족·간병인·법적 대리인을 다 뭉뚱그린다. 상대 언어에서는 누구인지 먼저 정해야 한다." }],
        en: [
          { t: "family member", register: "casual", w: 0.8, situation: 환자, why: "동행한 가족이면 이쪽." },
          { t: "caregiver", w: 0.7, why: "돌보는 사람. 가족이 아닐 수 있다." },
          { t: "guardian", register: "legal", w: 0.6, why: "법적 후견인. 미성년자·의사결정 무능력자일 때만." },
        ],
        ja: [{ t: "付き添い", register: "casual", w: 0.8, why: "동행한 사람." }, { t: "保護者", w: 0.6, why: "미성년자의 부모·후견인." }],
        ru: [{ t: "сопровождающий", w: 0.8 }, { t: "родственник", register: "casual", w: 0.75, why: "가족이면 그냥 родственник." }, { t: "опекун", register: "legal", w: 0.55, why: "법적 후견인에 한정." }],
      },
    },
    {
      terms: {
        ko: [{ t: "주치의" }],
        en: [{ t: "attending physician", register: "clinical", w: 0.85, situation: 의료진 }, { t: "your doctor", register: "casual", w: 0.85, situation: 환자, kind: "phrase" }],
        ja: [{ t: "主治医" }],
        ru: [{ t: "лечащий врач" }],
      },
    },
    {
      terms: {
        ko: [{ t: "간호사" }],
        en: [{ t: "nurse" }],
        ja: [{ t: "看護師" }],
        ru: [{ t: "медсестра", note: "여성형. 남자 간호사는 медбрат." }],
      },
    },
    {
      terms: {
        ko: [{ t: "혈액검사" }, { t: "피검사", register: "casual" }],
        en: [{ t: "blood test" }],
        ja: [{ t: "血液検査" }],
        ru: [{ t: "анализ крови" }],
      },
    },
    {
      terms: {
        ko: [{ t: "소변검사" }],
        en: [{ t: "urine test" }],
        ja: [{ t: "尿検査" }],
        ru: [{ t: "анализ мочи" }],
      },
    },
    {
      terms: {
        ko: [{ t: "엑스레이" }],
        en: [{ t: "X-ray" }],
        ja: [{ t: "レントゲン", note: "일본에서는 X線보다 レントゲン이 훨씬 흔하다." }],
        ru: [{ t: "рентген" }],
      },
    },
    {
      terms: {
        ko: [{ t: "CT" }],
        en: [{ t: "CT scan" }],
        ja: [{ t: "CT" }],
        ru: [{ t: "КТ", note: "компьютерная томография의 약자. 말할 때도 КТ[카테]." }],
      },
    },
    {
      terms: {
        ko: [{ t: "MRI" }],
        en: [{ t: "MRI" }],
        ja: [{ t: "MRI" }],
        ru: [{ t: "МРТ", note: "магнитно-резонансная томография. 말할 때 [엠에르테]." }],
      },
    },
    {
      terms: {
        ko: [{ t: "어지럼증" }, { t: "어지러움", register: "casual" }],
        en: [{ t: "dizziness" }],
        ja: [{ t: "めまい" }],
        ru: [{ t: "головокружение" }],
      },
    },
    {
      terms: {
        ko: [{ t: "메스꺼움" }, { t: "울렁거림", register: "casual" }],
        en: [{ t: "nausea" }],
        ja: [{ t: "吐き気" }],
        ru: [{ t: "тошнота" }],
      },
    },
    {
      terms: {
        ko: [{ t: "구토" }],
        en: [{ t: "vomiting" }, { t: "throwing up", register: "casual", w: 0.85, situation: 환자 }],
        ja: [{ t: "嘔吐" }],
        ru: [{ t: "рвота" }],
      },
    },
    {
      terms: {
        ko: [{ t: "설사" }],
        en: [{ t: "diarrhea" }],
        ja: [{ t: "下痢" }],
        ru: [{ t: "понос", register: "casual", w: 0.9, situation: 환자, why: "환자는 거의 понос라고 한다." }, { t: "диарея", register: "clinical", w: 0.8, situation: 차트 }],
      },
    },
    {
      terms: {
        ko: [{ t: "변비" }],
        en: [{ t: "constipation" }],
        ja: [{ t: "便秘" }],
        ru: [{ t: "запор" }],
      },
    },
    {
      terms: {
        ko: [{ t: "발열" }, { t: "열", register: "casual", why: "환자에게는 '열이 나세요?'" }],
        en: [{ t: "fever" }],
        ja: [{ t: "熱", register: "casual", w: 0.9, situation: 환자 }, { t: "発熱", register: "clinical", w: 0.85, situation: 차트 }],
        ru: [{ t: "температура", register: "casual", w: 0.9, situation: 환자, why: "'열이 있다' = у меня температура. 러시아어에서 жар는 문어적." }, { t: "лихорадка", register: "clinical", w: 0.7, situation: 차트 }],
      },
    },
    {
      terms: {
        ko: [{ t: "기침" }],
        en: [{ t: "cough" }],
        ja: [{ t: "咳" }],
        ru: [{ t: "кашель" }],
      },
    },
    {
      terms: {
        ko: [{ t: "호흡곤란" }, { t: "숨이 참", register: "casual", kind: "phrase" }],
        en: [{ t: "shortness of breath", register: "casual", w: 0.9, situation: 환자 }, { t: "dyspnea", register: "clinical", w: 0.85, situation: 차트 }],
        ja: [{ t: "息切れ", register: "casual", w: 0.9, situation: 환자 }, { t: "呼吸困難", register: "clinical", w: 0.85, situation: 차트 }],
        ru: [{ t: "одышка", w: 0.9 }, { t: "затруднённое дыхание", register: "clinical", w: 0.75 }],
      },
    },
    {
      terms: {
        ko: [{ t: "임신" }],
        en: [{ t: "pregnancy" }],
        ja: [{ t: "妊娠" }],
        ru: [{ t: "беременность" }],
      },
    },
    {
      terms: {
        ko: [{ t: "예방접종" }, { t: "백신", register: "casual" }],
        en: [{ t: "vaccination" }, { t: "shot", register: "casual", w: 0.8, situation: 환자, why: "미국 구어. 'flu shot'." }],
        ja: [{ t: "予防接種" }, { t: "ワクチン", register: "casual", w: 0.85 }],
        ru: [{ t: "прививка", register: "casual", w: 0.9, situation: 환자 }, { t: "вакцинация", register: "formal", w: 0.85, situation: 차트 }],
      },
    },
    {
      terms: {
        ko: [{ t: "만성" }],
        en: [{ t: "chronic" }],
        ja: [{ t: "慢性" }],
        ru: [{ t: "хронический" }],
      },
    },
    {
      terms: {
        ko: [{ t: "급성" }],
        en: [{ t: "acute" }],
        ja: [{ t: "急性" }],
        ru: [{ t: "острый" }],
      },
    },
    {
      terms: {
        ko: [{ t: "양성 종양", note: "같은 '양성'이라도 종양은 良性(benign), 검사 결과는 陽性(positive). 통역 전에 어느 쪽인지 확인." }],
        en: [{ t: "benign tumor" }],
        ja: [{ t: "良性腫瘍" }],
        ru: [{ t: "доброкачественная опухоль" }],
      },
    },
    {
      terms: {
        ko: [{ t: "악성 종양" }],
        en: [{ t: "malignant tumor" }],
        ja: [{ t: "悪性腫瘍" }],
        ru: [{ t: "злокачественная опухоль" }],
      },
    },
    {
      terms: {
        ko: [{ t: "양성 반응", note: "검사 결과의 양성(陽性). 종양의 양성(良性)과 반대 뉘앙스이므로 주의." }],
        en: [{ t: "positive" }],
        ja: [{ t: "陽性" }],
        ru: [{ t: "положительный" }],
      },
    },
    {
      terms: {
        ko: [{ t: "음성 반응" }],
        en: [{ t: "negative" }],
        ja: [{ t: "陰性" }],
        ru: [{ t: "отрицательный" }],
      },
    },
    {
      terms: {
        ko: [{ t: "암" }],
        en: [{ t: "cancer" }],
        ja: [{ t: "がん", register: "casual", w: 0.9, why: "환자용 자료에서는 히라가나." }, { t: "癌", register: "clinical", w: 0.8, situation: 차트 }],
        ru: [
          { t: "рак", w: 0.85 },
          { t: "онкология", register: "casual", w: 0.8, situation: 환자, why: "러시아어권에서는 рак라는 말을 피하려고 '종양학'이라는 뜻의 онкология를 완곡어로 쓴다. 'У него онкология.'" },
        ],
      },
    },
    {
      terms: {
        ko: [{ t: "복용하다", kind: "word" }],
        en: [{ t: "take", kind: "word", note: "take medicine. drink라고 하지 않는다." }],
        ja: [{ t: "飲む", register: "casual", w: 0.9, situation: 환자 }, { t: "服用する", register: "clinical", w: 0.85, situation: 차트 }],
        ru: [{ t: "принимать", note: "принимать лекарство. пить таблетки도 구어로 흔하다." }],
      },
    },
    {
      terms: {
        ko: [{ t: "금기" }],
        en: [{ t: "contraindication" }],
        ja: [{ t: "禁忌" }],
        ru: [{ t: "противопоказание" }],
      },
    },
  ],
  links: [
    { a: ["ko", "진통제"], b: ["ko", "약"], relation: "broader", weight: 0.8 },
    { a: ["ko", "항생제"], b: ["ko", "약"], relation: "broader", weight: 0.8 },
    { a: ["ko", "전신마취"], b: ["ko", "마취"], relation: "broader", weight: 0.9 },
    { a: ["ko", "부분마취"], b: ["ko", "마취"], relation: "broader", weight: 0.9 },
    { a: ["ko", "양성 종양"], b: ["ko", "양성 반응"], relation: "contrast", weight: 0.9, note: "둘 다 '양성'이지만 뜻이 다르다. 종양=良性(benign), 검사=陽性(positive). 환자가 '양성이래요'라고 하면 어느 쪽인지 되물을 것." },
    { a: ["ko", "양성 종양"], b: ["ko", "악성 종양"], relation: "contrast", weight: 0.8 },
    { a: ["ko", "만성"], b: ["ko", "급성"], relation: "contrast", weight: 0.7 },
    { a: ["ru", "наркоз"], b: ["ru", "местная анестезия"], relation: "contrast", weight: 0.7, note: "наркоз는 원래 전신마취. 국소마취를 наркоз라고 하면 의료진이 놀란다." },
    { a: ["ru", "рак"], b: ["ru", "онкология"], relation: "similar", weight: 0.7, note: "환자·가족 앞에서는 онкология가 덜 충격적. 의사가 рак라고 직접 말하면 그대로 옮기되 톤에 주의." },
    { a: ["en", "painkiller"], b: ["en", "analgesic"], relation: "similar", weight: 0.7, note: "뜻은 같고 격식만 다르다. 청자가 누구인지로 고른다." },
    { a: ["ko", "심근경색"], b: ["ko", "심장마비"], relation: "contrast", weight: 0.6, note: "심근경색은 혈관이 막힌 것, 심장마비(심정지)는 심장이 멈춘 것. 환자 말은 그대로 옮기되 의료진이 구분해 물으면 정확히." },
  ],
};
