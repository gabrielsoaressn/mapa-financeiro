create type tipo_fluxo as enum ('renda', 'despesa');

create table categorias (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  grupo text not null,
  tipo tipo_fluxo not null,
  cor text
);

create table lancamentos (
  id uuid primary key default gen_random_uuid(),
  descricao text not null,
  valor numeric(12,2) not null,
  data date not null default current_date,
  tipo tipo_fluxo not null,
  categoria_id uuid references categorias(id),
  responsavel text,
  parcela_atual int,
  parcela_total int,
  recorrente boolean default false,
  observacao text,
  created_by uuid references auth.users(id) default auth.uid(),
  created_at timestamptz default now()
);

create table metas (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  valor_alvo numeric(12,2) not null,
  valor_atual numeric(12,2) default 0,
  data_alvo date,
  observacao text
);

-- RLS: só usuários autenticados (nós dois) acessam tudo
alter table categorias enable row level security;
alter table lancamentos enable row level security;
alter table metas enable row level security;

create policy "casal acessa" on categorias
  for all to authenticated using (true) with check (true);

create policy "casal acessa" on lancamentos
  for all to authenticated using (true) with check (true);

create policy "casal acessa" on metas
  for all to authenticated using (true) with check (true);
