import { useEffect, useState } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import EmprestimosPage from './pages/EmprestimosPage'
import MetasPage from './pages/MetasPage'
import UpdatePasswordPage from './pages/UpdatePasswordPage'
import NavBar from './components/NavBar'

export default function App() {
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const [passwordRecovery, setPasswordRecovery] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setPasswordRecovery(true)
        setSession(session)
      } else {
        setPasswordRecovery(false)
        setSession(session)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  if (session === undefined) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (passwordRecovery) return <UpdatePasswordPage onDone={() => setPasswordRecovery(false)} />

  if (!session) return <LoginPage />

  return (
    <HashRouter>
      <div className="min-h-screen bg-gray-950">
        <NavBar />
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/emprestimos" element={<EmprestimosPage />} />
          <Route path="/metas" element={<MetasPage />} />
        </Routes>
      </div>
    </HashRouter>
  )
}
