import { useQuery } from '@tanstack/react-query'
import { Users, CheckCircle, Clock, Phone, PhoneOff, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { surveyAPI } from '../../api'
import StatCard from '../../components/ui/StatCard'
import Spinner from '../../components/ui/Spinner'
import useAuthStore from '../../store/authStore'

export default function OperatorDashboard() {
  const { user } = useAuthStore()
  const { data: stats, isLoading } = useQuery({
    queryKey: ['operator-dashboard'],
    queryFn: () => surveyAPI.dashboard().then(r => r.data),
  })

  const pct = stats && stats.total_assigned > 0
    ? Math.round((stats.completed / stats.total_assigned) * 100) : 0

  return (
    <div className="p-4 space-y-5">
      <div className="bg-gradient-to-r from-brand-600 to-brand-800 rounded-2xl p-5 text-white">
        <p className="text-brand-200 text-sm">Welcome back,</p>
        <h1 className="font-display font-bold text-2xl mt-0.5">{user?.full_name}</h1>
        <div className="mt-4">
          <div className="flex justify-between text-sm mb-1.5">
            <span className="text-brand-200">Overall Progress</span>
            <span className="font-semibold">{pct}%</span>
          </div>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-white rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      {isLoading ? <Spinner /> : (
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Assigned" value={stats?.total_assigned} icon={Users} color="blue" />
          <StatCard label="Completed" value={stats?.completed} icon={CheckCircle} color="green" />
          <StatCard label="Pending" value={stats?.pending} icon={Clock} color="yellow" />
          <StatCard label="Connected" value={stats?.connected} icon={Phone} color="purple" />
        </div>
      )}

      <Link to="/operator/beneficiaries"
        className="flex items-center justify-between p-4 card hover:bg-slate-50 transition-colors group">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center">
            <Phone size={20} className="text-brand-600" />
          </div>
          <div>
            <p className="font-semibold text-slate-800">Start Calling</p>
            <p className="text-xs text-slate-400">{stats?.pending ?? 0} surveys pending</p>
          </div>
        </div>
        <ChevronRight size={18} className="text-slate-300 group-hover:text-brand-500 transition-colors" />
      </Link>
    </div>
  )
}
