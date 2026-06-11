import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import LancamentoForm from '../components/LancamentoForm'
import type { Categoria, Lancamento } from '../types/database'

function fmt(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function DashboardPage() {
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([])
  const [categorias, setCategorias] = useState<Record<string, Categoria>>({})
  const [loading, setLoading] = useState(true)

  const hoje = new Date()
  const inicioMes = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-01`
  const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString().slice(0, 10)

  const fetchData = useCallback(async () => {
    const [{ data: lancData }, { data: catData }] = await Promise.all([
      supabase
        .from('lancamentos')
        .select('*')
        .gte('data', inicioMes)
        .lte('data', fimMes)
        .order('data', { ascending: false })
        .limit(50),
      supabase.from('categorias').select('*'),
    ])

    if (lancData) setLancamentos(lancData)
    if (catData) {
      const map: Record<string, Categoria> = {}
      catData.forEach(c => { map[c.id] = c })
      setCategorias(map)
    }
    setLoading(false)
  }, [inicioMes, fimMes])

  useEffect(() => { fetchData() }, [fetchData])

  const totalRenda = lancamentos.filter(l => l.tipo === 'renda').reduce((s, l) => s + l.valor, 0)
  const totalDespesa = lancamentos.filter(l => l.tipo === 'despesa').reduce((s, l) => s + l.valor, 0)
  const saldo = totalRenda - totalDespesa

  const mesLabel = hoje.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Resumo do mês */}
      <div>
        <h2 className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-4 capitalize">{mesLabel}</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <p className="text-gray-500 text-xs mb-1">Renda</p>
            <p className="text-emerald-400 text-xl font-bold">{fmt(totalRenda)}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <p className="text-gray-500 text-xs mb-1">Despesas</p>
            <p className="text-red-400 text-xl font-bold">{fmt(totalDespesa)}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <p className="text-gray-500 text-xs mb-1">Saldo</p>
            <p className={`text-xl font-bold ${saldo >= 0 ? 'text-violet-400' : 'text-orange-400'}`}>
              {fmt(saldo)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Formulário */}
        <LancamentoForm onSuccess={fetchData} />

        {/* Lista de lançamentos */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-white font-semibold text-lg mb-4">Últimos Lançamentos</h2>

          {loading ? (
            <p className="text-gray-500 text-sm">Carregando…</p>
          ) : lancamentos.length === 0 ? (
            <p className="text-gray-600 text-sm text-center py-8">Nenhum lançamento este mês.</p>
          ) : (
            <ul className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
              {lancamentos.map(l => {
                const cat = l.categoria_id ? categorias[l.categoria_id] : null
                return (
                  <li
                    key={l.id}
                    className="flex items-center justify-between gap-3 py-2.5 border-b border-gray-800 last:border-0"
                  >
                    <div className="min-w-0">
                      <p className="text-white text-sm font-medium truncate">{l.descricao}</p>
                      <p className="text-gray-500 text-xs">
                        {new Date(l.data + 'T12:00:00').toLocaleDateString('pt-BR')}
                        {cat && ` · ${cat.nome}`}
                        {l.responsavel && ` · ${l.responsavel}`}
                        {l.parcela_atual && l.parcela_total && ` · ${l.parcela_atual}/${l.parcela_total}`}
                      </p>
                    </div>
                    <span className={`shrink-0 text-sm font-semibold ${l.tipo === 'renda' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {l.tipo === 'renda' ? '+' : '-'}{fmt(l.valor)}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
