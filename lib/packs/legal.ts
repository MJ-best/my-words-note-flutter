import type { StarterPack } from "./types";

const 법정 = "법정";
const 경찰 = "경찰 조사";
const 서면 = "계약서·서면";
const 상담 = "변호인 상담";

/**
 * 법률 통역 스타터 팩 (ko · en · ja · ru)
 * 형사·민사·가사 절차에서 자주 나오는 표현. 러시아어는 절차 단계에 따라 용어가 갈리는 경우가 많아 상황 태그를 달았습니다.
 */
export const LEGAL_PACK: StarterPack = {
  id: "legal",
  title: "법률 통역",
  description: "법정·경찰 조사·변호인 상담·계약서에서 나오는 표현. 형사와 민사에서 다른 말을 써야 하는 경우를 표시했습니다.",
  domain: "법률",
  langs: ["ko", "en", "ja", "ru"],
  concepts: [
    {
      terms: {
        ko: [{ t: "피고인", register: "legal", note: "형사 재판에서 기소된 사람. 민사의 '피고'와 섞어 쓰면 안 된다." }],
        en: [{ t: "defendant", register: "legal", w: 0.9, situation: 법정, note: "영어는 민사·형사 모두 defendant 한 단어. 한국어로 옮길 때 사건 종류를 먼저 확인." }, { t: "the accused", register: "legal", w: 0.75, why: "영국·호주 등에서 형사 피고인을 가리킬 때." }],
        ja: [{ t: "被告人", register: "legal" }],
        ru: [
          { t: "подсудимый", register: "legal", w: 0.9, situation: 법정, why: "재판 단계의 피고인. 기소 후 법정에서." },
          { t: "обвиняемый", register: "legal", w: 0.75, situation: 경찰, why: "기소(обвинение)된 뒤 재판 전까지. 수사 단계에서는 이 말." },
        ],
      },
      examples: [
        { lang: "ko", text: "피고인은 진술을 거부할 권리가 있습니다.", translation: "The defendant has the right to remain silent.", situation: "형사 법정 · 인정신문" },
        { lang: "ru", text: "Подсудимый, встаньте.", translation: "피고인, 일어서십시오.", situation: "형사 법정" },
      ],
    },
    {
      terms: {
        ko: [{ t: "피고", register: "legal", note: "민사 소송에서 소를 제기당한 쪽." }],
        en: [{ t: "defendant", register: "legal", w: 0.9, situation: 법정 }],
        ja: [{ t: "被告", register: "legal" }],
        ru: [{ t: "ответчик", register: "legal" }],
      },
    },
    {
      terms: {
        ko: [{ t: "원고", register: "legal" }],
        en: [{ t: "plaintiff", register: "legal" }, { t: "claimant", register: "legal", w: 0.75, why: "영국 민사 절차의 용어." }],
        ja: [{ t: "原告", register: "legal" }],
        ru: [{ t: "истец", register: "legal" }],
      },
    },
    {
      terms: {
        ko: [{ t: "피의자", register: "legal", note: "수사 단계. 기소되면 피고인." }, { t: "용의자", register: "casual", why: "언론·일상에서. 법률 문서에서는 피의자." }],
        en: [{ t: "suspect" }],
        ja: [{ t: "被疑者", register: "legal", w: 0.9, situation: 서면 }, { t: "容疑者", register: "casual", w: 0.85, why: "언론·구어. 경찰도 입말로는 容疑者를 쓴다." }],
        ru: [{ t: "подозреваемый", register: "legal" }],
      },
    },
    {
      terms: {
        ko: [{ t: "피해자" }],
        en: [{ t: "victim" }],
        ja: [{ t: "被害者" }],
        ru: [
          { t: "потерпевший", register: "legal", w: 0.9, situation: 법정, why: "형사 절차상 지위로서의 피해자. 조서·판결문·법정." },
          { t: "жертва", register: "casual", w: 0.65, why: "일반적·감정적인 '희생자'. 법정 통역에서는 потерпевший." },
        ],
      },
    },
    {
      terms: {
        ko: [{ t: "증인" }],
        en: [{ t: "witness" }],
        ja: [{ t: "証人" }],
        ru: [{ t: "свидетель" }],
      },
    },
    {
      terms: {
        ko: [{ t: "검사", register: "legal" }],
        en: [{ t: "prosecutor" }, { t: "district attorney", w: 0.7, why: "미국 주 검사. 줄여서 DA." }],
        ja: [{ t: "検察官", register: "legal", w: 0.9, situation: 서면 }, { t: "検事", w: 0.85, why: "직급 명칭이지만 법정에서 호칭으로 흔히 쓴다." }],
        ru: [{ t: "прокурор" }],
      },
    },
    {
      terms: {
        ko: [{ t: "변호사" }],
        en: [{ t: "lawyer", register: "casual", w: 0.85 }, { t: "attorney", w: 0.85, situation: 법정, why: "미국 법정·문서." }, { t: "counsel", register: "legal", w: 0.7, situation: 법정, why: "법정에서 상대 변호인을 부를 때. 'Counsel, approach the bench.'" }],
        ja: [{ t: "弁護士" }, { t: "弁護人", register: "legal", w: 0.8, situation: 법정, why: "형사 절차에서 피고인을 변호하는 지위를 가리킬 때." }],
        ru: [
          { t: "адвокат", w: 0.9, why: "자격을 가진 변호사. 형사 변호는 반드시 адвокат." },
          { t: "юрист", w: 0.6, why: "법률 전문가 일반. 변호사 자격이 없어도 юрист. '우리 회사 юрист'는 사내 법무." },
        ],
      },
    },
    {
      terms: {
        ko: [{ t: "판사" }],
        en: [{ t: "judge" }, { t: "Your Honor", kind: "phrase", w: 0.8, situation: 법정, why: "법정에서 판사를 부를 때." }],
        ja: [{ t: "裁判官", register: "legal" }, { t: "判事", w: 0.8, why: "직급명. 호칭으로는 裁判長(재판장)." }],
        ru: [{ t: "судья" }, { t: "Ваша честь", kind: "phrase", w: 0.8, situation: 법정, why: "러시아 법정에서 판사를 부르는 말." }],
      },
    },
    {
      terms: {
        ko: [{ t: "고소", register: "legal", note: "피해자가 처벌을 구하는 것. 제3자가 하면 고발." }],
        en: [{ t: "file a complaint", kind: "phrase", w: 0.8 }, { t: "press charges", kind: "phrase", register: "casual", w: 0.85, why: "미국 구어. 정식으로는 검사가 기소한다." }],
        ja: [{ t: "告訴", register: "legal" }],
        ru: [{ t: "заявление о преступлении", register: "legal", w: 0.85, situation: 경찰, why: "경찰에 '고소장'을 내는 것 = подать заявление. 영어 complaint와 달리 жалоба는 불복·민원 쪽 뜻." }],
      },
    },
    {
      terms: {
        ko: [{ t: "소송" }],
        en: [{ t: "lawsuit" }, { t: "litigation", register: "legal", w: 0.8, situation: 서면 }],
        ja: [{ t: "訴訟" }],
        ru: [{ t: "иск", w: 0.85, why: "소(訴) 자체. '소를 제기하다' = подать иск." }, { t: "судебный процесс", w: 0.8, why: "절차로서의 소송." }],
      },
    },
    {
      terms: {
        ko: [{ t: "판결" }],
        en: [{ t: "judgment", register: "legal", w: 0.9 }, { t: "verdict", w: 0.75, why: "배심원 평결. 판사의 판결은 judgment/ruling." }],
        ja: [{ t: "判決" }],
        ru: [
          { t: "приговор", register: "legal", w: 0.9, situation: "형사", why: "형사 판결만 приговор." },
          { t: "решение суда", register: "legal", w: 0.9, situation: "민사", why: "민사·행정 판결은 решение." },
        ],
      },
    },
    {
      terms: {
        ko: [{ t: "선고" }],
        en: [{ t: "sentencing", w: 0.85, situation: "형사" }, { t: "pronouncement of judgment", register: "legal", w: 0.7 }],
        ja: [{ t: "宣告", register: "legal" }, { t: "言い渡し", w: 0.85, why: "법정에서 실제로 쓰는 말. 判決の言い渡し." }],
        ru: [{ t: "оглашение приговора", register: "legal", w: 0.85, situation: 법정 }],
      },
    },
    {
      terms: {
        ko: [{ t: "형", register: "legal" }, { t: "형벌", register: "legal" }],
        en: [{ t: "sentence", w: 0.9 }, { t: "penalty", w: 0.7 }],
        ja: [{ t: "刑", register: "legal" }],
        ru: [{ t: "наказание" }],
      },
    },
    {
      terms: {
        ko: [{ t: "벌금" }],
        en: [{ t: "fine" }],
        ja: [{ t: "罰金" }],
        ru: [{ t: "штраф" }],
      },
    },
    {
      terms: {
        ko: [{ t: "징역" }],
        en: [{ t: "imprisonment", register: "legal", w: 0.9 }, { t: "prison sentence", w: 0.85 }],
        ja: [{ t: "懲役", register: "legal" }],
        ru: [{ t: "лишение свободы", register: "legal", w: 0.9, situation: 법정 }, { t: "тюрьма", register: "casual", w: 0.6, why: "구어. 판결문·법정에서는 лишение свободы." }],
      },
    },
    {
      terms: {
        ko: [{ t: "집행유예" }],
        en: [{ t: "suspended sentence", w: 0.9 }, { t: "probation", w: 0.6, why: "미국의 probation은 보호관찰에 가깝다. 집행유예와 완전히 같지 않다." }],
        ja: [{ t: "執行猶予" }],
        ru: [{ t: "условный срок", register: "casual", w: 0.9, why: "일상·법정 구어 모두." }, { t: "условное осуждение", register: "legal", w: 0.85, situation: 서면 }],
      },
    },
    {
      terms: {
        ko: [{ t: "보석" }],
        en: [{ t: "bail" }],
        ja: [{ t: "保釈" }],
        ru: [{ t: "залог", w: 0.85, why: "освобождение под залог. 러시아에서는 드문 제도라 설명이 필요할 때가 있다." }],
      },
    },
    {
      terms: {
        ko: [{ t: "구속", register: "legal", note: "법원 영장으로 신병을 확보하는 것." }],
        en: [{ t: "detention", register: "legal", w: 0.85 }, { t: "custody", w: 0.8, why: "'in custody' = 구금 중." }],
        ja: [{ t: "勾留", register: "legal", w: 0.9, why: "기소 전후의 구속. 일본어 拘留는 다른 뜻(형벌)이라 한자 주의." }],
        ru: [{ t: "заключение под стражу", register: "legal", w: 0.9, situation: 서면 }, { t: "арест", register: "casual", w: 0.8, why: "일상어로는 арест. 법률 문서에서는 заключение под стражу." }],
      },
    },
    {
      terms: {
        ko: [{ t: "체포" }],
        en: [{ t: "arrest" }],
        ja: [{ t: "逮捕" }],
        ru: [
          { t: "задержание", register: "legal", w: 0.9, situation: 경찰, why: "경찰이 현장에서 신병을 확보하는 것(최대 48시간). 한국어 '체포'에 해당." },
          { t: "арест", w: 0.7, why: "러시아 법에서 арест는 법원이 결정하는 구금. 영화 때문에 '체포'로 알지만 통역에서는 구분." },
        ],
      },
    },
    {
      terms: {
        ko: [{ t: "묵비권" }, { t: "진술거부권", register: "legal" }],
        en: [{ t: "right to remain silent", kind: "phrase" }],
        ja: [{ t: "黙秘権" }],
        ru: [{ t: "право не свидетельствовать против себя", kind: "phrase", register: "legal", w: 0.85, why: "헌법 51조. 러시아 경찰·법정에서 고지하는 문구." }, { t: "право хранить молчание", kind: "phrase", w: 0.7, why: "미국식 미란다 번역. 러시아 절차에서는 51조 표현이 정확." }],
      },
    },
    {
      terms: {
        ko: [{ t: "진술" }],
        en: [{ t: "statement" }, { t: "testimony", w: 0.8, situation: 법정, why: "법정에서 선서하고 하는 진술." }],
        ja: [{ t: "供述", register: "legal", w: 0.9, situation: 경찰, why: "형사 절차의 진술. 조서 = 供述調書." }, { t: "陳述", w: 0.8, why: "민사·일반." }],
        ru: [{ t: "показания", register: "legal", w: 0.9, why: "수사·법정에서 하는 진술. 복수형으로 쓴다." }, { t: "заявление", w: 0.6, why: "서면 신청·성명. 증언의 뜻은 아니다." }],
      },
    },
    {
      terms: {
        ko: [{ t: "증거" }],
        en: [{ t: "evidence" }],
        ja: [{ t: "証拠" }],
        ru: [{ t: "доказательство", register: "legal", w: 0.9, situation: 법정 }, { t: "улика", w: 0.7, situation: 경찰, why: "물적 증거·단서. 수사 단계와 구어." }],
      },
    },
    {
      terms: {
        ko: [{ t: "영장" }],
        en: [{ t: "warrant" }],
        ja: [{ t: "令状" }],
        ru: [{ t: "ордер", register: "casual", w: 0.7, why: "영화·구어. 러시아 절차에서는 법원의 постановление(결정)이 영장 역할." }, { t: "постановление суда", register: "legal", w: 0.8, situation: 서면 }],
      },
    },
    {
      terms: {
        ko: [{ t: "기소" }],
        en: [{ t: "indictment", register: "legal", w: 0.85 }, { t: "prosecution", w: 0.8 }],
        ja: [{ t: "起訴" }],
        ru: [{ t: "предъявление обвинения", register: "legal", w: 0.8, why: "혐의를 정식으로 적용하는 단계." }, { t: "обвинительное заключение", register: "legal", w: 0.75, situation: 서면, why: "공소장에 해당하는 문서." }],
      },
    },
    {
      terms: {
        ko: [{ t: "불기소" }],
        en: [{ t: "non-prosecution", register: "legal", w: 0.8 }, { t: "charges dropped", kind: "phrase", register: "casual", w: 0.8 }],
        ja: [{ t: "不起訴" }],
        ru: [{ t: "прекращение уголовного дела", register: "legal", w: 0.8 }, { t: "отказ в возбуждении уголовного дела", register: "legal", w: 0.75, why: "애초에 사건을 열지 않는 결정." }],
      },
    },
    {
      terms: {
        ko: [{ t: "무죄" }],
        en: [{ t: "not guilty", kind: "phrase", w: 0.9, situation: 법정 }, { t: "acquittal", register: "legal", w: 0.8 }],
        ja: [{ t: "無罪" }],
        ru: [{ t: "невиновен", w: 0.85, situation: 법정 }, { t: "оправдательный приговор", register: "legal", w: 0.8, situation: 서면 }],
      },
    },
    {
      terms: {
        ko: [{ t: "유죄" }],
        en: [{ t: "guilty", w: 0.9, situation: 법정 }, { t: "conviction", register: "legal", w: 0.8 }],
        ja: [{ t: "有罪" }],
        ru: [{ t: "виновен", w: 0.85, situation: 법정 }, { t: "обвинительный приговор", register: "legal", w: 0.8, situation: 서면 }],
      },
    },
    {
      terms: {
        ko: [{ t: "항소" }, { t: "상고", register: "legal", why: "2심 판결에 대한 불복은 상고." }],
        en: [{ t: "appeal" }],
        ja: [{ t: "控訴", register: "legal", w: 0.9 }, { t: "上告", register: "legal", w: 0.6, why: "최고재판소로의 불복. 한국어 상고에 해당." }],
        ru: [{ t: "апелляция", w: 0.9 }, { t: "кассация", register: "legal", w: 0.6, why: "상고에 가까운 단계." }],
      },
    },
    {
      terms: {
        ko: [{ t: "합의", note: "형사에서는 피해자와의 합의, 민사에서는 당사자 간 화해. 상대 언어에서는 전혀 다른 말이 된다." }],
        en: [{ t: "settlement", w: 0.85, situation: "민사" }, { t: "agreement with the victim", kind: "phrase", w: 0.7, situation: "형사", why: "영미법에는 한국식 형사 합의 제도가 없어 풀어서 설명해야 한다." }],
        ja: [{ t: "示談", w: 0.9, why: "법정 밖 합의. 형사 피해자 합의도 示談." }, { t: "和解", register: "legal", w: 0.8, situation: 법정, why: "법원이 관여하는 화해." }],
        ru: [{ t: "примирение с потерпевшим", register: "legal", w: 0.85, situation: "형사" }, { t: "мировое соглашение", register: "legal", w: 0.85, situation: "민사" }],
      },
    },
    {
      terms: {
        ko: [{ t: "계약" }],
        en: [{ t: "contract" }, { t: "agreement", w: 0.8, situation: 서면 }],
        ja: [{ t: "契約" }],
        ru: [{ t: "договор", register: "legal", w: 0.9, why: "민법상 정식 용어. 모든 계약서는 договор." }, { t: "контракт", w: 0.7, why: "구어·상업·고용 계약에서. 외국과의 계약 느낌." }],
      },
    },
    {
      terms: {
        ko: [{ t: "손해배상" }],
        en: [{ t: "damages", register: "legal", w: 0.9, why: "복수형 damages = 배상금. damage(단수)는 손해 자체." }, { t: "compensation", w: 0.8 }],
        ja: [{ t: "損害賠償" }],
        ru: [{ t: "возмещение ущерба", register: "legal", w: 0.9 }, { t: "компенсация", w: 0.8 }],
      },
    },
    {
      terms: {
        ko: [{ t: "위자료", note: "정신적 손해에 대한 배상. 이혼 위자료도 여기. 양육비와 다르다." }],
        en: [{ t: "compensation for emotional distress", kind: "phrase", register: "legal", w: 0.8 }, { t: "alimony", w: 0.4, why: "이혼 후 배우자 부양비. 한국 위자료와 성격이 달라 그대로 쓰면 오해." }],
        ja: [{ t: "慰謝料" }],
        ru: [{ t: "компенсация морального вреда", register: "legal", w: 0.85 }],
      },
    },
    {
      terms: {
        ko: [{ t: "양육비" }],
        en: [{ t: "child support" }],
        ja: [{ t: "養育費" }],
        ru: [{ t: "алименты", note: "주로 양육비를 뜻한다. 위자료로 옮기면 안 된다." }],
      },
    },
    {
      terms: {
        ko: [{ t: "이혼" }],
        en: [{ t: "divorce" }],
        ja: [{ t: "離婚" }],
        ru: [{ t: "развод", register: "casual", w: 0.9 }, { t: "расторжение брака", register: "legal", w: 0.85, situation: 서면 }],
      },
    },
    {
      terms: {
        ko: [{ t: "상속" }],
        en: [{ t: "inheritance" }],
        ja: [{ t: "相続" }],
        ru: [{ t: "наследство", w: 0.9, why: "상속 재산." }, { t: "наследование", register: "legal", w: 0.8, why: "상속이라는 절차·제도." }],
      },
    },
    {
      terms: {
        ko: [{ t: "유언" }, { t: "유언장" }],
        en: [{ t: "will" }],
        ja: [{ t: "遺言" }],
        ru: [{ t: "завещание" }],
      },
    },
    {
      terms: {
        ko: [{ t: "선서" }],
        en: [{ t: "oath" }, { t: "swear in", kind: "phrase", w: 0.8, situation: 법정 }],
        ja: [{ t: "宣誓" }],
        ru: [{ t: "присяга", w: 0.75, note: "러시아 법정에서 증인은 선서 대신 허위 진술 책임을 고지받는다(предупреждение об ответственности). 통역인도 마찬가지." }],
      },
    },
    {
      terms: {
        ko: [{ t: "위증" }],
        en: [{ t: "perjury" }],
        ja: [{ t: "偽証" }],
        ru: [{ t: "лжесвидетельство", w: 0.85 }, { t: "заведомо ложные показания", kind: "phrase", register: "legal", w: 0.85, situation: 서면, why: "형법 307조 표현." }],
      },
    },
    {
      terms: {
        ko: [{ t: "과실", register: "legal" }],
        en: [{ t: "negligence" }],
        ja: [{ t: "過失", register: "legal" }],
        ru: [
          { t: "неосторожность", register: "legal", w: 0.85, situation: "형사", why: "형법상 과실." },
          { t: "халатность", w: 0.6, why: "직무 태만. 공무원·의료진 과실에 자주 쓰는 말." },
          { t: "небрежность", w: 0.6, why: "민사·일상적 부주의." },
        ],
      },
    },
    {
      terms: {
        ko: [{ t: "고의", register: "legal" }],
        en: [{ t: "intent", register: "legal", w: 0.9 }, { t: "willfully", w: 0.75, situation: 서면 }],
        ja: [{ t: "故意", register: "legal" }],
        ru: [{ t: "умысел", register: "legal", w: 0.9 }, { t: "умышленно", w: 0.85, why: "부사형. '고의로' 했다." }],
      },
    },
    {
      terms: {
        ko: [{ t: "정당방위" }],
        en: [{ t: "self-defense" }],
        ja: [{ t: "正当防衛" }],
        ru: [{ t: "необходимая оборона", register: "legal", w: 0.9, situation: 법정, why: "형법상 정식 용어." }, { t: "самооборона", register: "casual", w: 0.8, why: "일상어." }],
      },
    },
    {
      terms: {
        ko: [{ t: "공소시효" }],
        en: [{ t: "statute of limitations" }],
        ja: [{ t: "公訴時効" }],
        ru: [{ t: "срок давности" }],
      },
    },
    {
      terms: {
        ko: [{ t: "법정" }],
        en: [{ t: "courtroom", w: 0.9 }, { t: "court", w: 0.85, why: "법원·법정 둘 다." }],
        ja: [{ t: "法廷" }],
        ru: [{ t: "зал суда", w: 0.9 }, { t: "суд", w: 0.85 }],
      },
    },
    {
      terms: {
        ko: [{ t: "통역인", note: "법정에서의 공식 지위. 영어 interpreter(구두)와 translator(문서)는 구분한다." }],
        en: [{ t: "interpreter", w: 0.95 }, { t: "translator", w: 0.4, why: "문서 번역가. 법정 통역인을 translator라고 하면 정정하는 것이 좋다." }],
        ja: [{ t: "通訳人", register: "legal", w: 0.9, situation: 법정 }, { t: "通訳", w: 0.85 }],
        ru: [{ t: "переводчик", note: "러시아어는 통역·번역 모두 переводчик. 구분하려면 устный/письменный переводчик." }],
      },
    },
  ],
  links: [
    { a: ["ko", "피고인"], b: ["ko", "피고"], relation: "contrast", weight: 0.9, note: "형사=피고인, 민사=피고. 법정에서 섞어 쓰면 바로 지적받는다." },
    { a: ["ja", "被告人"], b: ["ja", "被告"], relation: "contrast", weight: 0.9, note: "일본어도 형사 被告人 / 민사 被告로 구분한다." },
    { a: ["ru", "подсудимый"], b: ["ru", "ответчик"], relation: "contrast", weight: 0.9, note: "형사 подсудимый / 민사 ответчик. 영어와 달리 러시아어도 구분한다." },
    { a: ["ru", "подозреваемый"], b: ["ru", "обвиняемый"], relation: "contrast", weight: 0.8, note: "수사 초기 подозреваемый → 혐의 적용 뒤 обвиняемый → 재판 단계 подсудимый. 절차 단계로 말이 바뀐다." },
    { a: ["ko", "피의자"], b: ["ko", "피고인"], relation: "contrast", weight: 0.8, note: "기소 전 피의자, 기소 후 피고인." },
    { a: ["ko", "위자료"], b: ["ko", "양육비"], relation: "contrast", weight: 0.9, note: "위자료는 정신적 손해 배상, 양육비는 자녀 부양. 러시아어 алименты는 양육비." },
    { a: ["ru", "адвокат"], b: ["ru", "юрист"], relation: "contrast", weight: 0.8, note: "адвокат는 자격이 있는 변호사, юрист는 법률 전문가 일반." },
    { a: ["ru", "потерпевший"], b: ["ru", "жертва"], relation: "similar", weight: 0.7, note: "법정·조서에서는 потерпевший. жертва는 감정적·일반적." },
    { a: ["ru", "приговор"], b: ["ru", "решение суда"], relation: "contrast", weight: 0.85, note: "형사 판결 приговор / 민사 판결 решение. 바꿔 쓰면 틀린 말이 된다." },
    { a: ["ru", "задержание"], b: ["ru", "арест"], relation: "contrast", weight: 0.85, note: "задержание = 경찰의 현장 체포(48시간), арест = 법원의 구금 결정." },
    { a: ["en", "interpreter"], b: ["en", "translator"], relation: "contrast", weight: 0.8, note: "통역 interpreter / 번역 translator." },
    { a: ["ko", "고의"], b: ["ko", "과실"], relation: "contrast", weight: 0.8 },
    { a: ["ko", "무죄"], b: ["ko", "유죄"], relation: "contrast", weight: 0.7 },
    { a: ["ko", "항소"], b: ["ko", "상고"], relation: "contrast", weight: 0.7, note: "1심→2심 항소, 2심→3심 상고." },
    { a: ["en", "damages"], b: ["en", "compensation"], relation: "similar", weight: 0.7, note: "damages는 법원이 명하는 배상금, compensation은 넓은 의미의 보상." },
  ],
};
