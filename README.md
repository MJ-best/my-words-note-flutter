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
| **사용 +1** | 실제 통역·번역에서 그 대응을 썼을 때 누르면 횟수가 쌓입니다. 내가 실제로 고르는 대응이 데이터로 남습니다 |
| **예문** | 표현이 실제로 쓰인 문장, 내가 옮긴 문장, 상황(진료실, 법정 증인 신문 …) |
| **AI 제안(선택)** | 선택한 표현을 기준으로 다른 언어의 대응 표현과 뉘앙스 차이를 제안받고, 마음에 드는 것만 그래프에 추가 |

그래프에서는 **선의 굵기 = 가중치**, **점선 = 유사·주의**, **화살표 = 상위·하위 개념**, **색 = 언어**입니다.
노드를 클릭하면 그 표현의 연결만 밝게 남고 나머지는 흐려집니다.

## 기술 스택

- **Next.js 16** (App Router, TypeScript) → **Vercel** 배포
- **Supabase** (Postgres + Auth + Row Level Security) → 계정별 데이터 분리
- **d3-force** + Canvas 2D → 그래프 렌더링 (외부 그래프 라이브러리 없음)
- (선택) **Claude API** → AI 제안

로그인은 Supabase의 이메일+비밀번호 인증을 사용합니다. 이메일 확인을 꺼 두면 **아무 이메일 형식과 비밀번호만으로 즉시 계정이 만들어집니다** (무료 티어, OAuth 연동 없음).

## 설치 순서

### 1. Supabase 프로젝트 만들기

1. <https://supabase.com> 에서 새 프로젝트를 만듭니다 (Free 플랜).
2. **SQL Editor** 에서 [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) 내용을 붙여 넣고 실행합니다. 테이블 3개(`nodes`, `edges`, `examples`)와 RLS 정책이 만들어집니다.
3. **Authentication → Sign In / Providers → Email** 에서 **Confirm email** 을 **끕니다**. 이걸 꺼야 메일 인증 없이 바로 로그인됩니다.
4. **Project Settings → API** 에서 `Project URL` 과 `anon public` 키(또는 새 형식의 `publishable` 키)를 복사합니다.

### 2. 로컬 실행

```bash
cp .env.example .env.local   # 복사한 URL과 키를 채웁니다
npm install
npm run dev                  # http://localhost:3000
```

### 3. Vercel 배포

1. 이 저장소를 GitHub에 올리고 <https://vercel.com> 에서 **Import** 합니다. 프레임워크는 자동으로 Next.js로 잡힙니다.
2. **Environment Variables** 에 아래를 추가합니다.
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - (선택) `ANTHROPIC_API_KEY` — 넣으면 패널에 **AI 제안** 섹션이 나타납니다.
   - (선택) `ANTHROPIC_MODEL` — 기본값 `claude-opus-5-5`. 비용을 낮추려면 `claude-sonnet-5-5` 또는 `claude-haiku-5-5`.
3. Deploy. 이후에는 `main` 브랜치에 push 할 때마다 자동 배포됩니다.

Supabase 쪽에서 **Authentication → URL Configuration → Site URL** 을 Vercel 주소로 바꿔 두면 좋습니다 (이메일 확인을 끈 상태라면 필수는 아닙니다).

## 사용법

- 처음 들어가면 **예시 그래프로 시작**을 눌러 감정·의료·법률 예시를 넣어 보세요. 메뉴(☰)에서 언제든 추가하거나 모두 지울 수 있습니다.
- `+ 표현` 또는 빈 캔버스 **더블클릭**으로 표현을 추가합니다. 단축키: `n` 새 표현, `/` 검색, `Esc` 닫기.
- 노드를 클릭 → 오른쪽 패널에서 `+ 연결`로 다른 표현과 잇습니다. 상대 표현이 아직 없으면 그 자리에서 만들어집니다.
- 연결마다 **슬라이더로 적합도**를 조정하고, **뉘앙스 메모**를 클릭해 "언제 이걸 쓰는지"를 적습니다.
- 상단의 **언어 칩**으로 특정 언어만 보거나 숨기고, **분야** 드롭다운으로 의료/법률만 볼 수 있습니다.
- 메뉴(☰) → **JSON으로 내보내기 / 가져오기**로 백업·복원합니다.

## 프로젝트 구조

```
app/
  page.tsx              # 로그인 확인 후 작업 공간 렌더
  login/page.tsx        # 이메일+비밀번호 로그인·가입
  api/suggest/route.ts  # (선택) AI 제안 — Claude API
components/
  Workspace.tsx         # 상단바(검색·필터) + 캔버스 + 패널 조립
  GraphCanvas.tsx       # d3-force 레이아웃 + Canvas 2D 렌더링, 줌/드래그/선택
  NodePanel.tsx         # 선택한 표현의 연결·가중치·예문
  NodeForm.tsx, EdgeForm.tsx, SuggestBox.tsx, ...
lib/
  types.ts              # 데이터 타입과 관계/언어 메타데이터
  useGraph.ts           # Supabase CRUD 훅 (낙관적 업데이트, JSON 내보내기/가져오기)
  seed.ts               # 예시 그래프
supabase/migrations/0001_init.sql
legacy-flutter/         # 이전 Flutter 앱 (참고용, 더 이상 사용하지 않음)
```

## 데이터 모델

```
nodes     id, user_id, text, lang, kind(word|phrase|sentence), domain, register, note, preferred
edges     id, user_id, source_id, target_id, relation, weight(0..1), note, uses
examples  id, user_id, node_id, text, translation, situation, source
```

`relation` 은 source 기준으로 target을 설명합니다. `broader` = target이 더 넓은 개념, `narrower` = target이 더 좁은 개념. 나머지는 대칭입니다.
모든 테이블에 RLS가 걸려 있어 로그인한 사용자는 자기 행만 읽고 쓸 수 있습니다.

## 라이선스

MIT — [LICENSE](LICENSE)
