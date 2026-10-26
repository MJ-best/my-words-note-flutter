# Nuance Graph

다국어 통역사·번역사를 위한 **표현 관계·뉘앙스 그래프**입니다.
단어장을 외우는 대신, 표현과 표현 사이의 관계를 선으로 잇고 **내가 느끼는 적합도**를 가중치로 적어 두는 개인 지식 그래프입니다.

> 예: 한국어 **사랑해**는 일본어 **愛してる**(직역, 적합도 45%)보다 **好き**(일상 고백, 적합도 90%)에 더 가깝다.
> 의료 통역에서 **진통제**는 환자에게는 *painkiller*, 차트에서는 *analgesic*.
> 법률 통역에서 형사 **피고인**과 민사 **피고**는 영어로는 둘 다 *defendant*지만 섞어 쓰면 안 된다.

## 핵심 개념

| 개념 | 설명 |
| --- | --- |
| **표현(노드)** | 한 언어의 단어·구·문장. 언어, 분야(의료/법률/일상), 격식, 내 뉘앙스 메모, ★선호 표시 |
| **관계(엣지)** | 두 표현 사이의 관계. `대응 번역`, `비슷하지만 뉘앙스 다름`, `상위/하위 개념`, `혼동 주의`, `함께 쓰임` |
| **가중치** | 0~100%. 사전의 정답이 아니라 *이 상황에서 내가 느끼는 적합도*. 슬라이더로 언제든 조정 |
| **상황** | 연결마다 붙는 태그(환자 설명, 의료진 간, 법정, 계약서·서면 …). 같은 두 표현이라도 상황별로 연결을 따로 두면 "환자 앞에서는 painkiller 90%, 차트에서는 analgesic 85%"가 됩니다. 패널에서 상황을 고르면 언어별 1순위가 바뀝니다 |
| **사용 +1** | 실제 통역·번역에서 그 대응을 썼을 때 누르면 횟수가 쌓입니다. 내가 실제로 고르는 대응이 데이터로 남습니다 |
| **예문** | 표현이 실제로 쓰인 문장, 내가 옮긴 문장, 상황(진료실, 법정 증인 신문 …) |
| **AI 제안(선택)** | 선택한 표현을 기준으로 다른 언어의 대응 표현과 뉘앙스 차이를 제안받고, 마음에 드는 것만 그래프에 추가 |

그래프에서는 **선의 굵기 = 가중치**, **점선 = 유사·주의**, **화살표 = 상위·하위 개념**, **색 = 언어**입니다.
노드를 클릭하면 그 표현의 연결만 밝게 남고 나머지는 흐려집니다.

## 기술 스택

- **Next.js 16** (App Router, TypeScript) → **Vercel** 배포
- **Firebase** (Firestore + Authentication, Spark 무료 플랜) → 계정별 데이터 분리
- **d3-force** + Canvas 2D → 그래프 렌더링 (외부 그래프 라이브러리 없음)
- (선택) **Claude API** → AI 제안

로그인은 Firebase의 이메일+비밀번호 인증을 사용합니다. 이메일 확인 절차가 없으므로 **아무 이메일 형식과 비밀번호만으로 즉시 계정이 만들어집니다** (OAuth 연동 없음).

## 설치 순서

### 1. Firebase 프로젝트 만들기

1. <https://console.firebase.google.com> 에서 새 프로젝트를 만듭니다 (Spark 무료 플랜, Google Analytics는 꺼도 됩니다).
2. **빌드 → Authentication → 시작하기 → Sign-in method** 에서 **이메일/비밀번호** 를 사용 설정합니다. (이메일 링크 로그인은 끈 채로 둡니다.)
3. **빌드 → Firestore Database → 데이터베이스 만들기** → 위치를 고르고 **프로덕션 모드**로 만듭니다.
4. Firestore의 **규칙** 탭에 [`firestore.rules`](firestore.rules) 내용을 붙여 넣고 **게시**합니다. 이 규칙이 "로그인한 사용자는 자기 데이터만" 을 강제합니다.
5. **프로젝트 설정(톱니바퀴) → 일반 → 내 앱 → 웹 앱 추가(</>)** 로 웹 앱을 등록하고, 표시되는 `firebaseConfig` 값들을 복사합니다.

### 2. 로컬 실행

```bash
cp .env.example .env.local   # 복사한 firebaseConfig 값을 채웁니다
npm install
npm run dev                  # http://localhost:3000
```

Firebase 프로젝트 없이 로컬에서만 돌려 보려면 `.env.local`에 `NEXT_PUBLIC_FIREBASE_USE_EMULATOR=1` 을 추가하고(나머지 값은 아무 문자열이어도 됨, `NEXT_PUBLIC_FIREBASE_PROJECT_ID=demo-nuance`) 다른 터미널에서 에뮬레이터를 띄웁니다.

```bash
npx firebase-tools emulators:start --only auth,firestore --project demo-nuance
```

### 3. Vercel 배포

1. 이 저장소를 GitHub에 올리고 <https://vercel.com> 에서 **Import** 합니다. 프레임워크는 자동으로 Next.js로 잡힙니다.
2. **Environment Variables** 에 아래를 추가합니다.
   - `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`, `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID` — `.env.example` 참고
   - (선택) `ANTHROPIC_API_KEY` — 넣으면 패널에 **AI 제안** 섹션이 나타납니다.
   - (선택) `ANTHROPIC_MODEL` — 기본값 `claude-opus-5-5`. 비용을 낮추려면 `claude-sonnet-5-5` 또는 `claude-haiku-5-5`.
