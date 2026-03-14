import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import {
  LayoutDashboard, Users, UserCog, Link2, MapPin,
  BarChart3, Megaphone, LogOut, ChevronLeft, ChevronRight, Vote
} from 'lucide-react'
import useAuthStore from '../../store/authStore'
import { authAPI } from '../../api'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const NAV = [
  { to: '/admin/dashboard',     icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/beneficiaries', icon: Users,           label: 'Beneficiaries' },
  { to: '/admin/operators',     icon: UserCog,         label: 'Operators' },
  { to: '/admin/assignments',   icon: Link2,           label: 'Assignments' },
  { to: '/admin/geography',     icon: MapPin,          label: 'Geography' },
  { to: '/admin/analytics',     icon: BarChart3,       label: 'Analytics' },
  { to: '/admin/marketing',     icon: Megaphone,       label: 'Marketing', disabled: true },
]

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const { user, logout, refreshToken } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try { await authAPI.logout(refreshToken) } catch {}
    logout()
    navigate('/login')
    toast.success('Logged out successfully')
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <aside className={clsx('flex flex-col bg-slate-900 text-white transition-all duration-300 shrink-0', collapsed ? 'w-16' : 'w-60')}>
        <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center shrink-0">
            <Vote size={16} className="text-white" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="font-display font-bold text-sm text-white truncate">Election Survey</p>
              <p className="text-xs text-slate-400">Admin Panel</p>
            </div>
          )}
        </div>
        <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
          {NAV.map(({ to, icon: Icon, label, disabled }) => (
            <NavLink key={to} to={disabled ? '#' : to}
              className={({ isActive }) => clsx('sidebar-link', isActive && !disabled ? 'active' : '', disabled && 'opacity-40 cursor-not-allowed pointer-events-none')}
              title={collapsed ? label : undefined}>
              <Icon size={18} className="shrink-0" />
              {!collapsed && <span className="flex-1 truncate">{label}</span>}
              {!collapsed && disabled && <span className="text-[10px] bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded font-mono">Soon</span>}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-slate-800 p-2 space-y-1">
          {!collapsed && (
            <div className="px-3 py-2">
              <p className="text-sm font-medium text-white truncate">{user?.full_name}</p>
              <p className="text-xs text-slate-400">{user?.username}</p>
            </div>
          )}
          <button onClick={handleLogout} className="sidebar-link w-full text-red-400 hover:bg-red-900/30 hover:text-red-300">
            <LogOut size={18} className="shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>
          <button onClick={() => setCollapsed(!collapsed)} className="sidebar-link w-full text-slate-400">
            {collapsed ? <ChevronRight size={18} /> : <><ChevronLeft size={18} /><span>Collapse</span></>}
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto"><Outlet /></main>
    </div>
  )
}
