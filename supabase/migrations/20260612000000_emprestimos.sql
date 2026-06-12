create type direcao_emprestimo as enum ('a_receber', 'a_pagar');
create type meio_emprestimo as enum ('pix', 'cartao', 'dinheiro', 'outro');
create type status_emprestimo as enum ('pendente', 'parcial', 'quitado');

create table emprestimos (
  id uuid primary key default gen_random_uuid(),
  descricao text not null,
  pessoa text not null,
  valor_total numeric(12,2) not null,
  valor_pago numeric(12,2) not null default 0,
  direcao direcao_emprestimo not null,
  meio meio_emprestimo not null,
  status status_emprestimo not null default 'pendente',
  data_emprestimo date not null default current_date,
  data_prevista date,
  responsavel text,
  observacao text,
  created_at timestamptz not null default now()
);

alter table emprestimos enable row level security;
create policy "casal acessa" on emprestimos
  for all to authenticated using (true) with check (true);
