import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Users, CheckCircle, Clock, Phone, PhoneOff } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { analyticsAPI } from '../../api'
import StatCard from '../../components/ui/StatCard'
import Spinner from '../../components/ui/Spinner'
import { useDistricts, useBlocks, useGPs } from '../../hooks/useGeography'
import Select from '../../components/ui/Select'

const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#ef4444']

export default function AdminDashboard() {
  const [filters, setFilters] = useState({})
  const [districtId, setDistrictId] = useState('')
  const [blockId, setBlockId] = useState('')

  const { data: districts } = useDistricts()
  const { data: blocks } = useBlocks(districtId)
  const { data: gps } = useGPs(blockId)

  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-dashboard', filters],
    queryFn: () => analyticsAPI.dashboard(filters).then(r => r.data),
  })
  const { data: opData } = useQuery({
    queryKey: ['analytics-operators', filters],
    queryFn: () => analyticsAPI.operators(filters).then(r => r.data),
  })

  const pieData = stats ? [
    { name: 'Completed', value: stats.completed },
    { name: 'Pending', value: stats.pending },
    { name: 'Connected', value: stats.connected },
    { name: 'Not Connected', value: stats.not_connected },
  ] : []

  const setGeoFilter = (key, val, extra = {}) => {
    setFilters(prev => ({ ...prev, [key]: val || undefined, ...extra }))
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-slate-800">Dashboard</h1>
          <p className="text-slate-400 text-sm mt-0.5">Real-time survey overview</p>
        </div>
        {/* Geo filters */}
        <div className="flex gap-2">
          <Select
            value={districtId}
            onChange={v => { setDistrictId(v); setBlockId(''); setGeoFilter('district_lgd', districts?.find(d => String(d.id) === v)?.lgd_code, { block_lgd: undefined, gp_lgd: undefined }) }}
            options={(districts || []).map(d => ({ value: String(d.id), label: d.name }))}
            placeholder="All Districts"
          />
          <Select
            value={blockId}
            onChange={v => { setBlockId(v); setGeoFilter('block_lgd', blocks?.find(b => String(b.id) === v)?.lgd_code, { gp_lgd: undefined }) }}
            options={(blocks || []).map(b => ({ value: String(b.id), label: b.name }))}
            placeholder="All Blocks"
          />
        </div>
      </div>

      {isLoading ? <Spinner /> : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard label="Total Assigned" value={stats?.total_assigned?.toLocaleString()} icon={Users} color="blue" />
            <StatCard label="Completed" value={stats?.completed?.toLocaleString()} icon={CheckCircle} color="green" />
            <StatCard label="Pending" value={stats?.pending?.toLocaleString()} icon={Clock} color="yellow" />
            <StatCard label="Connected" value={stats?.connected?.toLocaleString()} icon={Phone} color="purple" />
            <StatCard label="Not Connected" value={stats?.not_connected?.toLocaleString()} icon={PhoneOff} color="red" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Bar chart */}
            <div className="card p-5 lg:col-span-2">
              <h2 className="font-display font-semibold text-slate-700 mb-4">Operator Performance</h2>
              {opData?.length ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={opData.slice(0, 10)} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="username" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="completed" fill="#10b981" name="Completed" radius={[4,4,0,0]} />
                    <Bar dataKey="pending" fill="#f59e0b" name="Pending" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className="h-40 flex items-center justify-center text-slate-400 text-sm">No operator data</div>}
            </div>

            {/* Pie chart */}
            <div className="card p-5">
              <h2 className="font-display font-semibold text-slate-700 mb-4">Status Breakdown</h2>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" paddingAngle={3}>
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend iconType="circle" iconSize={10} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
