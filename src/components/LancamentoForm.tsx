import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Categoria, TipoFluxo } from '../types/database'

interface Props {
  onSuccess: () => void
}

const RESPONSAVEIS = ['biel', 'jessi', 'casal']

export default function LancamentoForm({ onSuccess }: Props) {
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [tipo, setTipo] = useState<TipoFluxo>('despesa')
  const [descricao, setDescricao] = useState('')
  const [valor, setValor] = useState('')
  const [data, setData] = useState(new Date().toISOString().slice(0, 10))
  const [categoriaId, setCategoriaId] = useState('')
  const [responsavel, setResponsavel] = useState('casal')
  const [parcelaAtual, setParcelaAtual] = useState('')
  const [parcelaTotal, setParcelaTotal] = useState('')
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

    const { error } = await supabase.from('lancamentos').insert({
      descricao,
      valor: parseFloat(valor),
      data,
      tipo,
      categoria_id: categoriaId || null,
      responsavel,
      parcela_atual: parcelaAtual ? parseInt(parcelaAtual) : null,
      parcela_total: parcelaTotal ? parseInt(parcelaTotal) : null,
      recorrente: false,
    })

    if (error) {
      setError(error.message)
    } else {
      setDescricao('')
      setValor('')
      setParcelaAtual('')
      setParcelaTotal('')
      onSuccess()
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
      <h2 className="text-white font-semibold text-lg">Novo Lançamento</h2>

      {/* Tipo */}
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

        <div>
          <input
            type="number"
            value={valor}
            onChange={e => setValor(e.target.value)}
            required
            min="0.01"
            step="0.01"
            placeholder="Valor (R$)"
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>

        <div>
          <input
            type="date"
            value={data}
            onChange={e => setData(e.target.value)}
            required
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>

        <div>
          <select
            value={categoriaId}
            onChange={e => setCategoriaId(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="">Categoria</option>
            {categoriasDoTipo.map(c => (
              <option key={c.id} value={c.id}>{c.grupo} › {c.nome}</option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={responsavel}
            onChange={e => setResponsavel(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            {RESPONSAVEIS.map(r => (
              <option key={r} value={r} className="capitalize">{r}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Parcelas (opcionais) */}
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

      {error && (
        <p className="text-red-400 text-sm">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-colors"
      >
        {loading ? 'Salvando…' : 'Salvar Lançamento'}
      </button>
    </form>
  )
}
