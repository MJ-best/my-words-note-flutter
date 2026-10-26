-- Nuance Graph: 다국어 표현 관계 그래프
-- Supabase SQL Editor에 그대로 붙여 넣어 실행하세요.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------
-- 표현(노드): 한 언어의 단어·구·문장 하나
-- ---------------------------------------------------------------
create table if not exists public.nodes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  text        text not null,
  lang        text not null,                                   -- ko, ja, en, zh, ...
  kind        text not null default 'word'
              check (kind in ('word', 'phrase', 'sentence')),
  domain      text,                                            -- 의료, 법률, 일상 ...
  register    text,                                            -- formal, casual, clinical, written, spoken
  note        text,                                            -- 내가 느끼는 뉘앙스 메모
  preferred   boolean not null default false,                  -- 내가 선호하는 표현
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------
-- 관계(엣지): 두 표현 사이의 관계 + 내가 매긴 가중치
--   relation 의미 (source 기준으로 target을 설명)
--   equivalent  : 대응 번역 (weight = 이 상황에서 내가 느끼는 적합도)
--   similar     : 비슷하지만 뉘앙스가 다름 (note에 차이를 적음)
--   broader     : target이 source의 상위 개념
--   narrower    : target이 source의 하위 개념
--   contrast    : 혼동 주의 / 반대 / 쓰면 안 되는 경우
--   collocation : 함께 쓰이는 표현
-- ---------------------------------------------------------------
create table if not exists public.edges (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  source_id   uuid not null references public.nodes(id) on delete cascade,
  target_id   uuid not null references public.nodes(id) on delete cascade,
  relation    text not null
              check (relation in ('equivalent', 'similar', 'broader', 'narrower', 'contrast', 'collocation')),
  weight      real not null default 0.5 check (weight >= 0 and weight <= 1),
  note        text,                                            -- 뉘앙스 차이 설명
  uses        integer not null default 0,                      -- 실제로 이 대응을 사용한 횟수
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint edges_no_self_loop check (source_id <> target_id)
);

-- ---------------------------------------------------------------
-- 예문: 표현이 실제로 쓰인 문장과 상황
-- ---------------------------------------------------------------
create table if not exists public.examples (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  node_id     uuid not null references public.nodes(id) on delete cascade,
  text        text not null,                                   -- 원문 예문
  translation text,                                            -- 내가 통역/번역한 문장
  situation   text,                                            -- 진료실, 법정 증인 신문 ...
  source      text,                                            -- 출처
  created_at  timestamptz not null default now()
);

create index if not exists nodes_user_idx     on public.nodes(user_id);
create index if not exists edges_user_idx     on public.edges(user_id);
create index if not exists edges_source_idx   on public.edges(source_id);
create index if not exists edges_target_idx   on public.edges(target_id);
create index if not exists examples_node_idx  on public.examples(node_id);
create index if not exists examples_user_idx  on public.examples(user_id);

-- updated_at 자동 갱신
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists nodes_set_updated_at on public.nodes;
create trigger nodes_set_updated_at before update on public.nodes
  for each row execute function public.set_updated_at();

drop trigger if exists edges_set_updated_at on public.edges;
create trigger edges_set_updated_at before update on public.edges
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------
-- Row Level Security: 모든 데이터는 본인 것만 읽고 쓸 수 있음
-- ---------------------------------------------------------------
alter table public.nodes    enable row level security;
alter table public.edges    enable row level security;
alter table public.examples enable row level security;

drop policy if exists "nodes: owner" on public.nodes;
create policy "nodes: owner" on public.nodes
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "edges: owner" on public.edges;
create policy "edges: owner" on public.edges
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "examples: owner" on public.examples;
create policy "examples: owner" on public.examples
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
