import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Users, CheckSquare, LogOut, Vote, TrendingUp, AlertCircle } from 'lucide-react'
import useAuthStore from '../../store/authStore'

import { authAPI } from '../../api'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const NAV = [
  { to: '/operator/dashboard',     icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/operator/beneficiaries', icon: Users,           label: 'My List' },
  { to: '/operator/tasks',         icon: CheckSquare,     label: 'Tasks', disabled: true },
  { to: '/operator/opinion',       icon: TrendingUp,      label: 'Opinion' },
  { to: '/operator/complaints',    icon: AlertCircle,     label: 'Complaints' },
]

export default function OperatorLayout() {
  const { user, logout, refreshToken } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try { await authAPI.logout(refreshToken) } catch {}
    logout()
    navigate('/login')
    toast.success('Logged out successfully')
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {/* Top bar */}
      <header className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center">
            <Vote size={14} />
          </div>
          <span className="font-display font-bold text-sm">Election Survey</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">{user?.full_name}</span>
          <button onClick={handleLogout} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-red-400 transition-colors">
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex items-center z-40">
        {NAV.map(({ to, icon: Icon, label, disabled }) => (
          <NavLink key={to} to={disabled ? '#' : to}
            className={({ isActive }) => clsx(
              'flex-1 flex flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors',
              isActive && !disabled ? 'text-brand-600' : 'text-slate-400',
              disabled && 'opacity-40 cursor-not-allowed pointer-events-none'
            )}>
            <Icon size={20} />
            <span>{label}</span>
            {disabled && <span className="text-[9px] text-slate-300">Soon</span>}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
