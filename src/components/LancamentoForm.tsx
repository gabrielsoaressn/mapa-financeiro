import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Categoria, Lancamento, TipoFluxo } from '../types/database'

interface Props {
  onSuccess: () => void
  lancamento?: Lancamento
  onClose?: () => void
}

const RESPONSAVEIS = ['biel', 'jessi', 'casal']

export default function LancamentoForm({ onSuccess, lancamento, onClose }: Props) {
  const isEdit = !!lancamento

  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [tipo, setTipo] = useState<TipoFluxo>(lancamento?.tipo ?? 'despesa')
  const [descricao, setDescricao] = useState(lancamento?.descricao ?? '')
  const [valor, setValor] = useState(lancamento?.valor.toString() ?? '')
  const [data, setData] = useState(lancamento?.data ?? new Date().toISOString().slice(0, 10))
  const [categoriaId, setCategoriaId] = useState(lancamento?.categoria_id ?? '')
  const [responsavel, setResponsavel] = useState(lancamento?.responsavel ?? 'casal')
  const [parcelaAtual, setParcelaAtual] = useState(lancamento?.parcela_atual?.toString() ?? '')
  const [parcelaTotal, setParcelaTotal] = useState(lancamento?.parcela_total?.toString() ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase.from('categorias').select('*').order('grupo').then(({ data }) => {
      if (data) setCategorias(data)
    })
  }, [])

  const categoriasDoTipo = categorias.filter(c => c.tipo === tipo)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const payload = {
      descricao,
      valor: parseFloat(valor),
      data,
      tipo,
      categoria_id: categoriaId || null,
      responsavel,
      parcela_atual: parcelaAtual ? parseInt(parcelaAtual) : null,
      parcela_total: parcelaTotal ? parseInt(parcelaTotal) : null,
    }

    if (isEdit) {
      const { error } = await supabase.from('lancamentos').update(payload).eq('id', lancamento.id)
      if (error) { setError(error.message) } else { onSuccess(); onClose?.() }
    } else {
      const { error } = await supabase.from('lancamentos').insert({ ...payload, recorrente: false })
      if (error) {
        setError(error.message)
      } else {
        setDescricao('')
        setValor('')
        setParcelaAtual('')
        setParcelaTotal('')
        onSuccess()
      }
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!isEdit && <h2 className="text-white font-semibold text-lg">Novo Lançamento</h2>}

      <div className="flex gap-2">
        {(['despesa', 'renda'] as TipoFluxo[]).map(t => (
          <button
            key={t}
            type="button"
            onClick={() => { setTipo(t); setCategoriaId('') }}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors capitalize ${
              tipo === t
                ? t === 'despesa' ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {t === 'despesa' ? '↓ Despesa' : '↑ Renda'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <input
            value={descricao}
            onChange={e => setDescricao(e.target.value)}
            required
            placeholder="Descrição"
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>

        <input
          type="number"
          value={valor}
          onChange={e => setValor(e.target.value)}
          required
          min="0.01"
          step="0.01"
          placeholder="Valor (R$)"
          className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
        />

        <input
          type="date"
          value={data}
          onChange={e => setData(e.target.value)}
          required
          className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
        />

        <select
          value={categoriaId}
          onChange={e => setCategoriaId(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
        >
          <option value="">Categoria</option>
          {categoriasDoTipo.map(c => (
            <option key={c.id} value={c.id}>{c.grupo} › {c.nome}</option>
          ))}
        </select>

        <select
          value={responsavel}
          onChange={e => setResponsavel(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
        >
          {RESPONSAVEIS.map(r => (
            <option key={r} value={r} className="capitalize">{r}</option>
          ))}
        </select>
      </div>

      <details className="group">
        <summary className="text-gray-500 text-sm cursor-pointer select-none hover:text-gray-300">
          + Parcelas (opcional)
        </summary>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <input
            type="number"
            value={parcelaAtual}
            onChange={e => setParcelaAtual(e.target.value)}
            min="1"
            placeholder="Parcela atual"
            className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
          <input
            type="number"
            value={parcelaTotal}
            onChange={e => setParcelaTotal(e.target.value)}
            min="1"
            placeholder="Total de parcelas"
            className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>
      </details>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <div className="flex gap-3">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold py-2.5 rounded-xl transition-colors"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-colors"
        >
          {loading ? 'Salvando…' : isEdit ? 'Salvar Alterações' : 'Salvar Lançamento'}
        </button>
      </div>
    </form>
  )
}
