import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Modal from '../components/Modal'
import type { DirecaoEmprestimo, Emprestimo, MeioEmprestimo, StatusEmprestimo } from '../types/database'

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function calcStatus(pago: number, total: number): StatusEmprestimo {
  if (pago <= 0) return 'pendente'
  if (pago >= total) return 'quitado'
  return 'parcial'
}

const MEIOS: { value: MeioEmprestimo; label: string }[] = [
  { value: 'pix', label: 'Pix' },
  { value: 'cartao', label: 'Cartão' },
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'outro', label: 'Outro' },
]

const STATUS_STYLE: Record<StatusEmprestimo, string> = {
  pendente: 'bg-gray-800 text-gray-400',
  parcial: 'bg-amber-900/50 text-amber-400',
  quitado: 'bg-emerald-900/50 text-emerald-400',
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

const RESPONSAVEIS = ['biel', 'jessi', 'casal']

interface FormState {
  descricao: string
  pessoa: string
  valorTotal: string
  direcao: DirecaoEmprestimo
  meio: MeioEmprestimo
  dataPrevista: string
  responsavel: string
  observacao: string
}

const FORM_VAZIO: FormState = {
  descricao: '',
  pessoa: '',
  valorTotal: '',
  direcao: 'a_receber',
  meio: 'pix',
  dataPrevista: '',
  responsavel: 'casal',
  observacao: '',
}

function formFromEmprestimo(e: Emprestimo): FormState {
  return {
    descricao: e.descricao,
    pessoa: e.pessoa,
    valorTotal: e.valor_total.toString(),
    direcao: e.direcao,
    meio: e.meio,
    dataPrevista: e.data_prevista ?? '',
    responsavel: e.responsavel ?? 'casal',
    observacao: e.observacao ?? '',
  }
}

function EmprestimoForm({
  initial,
  onSave,
  onCancel,
  loading,
  error,
}: {
  initial: FormState
  onSave: (f: FormState) => void
  onCancel: () => void
  loading: boolean
  error: string | null
}) {
  const [f, setF] = useState<FormState>(initial)
  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setF(prev => ({ ...prev, [k]: e.target.value }))

  return (
    <form
      onSubmit={e => { e.preventDefault(); onSave(f) }}
      className="space-y-4"
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <input
            value={f.descricao}
            onChange={set('descricao')}
            required
            placeholder="Descrição"
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>

        <input
          value={f.pessoa}
          onChange={set('pessoa')}
          required
          placeholder="Pessoa"
          className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
        />

        <input
          type="number"
          value={f.valorTotal}
          onChange={set('valorTotal')}
          required
          min="0.01"
          step="0.01"
          placeholder="Valor total (R$)"
          className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
        />

        <select
          value={f.direcao}
          onChange={set('direcao')}
          className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
        >
          <option value="a_receber">↙ Me devem</option>
          <option value="a_pagar">↗ Eu devo</option>
        </select>

        <select
          value={f.meio}
          onChange={set('meio')}
          className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
        >
          {MEIOS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>

        <input
          type="date"
          value={f.dataPrevista}
          onChange={set('dataPrevista')}
          placeholder="Previsão"
          className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
        />

        <select
          value={f.responsavel}
          onChange={set('responsavel')}
          className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
        >
          {RESPONSAVEIS.map(r => <option key={r} value={r}>{r}</option>)}
        </select>

        <div className="col-span-2">
          <textarea
            value={f.observacao}
            onChange={set('observacao')}
            rows={2}
            placeholder="Observação (opcional)"
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
          />
        </div>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold py-2.5 rounded-xl transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-colors"
        >
          {loading ? 'Salvando…' : 'Salvar'}
        </button>
      </div>
    </form>
  )
}

function EmprestimoCard({
  e,
  onEdit,
  onDelete,
  onPagamento,
}: {
  e: Emprestimo
  onEdit: () => void
  onDelete: () => void
  onPagamento: () => void
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const restante = e.valor_total - e.valor_pago
  const meio = MEIOS.find(m => m.value === e.meio)?.label ?? e.meio

  return (
    <div className={`bg-gray-900/60 border rounded-xl p-4 space-y-2 ${e.status === 'quitado' ? 'border-gray-800 opacity-60' : 'border-gray-700'}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-white font-medium text-sm">{e.pessoa}</p>
          <p className="text-gray-500 text-xs">{e.descricao} · {meio}{e.responsavel ? ` · ${e.responsavel}` : ''}</p>
          {e.data_prevista && (
            <p className="text-gray-600 text-xs">
              Previsto: {new Date(e.data_prevista + 'T12:00:00').toLocaleDateString('pt-BR')}
            </p>
          )}
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${STATUS_STYLE[e.status]}`}>
          {e.status}
        </span>
      </div>

      <div className="flex gap-4 text-xs text-gray-400">
        <span>Total <span className="text-white font-medium">{fmt(e.valor_total)}</span></span>
        <span>Pago <span className="text-emerald-400 font-medium">{fmt(e.valor_pago)}</span></span>
        <span>Restante <span className="text-amber-400 font-medium">{fmt(restante)}</span></span>
      </div>

      {e.observacao && <p className="text-gray-600 text-xs italic">{e.observacao}</p>}

      <div className="flex items-center gap-2 pt-1">
        {e.status !== 'quitado' && (
          <button
            onClick={onPagamento}
            className="text-xs px-3 py-1.5 bg-emerald-900/40 hover:bg-emerald-900/70 text-emerald-400 rounded-lg transition-colors font-medium"
          >
            + Pagamento
          </button>
        )}
        <div className="ml-auto flex gap-1">
          <button
            onClick={onEdit}
            className="p-1.5 text-gray-600 hover:text-violet-400 hover:bg-gray-800 rounded-lg transition-colors"
            title="Editar"
          >
            <IconEdit />
          </button>
          {confirmDelete ? (
            <>
              <button onClick={onDelete} className="text-xs px-2 py-1 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors">Sim</button>
              <button onClick={() => setConfirmDelete(false)} className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors">Não</button>
            </>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="p-1.5 text-gray-600 hover:text-red-400 hover:bg-gray-800 rounded-lg transition-colors"
              title="Excluir"
            >
              <IconTrash />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function EmprestimosPage() {
  const [emprestimos, setEmprestimos] = useState<Emprestimo[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [editingEmprestimo, setEditingEmprestimo] = useState<Emprestimo | null>(null)
  const [pagamentoId, setPagamentoId] = useState<string | null>(null)
  const [pagamentoValor, setPagamentoValor] = useState('')
  const [pagamentoLoading, setPagamentoLoading] = useState(false)

  const fetchData = useCallback(async () => {
    const { data } = await supabase
      .from('emprestimos')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setEmprestimos(data)
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  async function handleCreate(f: FormState) {
    setFormLoading(true)
    setFormError(null)
    const { error } = await supabase.from('emprestimos').insert({
      descricao: f.descricao,
      pessoa: f.pessoa,
      valor_total: parseFloat(f.valorTotal),
      direcao: f.direcao,
      meio: f.meio,
      data_prevista: f.dataPrevista || null,
      responsavel: f.responsavel || null,
      observacao: f.observacao || null,
    })
    if (error) { setFormError(error.message) } else { setShowForm(false); fetchData() }
    setFormLoading(false)
  }

  async function handleEdit(f: FormState) {
    if (!editingEmprestimo) return
    setFormLoading(true)
    setFormError(null)
    const { error } = await supabase.from('emprestimos').update({
      descricao: f.descricao,
      pessoa: f.pessoa,
      valor_total: parseFloat(f.valorTotal),
      direcao: f.direcao,
      meio: f.meio,
      data_prevista: f.dataPrevista || null,
      responsavel: f.responsavel || null,
      observacao: f.observacao || null,
    }).eq('id', editingEmprestimo.id)
    if (error) { setFormError(error.message) } else { setEditingEmprestimo(null); fetchData() }
    setFormLoading(false)
  }

  async function handleDelete(id: string) {
    await supabase.from('emprestimos').delete().eq('id', id)
    setEmprestimos(prev => prev.filter(e => e.id !== id))
  }

  async function handlePagamento() {
    const emp = emprestimos.find(e => e.id === pagamentoId)
    if (!emp) return
    const adicionar = parseFloat(pagamentoValor)
    if (!adicionar || adicionar <= 0) return
    setPagamentoLoading(true)
    const novoValorPago = Math.min(emp.valor_pago + adicionar, emp.valor_total)
    const novoStatus = calcStatus(novoValorPago, emp.valor_total)
    await supabase.from('emprestimos').update({ valor_pago: novoValorPago, status: novoStatus }).eq('id', emp.id)
    setPagamentoId(null)
    setPagamentoValor('')
    setPagamentoLoading(false)
    fetchData()
  }

  const aReceber = emprestimos.filter(e => e.direcao === 'a_receber')
  const aPagar = emprestimos.filter(e => e.direcao === 'a_pagar')

  const totalAReceber = aReceber.filter(e => e.status !== 'quitado').reduce((s, e) => s + (e.valor_total - e.valor_pago), 0)
  const totalAPagar = aPagar.filter(e => e.status !== 'quitado').reduce((s, e) => s + (e.valor_total - e.valor_pago), 0)

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Totais */}
      <div>
        <h1 className="text-white text-xl font-bold mb-4">Empréstimos & Contas a Receber</h1>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-900 border border-emerald-900/50 rounded-2xl p-5">
            <p className="text-gray-500 text-xs mb-1">Total a receber</p>
            <p className="text-emerald-400 text-2xl font-bold">{fmt(totalAReceber)}</p>
          </div>
          <div className="bg-gray-900 border border-orange-900/50 rounded-2xl p-5">
            <p className="text-gray-500 text-xs mb-1">Total a pagar</p>
            <p className="text-orange-400 text-2xl font-bold">{fmt(totalAPagar)}</p>
          </div>
        </div>
      </div>

      {/* Botão novo */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="w-full bg-violet-600 hover:bg-violet-500 text-white font-semibold py-3 rounded-2xl transition-colors"
        >
          + Novo Empréstimo
        </button>
      )}

      {/* Formulário de criação */}
      {showForm && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-white font-semibold text-lg mb-4">Novo Empréstimo</h2>
          <EmprestimoForm
            initial={FORM_VAZIO}
            onSave={handleCreate}
            onCancel={() => { setShowForm(false); setFormError(null) }}
            loading={formLoading}
            error={formError}
          />
        </div>
      )}

      {loading ? (
        <p className="text-gray-500 text-sm">Carregando…</p>
      ) : (
        <>
          {/* A Receber */}
          <div className="space-y-3">
            <h2 className="text-gray-400 text-sm font-medium uppercase tracking-wider flex items-center gap-2">
              <span className="text-emerald-500">↙</span> A Receber
              {aReceber.length > 0 && <span className="text-gray-600">({aReceber.length})</span>}
            </h2>
            {aReceber.length === 0 ? (
              <p className="text-gray-600 text-sm">Nenhum.</p>
            ) : (
              aReceber.map(e => (
                <EmprestimoCard
                  key={e.id}
                  e={e}
                  onEdit={() => setEditingEmprestimo(e)}
                  onDelete={() => handleDelete(e.id)}
                  onPagamento={() => { setPagamentoId(e.id); setPagamentoValor('') }}
                />
              ))
            )}
          </div>

          {/* A Pagar */}
          <div className="space-y-3">
            <h2 className="text-gray-400 text-sm font-medium uppercase tracking-wider flex items-center gap-2">
              <span className="text-orange-400">↗</span> A Pagar
              {aPagar.length > 0 && <span className="text-gray-600">({aPagar.length})</span>}
            </h2>
            {aPagar.length === 0 ? (
              <p className="text-gray-600 text-sm">Nenhum.</p>
            ) : (
              aPagar.map(e => (
                <EmprestimoCard
                  key={e.id}
                  e={e}
                  onEdit={() => setEditingEmprestimo(e)}
                  onDelete={() => handleDelete(e.id)}
                  onPagamento={() => { setPagamentoId(e.id); setPagamentoValor('') }}
                />
              ))
            )}
          </div>
        </>
      )}

      {/* Modal editar */}
      {editingEmprestimo && (
        <Modal title="Editar Empréstimo" onClose={() => { setEditingEmprestimo(null); setFormError(null) }}>
          <EmprestimoForm
            initial={formFromEmprestimo(editingEmprestimo)}
            onSave={handleEdit}
            onCancel={() => { setEditingEmprestimo(null); setFormError(null) }}
            loading={formLoading}
            error={formError}
          />
        </Modal>
      )}

      {/* Modal pagamento */}
      {pagamentoId && (
        <Modal title="Registrar Pagamento" onClose={() => setPagamentoId(null)}>
          {(() => {
            const emp = emprestimos.find(e => e.id === pagamentoId)!
            return (
              <div className="space-y-4">
                <div className="bg-gray-800 rounded-xl p-4 text-sm space-y-1">
                  <p className="text-white font-medium">{emp.pessoa} — {emp.descricao}</p>
                  <p className="text-gray-400">Restante: <span className="text-amber-400 font-medium">{fmt(emp.valor_total - emp.valor_pago)}</span></p>
                </div>
                <input
                  type="number"
                  value={pagamentoValor}
                  onChange={e => setPagamentoValor(e.target.value)}
                  min="0.01"
                  step="0.01"
                  placeholder="Valor pago agora (R$)"
                  autoFocus
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => setPagamentoId(null)}
                    className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold py-2.5 rounded-xl transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handlePagamento}
                    disabled={pagamentoLoading || !pagamentoValor}
                    className="flex-1 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-colors"
                  >
                    {pagamentoLoading ? 'Salvando…' : 'Registrar'}
                  </button>
                </div>
              </div>
            )
          })()}
        </Modal>
      )}
    </div>
  )
}
