import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import LancamentoForm from '../components/LancamentoForm'
import Modal from '../components/Modal'
import type { Categoria, Emprestimo, Lancamento } from '../types/database'

function fmt(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function IconEdit() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
      <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
    </svg>
  )
}

function IconTrash() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
      <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
    </svg>
  )
}

export default function DashboardPage() {
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([])
  const [categorias, setCategorias] = useState<Record<string, Categoria>>({})
  const [emprestimos, setEmprestimos] = useState<Emprestimo[]>([])
  const [loading, setLoading] = useState(true)
  const [editingLancamento, setEditingLancamento] = useState<Lancamento | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const hoje = new Date()
  const inicioMes = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-01`
  const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString().slice(0, 10)

  const fetchData = useCallback(async () => {
    const [{ data: lancData }, { data: catData }, { data: empData }] = await Promise.all([
      supabase
        .from('lancamentos')
        .select('*')
        .gte('data', inicioMes)
        .lte('data', fimMes)
        .order('data', { ascending: false })
        .limit(50),
      supabase.from('categorias').select('*'),
      supabase.from('emprestimos').select('*').neq('status', 'quitado'),
    ])

    if (lancData) setLancamentos(lancData)
    if (catData) {
      const map: Record<string, Categoria> = {}
      catData.forEach(c => { map[c.id] = c })
      setCategorias(map)
    }
    if (empData) setEmprestimos(empData)
    setLoading(false)
  }, [inicioMes, fimMes])

  useEffect(() => { fetchData() }, [fetchData])

  async function handleDelete(id: string) {
    await supabase.from('lancamentos').delete().eq('id', id)
    setConfirmDeleteId(null)
    setLancamentos(prev => prev.filter(l => l.id !== id))
  }

  const totalRenda = lancamentos.filter(l => l.tipo === 'renda').reduce((s, l) => s + l.valor, 0)
  const totalDespesa = lancamentos.filter(l => l.tipo === 'despesa').reduce((s, l) => s + l.valor, 0)
  const saldo = totalRenda - totalDespesa

  const totalAReceber = emprestimos
    .filter(e => e.direcao === 'a_receber')
    .reduce((s, e) => s + (e.valor_total - e.valor_pago), 0)
  const totalAPagar = emprestimos
    .filter(e => e.direcao === 'a_pagar')
    .reduce((s, e) => s + (e.valor_total - e.valor_pago), 0)

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

      {/* Resumo de empréstimos */}
      {(totalAReceber > 0 || totalAPagar > 0) && (
        <div className="grid grid-cols-2 gap-4">
          {totalAReceber > 0 && (
            <div className="bg-gray-900 border border-emerald-900/50 rounded-2xl p-4 flex items-center gap-3">
              <span className="text-emerald-500 text-lg">↙</span>
              <div>
                <p className="text-gray-500 text-xs">A receber</p>
                <p className="text-emerald-400 font-bold">{fmt(totalAReceber)}</p>
              </div>
            </div>
          )}
          {totalAPagar > 0 && (
            <div className="bg-gray-900 border border-orange-900/50 rounded-2xl p-4 flex items-center gap-3">
              <span className="text-orange-400 text-lg">↗</span>
              <div>
                <p className="text-gray-500 text-xs">A pagar</p>
                <p className="text-orange-400 font-bold">{fmt(totalAPagar)}</p>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Formulário */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <LancamentoForm onSuccess={fetchData} />
        </div>

        {/* Lista de lançamentos */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-white font-semibold text-lg mb-4">Últimos Lançamentos</h2>

          {loading ? (
            <p className="text-gray-500 text-sm">Carregando…</p>
          ) : lancamentos.length === 0 ? (
            <p className="text-gray-600 text-sm text-center py-8">Nenhum lançamento este mês.</p>
          ) : (
            <ul className="space-y-1 max-h-[520px] overflow-y-auto pr-1">
              {lancamentos.map(l => {
                const cat = l.categoria_id ? categorias[l.categoria_id] : null
                const isConfirmingDelete = confirmDeleteId === l.id

                return (
                  <li
                    key={l.id}
                    className="flex items-center justify-between gap-2 py-2.5 border-b border-gray-800 last:border-0"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-white text-sm font-medium truncate">{l.descricao}</p>
                      <p className="text-gray-500 text-xs">
                        {new Date(l.data + 'T12:00:00').toLocaleDateString('pt-BR')}
                        {cat && ` · ${cat.nome}`}
                        {l.responsavel && ` · ${l.responsavel}`}
                        {l.parcela_atual && l.parcela_total && ` · ${l.parcela_atual}/${l.parcela_total}`}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-sm font-semibold ${l.tipo === 'renda' ? 'text-emerald-400' : 'text-red-400'}`}>
                        {l.tipo === 'renda' ? '+' : '-'}{fmt(l.valor)}
                      </span>

                      {isConfirmingDelete ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDelete(l.id)}
                            className="text-xs px-2 py-1 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors"
                          >
                            Sim
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
                          >
                            Não
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setEditingLancamento(l)}
                            className="p-1.5 text-gray-600 hover:text-violet-400 hover:bg-gray-800 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <IconEdit />
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(l.id)}
                            className="p-1.5 text-gray-600 hover:text-red-400 hover:bg-gray-800 rounded-lg transition-colors"
                            title="Excluir"
                          >
                            <IconTrash />
                          </button>
                        </div>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Modal de edição */}
      {editingLancamento && (
        <Modal title="Editar Lançamento" onClose={() => setEditingLancamento(null)}>
          <LancamentoForm
            lancamento={editingLancamento}
            onSuccess={() => { fetchData(); setEditingLancamento(null) }}
            onClose={() => setEditingLancamento(null)}
          />
        </Modal>
      )}
    </div>
  )
}