3. Deploy. 이후에는 `main` 브랜치에 push 할 때마다 자동 배포됩니다.

배포 주소에서 로그인이 막히면 Firebase **Authentication → 설정 → 승인된 도메인** 에 Vercel 도메인(`xxx.vercel.app`)을 추가하세요. 이메일/비밀번호 로그인은 보통 추가 없이도 동작합니다.

## 데이터 채우기

- **스타터 팩** (메뉴 ☰ → 스타터 팩 추가): 의료 통역·법률 통역 팩이 들어 있습니다. 한국어·영어·일본어·러시아어 중 원하는 언어만 골라 넣을 수 있고, 가중치·상황·메모는 초안이니 패널에서 고치면 됩니다. 이미 있는 표현은 중복 생성하지 않습니다. 팩 내용은 `lib/packs/*.ts`에 있어 직접 고치거나 새 팩을 추가할 수 있습니다.
- **CSV 용어집 가져오기** (메뉴 ☰ → CSV 용어집 가져오기): Trados, memoQ, 엑셀에서 내보낸 용어집을 넣습니다. `source, target` 두 열만 있으면 되고 `source_lang, target_lang, domain, situation, weight, note, register, relation, example, example_translation` 열은 있으면 함께 읽습니다. 한국어 열 이름(원문, 번역, 분야, 상황, 가중치, 메모, 예문)도 인식하며, 쉼표·탭·세미콜론 구분을 자동 감지합니다. 모달의 "샘플 CSV 받기"로 양식을 받을 수 있습니다.
- **JSON 가져오기/내보내기**: 이 앱의 백업 형식입니다.

## 사용법

- 처음 들어가면 **스타터 팩으로 시작** 또는 **작은 예시 그래프**를 눌러 보세요. 메뉴(☰)에서 언제든 추가하거나 모두 지울 수 있습니다.
- `+ 표현` 또는 빈 캔버스 **더블클릭**으로 표현을 추가합니다. 단축키: `n` 새 표현, `/` 검색, `Esc` 닫기.
- 노드를 클릭 → 오른쪽 패널에서 `+ 연결`로 다른 표현과 잇습니다. 상대 표현이 아직 없으면 그 자리에서 만들어집니다.
- 연결마다 **슬라이더로 적합도**를 조정하고, **뉘앙스 메모**를 클릭해 상황 태그와 "언제 이걸 쓰는지"를 적습니다.
- 상단의 **언어 칩**으로 특정 언어만 보거나 숨기고, **분야** 드롭다운으로 의료/법률만 볼 수 있습니다.
- 메뉴(☰) → **JSON으로 내보내기 / 가져오기**로 백업·복원합니다.

## 프로젝트 구조

```
app/
  page.tsx              # 환경 변수 확인 후 AuthGate 렌더
  login/page.tsx        # 이메일+비밀번호 로그인·가입
  api/suggest/route.ts  # (선택) AI 제안 — Claude API (Firebase ID 토큰 검증)
components/
  AuthGate.tsx          # 로그인 상태 확인, 미로그인 시 /login 으로
  Workspace.tsx         # 상단바(검색·필터) + 캔버스 + 패널 조립
  GraphCanvas.tsx       # d3-force 레이아웃 + Canvas 2D 렌더링, 줌/드래그/선택
  NodePanel.tsx         # 선택한 표현의 연결·가중치·예문
  PackModal.tsx         # 스타터 팩 선택·언어 선택·추가
  ImportCsvModal.tsx    # CSV 용어집 미리보기·가져오기
  NodeForm.tsx, EdgeForm.tsx, SuggestBox.tsx, ...
lib/
  types.ts              # 데이터 타입과 관계/언어 메타데이터
  firebase.ts           # Firebase 초기화 (에뮬레이터 옵션 포함)
  useGraph.ts           # Firestore CRUD 훅 (낙관적 업데이트, 배치 삭제, JSON 내보내기/가져오기)
  seed.ts               # 작은 예시 그래프
  csv.ts                # CSV 파서와 가져오기 변환
  packs/                # 스타터 팩 (medical.ts, legal.ts) 과 컴파일러
firestore.rules         # 본인 데이터만 접근하도록 하는 보안 규칙
legacy-flutter/         # 이전 Flutter 앱 (참고용, 더 이상 사용하지 않음)
```

## 데이터 모델

Firestore 경로: `users/{uid}/nodes/{id}`, `users/{uid}/edges/{id}`, `users/{uid}/examples/{id}`

```
nodes     text, lang, kind(word|phrase|sentence), domain, register, note, preferred, created_at, updated_at
edges     source_id, target_id, relation, weight(0..1), situation, note, uses, created_at, updated_at
examples  node_id, text, translation, situation, source, created_at
```

`relation` 은 source 기준으로 target을 설명합니다. `broader` = target이 더 넓은 개념, `narrower` = target이 더 좁은 개념. 나머지는 대칭입니다.
보안 규칙에 따라 로그인한 사용자는 `users/{자기 uid}` 아래 문서만 읽고 쓸 수 있습니다. 사용자별 그래프를 통째로 불러와 클라이언트에서 다루므로 복합 색인은 필요 없습니다.

## 라이선스

MIT — [LICENSE](LICENSE)
