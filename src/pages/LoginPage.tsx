import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [forgotMode, setForgotMode] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    setLoading(false)
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const redirectTo = `${window.location.origin}/mapa-financeiro/`
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
    if (error) setError(error.message)
    else setResetSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">💰 Mapa Financeiro</h1>
          <p className="text-gray-400 mt-2 text-sm">Jessi & Biel</p>
        </div>

        {forgotMode ? (
          <div className="bg-gray-900 rounded-2xl p-8 space-y-5 border border-gray-800">
            {resetSent ? (
              <div className="text-center space-y-3">
                <p className="text-emerald-400 font-medium">E-mail enviado!</p>
                <p className="text-gray-400 text-sm">Verifique sua caixa de entrada e clique no link para criar uma nova senha.</p>
                <button
                  onClick={() => { setForgotMode(false); setResetSent(false) }}
                  className="text-violet-400 hover:text-violet-300 text-sm transition-colors"
                >
                  Voltar ao login
                </button>
              </div>
            ) : (
              <form onSubmit={handleReset} className="space-y-5">
                <div>
                  <p className="text-gray-300 text-sm mb-4">Informe seu e-mail e enviaremos um link para redefinir sua senha.</p>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">E-mail</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    placeholder="voce@exemplo.com"
                  />
                </div>

                {error && (
                  <div className="bg-red-900/40 border border-red-700 rounded-xl px-4 py-3 text-red-300 text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-colors"
                >
                  {loading ? 'Enviando…' : 'Enviar link de redefinição'}
                </button>

                <button
                  type="button"
                  onClick={() => { setForgotMode(false); setError(null) }}
                  className="w-full text-gray-500 hover:text-gray-400 text-sm transition-colors"
                >
                  Voltar ao login
                </button>
              </form>
            )}
          </div>
        ) : (
          <form onSubmit={handleLogin} className="bg-gray-900 rounded-2xl p-8 space-y-5 border border-gray-800">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                placeholder="voce@exemplo.com"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-gray-300">Senha</label>
                <button
                  type="button"
                  onClick={() => { setForgotMode(true); setError(null) }}
                  className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
                >
                  Esqueci minha senha
                </button>
              </div>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="bg-red-900/40 border border-red-700 rounded-xl px-4 py-3 text-red-300 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-colors"
            >
              {loading ? 'Entrando…' : 'Entrar'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
