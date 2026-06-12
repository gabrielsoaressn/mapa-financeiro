import { NavLink } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function NavBar() {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
      isActive ? 'bg-violet-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'
    }`

  return (
    <nav className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between">
      <span className="text-white font-bold text-lg">💰 Mapa Financeiro</span>
      <div className="flex items-center gap-1">
        <NavLink to="/dashboard" className={linkClass}>Dashboard</NavLink>
        <NavLink to="/emprestimos" className={linkClass}>Empréstimos</NavLink>
        <NavLink to="/metas" className={linkClass}>Metas</NavLink>
        <button
          onClick={() => supabase.auth.signOut()}
          className="ml-2 px-4 py-2 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
        >
          Sair
        </button>
      </div>
    </nav>
  )
}
