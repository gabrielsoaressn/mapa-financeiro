import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Meta } from '../types/database'

function fmt(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function MetasPage() {
  const [metas, setMetas] = useState<Meta[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [titulo, setTitulo] = useState('')
  const [valorAlvo, setValorAlvo] = useState('')
  const [valorAtual, setValorAtual] = useState('')
  const [dataAlvo, setDataAlvo] = useState('')
  const [saving, setSaving] = useState(false)

  async function fetchMetas() {
    const { data } = await supabase.from('metas').select('*').order('titulo')
    if (data) setMetas(data)
    setLoading(false)
  }

  useEffect(() => { fetchMetas() }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await supabase.from('metas').insert({
      titulo,
      valor_alvo: parseFloat(valorAlvo),
      valor_atual: parseFloat(valorAtual || '0'),
      data_alvo: dataAlvo || null,
      observacao: null,
    })
    setTitulo(''); setValorAlvo(''); setValorAtual(''); setDataAlvo('')
    setShowForm(false)
    await fetchMetas()
    setSaving(false)
  }

  async function atualizarValorAtual(meta: Meta, novoValor: number) {
    await supabase.from('metas').update({ valor_atual: novoValor }).eq('id', meta.id)
    fetchMetas()
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-white text-2xl font-bold">Metas</h1>
        <button
          onClick={() => setShowForm(v => !v)}
          className="bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
        >
          {showForm ? 'Cancelar' : '+ Nova Meta'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
          <input
            value={titulo}
            onChange={e => setTitulo(e.target.value)}
            required
            placeholder="Ex: Casamento"
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="number" min="0" step="0.01"
              value={valorAlvo}
              onChange={e => setValorAlvo(e.target.value)}
              required
              placeholder="Valor alvo (R$)"
              className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
            <input
              type="number" min="0" step="0.01"
              value={valorAtual}
              onChange={e => setValorAtual(e.target.value)}
              placeholder="Valor atual (R$)"
              className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
          <input
            type="date"
            value={dataAlvo}
            onChange={e => setDataAlvo(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-colors"
          >
            {saving ? 'Salvando…' : 'Criar Meta'}
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-gray-500 text-sm">Carregando…</p>
      ) : metas.length === 0 ? (
        <p className="text-gray-600 text-center py-12">Nenhuma meta criada ainda.</p>
      ) : (
        <div className="space-y-4">
          {metas.map(meta => {
            const pct = Math.min(100, meta.valor_alvo > 0 ? (meta.valor_atual / meta.valor_alvo) * 100 : 0)
            const faltam = meta.valor_alvo - meta.valor_atual
            return (
              <div key={meta.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-white font-semibold text-lg">{meta.titulo}</h3>
                    {meta.data_alvo && (
                      <p className="text-gray-500 text-xs mt-0.5">
                        Prazo: {new Date(meta.data_alvo + 'T12:00:00').toLocaleDateString('pt-BR')}
                      </p>
                    )}
                  </div>
                  <span className="text-violet-400 font-bold text-lg shrink-0">{pct.toFixed(0)}%</span>
                </div>

                {/* Barra de progresso */}
                <div className="w-full bg-gray-800 rounded-full h-3">
                  <div
                    className="bg-violet-500 h-3 rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-emerald-400 font-medium">{fmt(meta.valor_atual)} guardados</span>
                  <span className="text-gray-500">{fmt(meta.valor_alvo)} total</span>
                </div>

                {faltam > 0 && (
                  <p className="text-gray-500 text-xs">Faltam {fmt(faltam)}</p>
                )}

                {/* Atualizar valor atual */}
                <details className="group mt-1">
                  <summary className="text-gray-500 text-xs cursor-pointer hover:text-gray-300 select-none">
                    Atualizar valor atual
                  </summary>
                  <form
                    className="flex gap-2 mt-2"
                    onSubmit={e => {
                      e.preventDefault()
                      const input = (e.currentTarget.elements.namedItem('novoValor') as HTMLInputElement)
                      atualizarValorAtual(meta, parseFloat(input.value))
                    }}
                  >
                    <input
                      name="novoValor"
                      type="number"
                      min="0"
                      step="0.01"
                      defaultValue={meta.valor_atual}
                      className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                    <button type="submit" className="bg-violet-600 hover:bg-violet-500 text-white text-sm px-3 py-1.5 rounded-xl transition-colors">
                      OK
                    </button>
                  </form>
                </details>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
