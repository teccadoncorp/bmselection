import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Users, CheckCircle, Clock, Phone, PhoneOff } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { analyticsAPI } from '../../api'
import StatCard from '../../components/ui/StatCard'
import Select from '../../components/ui/Select'
import Spinner from '../../components/ui/Spinner'
import { useDistricts, useBlocks, useGPs } from '../../hooks/useGeography'
import { SURVEY_OPTIONS } from '../../utils'

export default function AdminAnalytics() {
  const [filters, setFilters] = useState({})
  const [geoGroup, setGeoGroup] = useState('district')
  const [districtId, setDistrictId] = useState('')
  const [blockId, setBlockId] = useState('')

  const { data: districts } = useDistricts()
  const { data: blocks } = useBlocks(districtId)

  const { data: stats, isLoading } = useQuery({ queryKey: ['analytics-dashboard', filters], queryFn: () => analyticsAPI.dashboard(filters).then(r => r.data) })
  const { data: opStats } = useQuery({ queryKey: ['analytics-ops', filters], queryFn: () => analyticsAPI.operators(filters).then(r => r.data) })
  const { data: geoStats } = useQuery({ queryKey: ['analytics-geo', geoGroup, filters], queryFn: () => analyticsAPI.geography({ group_by: geoGroup, ...filters }).then(r => r.data) })
  const { data: faqStats } = useQuery({ queryKey: ['analytics-faq', filters], queryFn: () => analyticsAPI.faqStats(filters).then(r => r.data) })

  const FAQ_LABELS = {
    received_govt_house: 'Received Govt House',
    amount_credited: 'Amount Credited',
    construction_status: 'Construction Status',
    money_taken: 'Money Taken',
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="font-display font-bold text-2xl text-slate-800">Analytics</h1></div>
        <div className="flex gap-2 flex-wrap">
          <Select value={districtId} placeholder="District"
            onChange={v => { setDistrictId(v); setBlockId(''); setFilters(f => ({ ...f, district_lgd: districts?.find(d => String(d.id)===v)?.lgd_code, block_lgd: undefined })) }}
            options={(districts||[]).map(d => ({ value: String(d.id), label: d.name }))} />
          <Select value={blockId} placeholder="Block"
            onChange={v => { setBlockId(v); setFilters(f => ({ ...f, block_lgd: blocks?.find(b => String(b.id)===v)?.lgd_code })) }}
            options={(blocks||[]).map(b => ({ value: String(b.id), label: b.name }))} />
        </div>
      </div>

      {/* Stat cards */}
      {isLoading ? <Spinner /> : (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard label="Total Assigned" value={stats?.total_assigned?.toLocaleString()} icon={Users} color="blue" />
          <StatCard label="Completed" value={stats?.completed?.toLocaleString()} icon={CheckCircle} color="green" />
          <StatCard label="Pending" value={stats?.pending?.toLocaleString()} icon={Clock} color="yellow" />
          <StatCard label="Connected" value={stats?.connected?.toLocaleString()} icon={Phone} color="purple" />
          <StatCard label="Not Connected" value={stats?.not_connected?.toLocaleString()} icon={PhoneOff} color="red" />
        </div>
      )}

      {/* Operator performance */}
      {opStats?.length > 0 && (
        <div className="card p-5">
          <h2 className="font-display font-semibold text-slate-700 mb-4">Operator Performance</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={opStats} margin={{ left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="username" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="completed" fill="#10b981" name="Completed" radius={[4,4,0,0]} />
              <Bar dataKey="pending" fill="#f59e0b" name="Pending" radius={[4,4,0,0]} />
              <Bar dataKey="connected" fill="#3b82f6" name="Connected" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Geography breakdown */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-semibold text-slate-700">Geography Breakdown</h2>
          <div className="flex gap-1">
            {['district','block','gp'].map(g => (
              <button key={g} onClick={() => setGeoGroup(g)}
                className={`px-3 py-1 rounded text-xs font-medium capitalize transition-colors ${geoGroup===g ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                {g === 'gp' ? 'GP' : g}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>{['Name','LGD','Total','Completed','Pending','Connected'].map(h => <th key={h} className="text-left px-3 py-2 text-xs font-semibold text-slate-500 uppercase">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {(geoStats||[]).map((r, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="px-3 py-2 font-medium text-slate-800">{r.name}</td>
                  <td className="px-3 py-2 font-mono text-xs text-slate-400">{r.lgd}</td>
                  <td className="px-3 py-2 font-semibold">{r.total}</td>
                  <td className="px-3 py-2 text-green-600 font-semibold">{r.completed}</td>
                  <td className="px-3 py-2 text-amber-500 font-semibold">{r.pending}</td>
                  <td className="px-3 py-2 text-blue-600 font-semibold">{r.connected}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ Stats */}
      {faqStats && (
        <div className="card p-5">
          <h2 className="font-display font-semibold text-slate-700 mb-4">Survey Answer Breakdown (FAQ)</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(FAQ_LABELS).map(([key, label]) => {
              const s = faqStats[key] || {}
              return (
                <div key={key} className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wide">{label}</p>
                  {['yes','no','not_answered'].map(ans => (
                    <div key={ans} className="flex justify-between items-center mb-1.5">
                      <span className="text-xs text-slate-600 capitalize">{ans.replace('_',' ')}</span>
                      <span className={`font-semibold text-sm ${ans==='yes'?'text-green-600':ans==='no'?'text-red-500':'text-slate-400'}`}>{s[ans] ?? 0}</span>
                    </div>
                  ))}
                </div>
              )
            })}
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wide">Call Connected</p>
              {['yes','no'].map(ans => (
                <div key={ans} className="flex justify-between items-center mb-1.5">
                  <span className="text-xs text-slate-600 capitalize">{ans}</span>
                  <span className={`font-semibold text-sm ${ans==='yes'?'text-green-600':'text-red-500'}`}>{faqStats.call_connected?.[ans] ?? 0}</span>
                </div>
              ))}
            </div>
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wide">Survey Status</p>
              {['completed','pending'].map(ans => (
                <div key={ans} className="flex justify-between items-center mb-1.5">
                  <span className="text-xs text-slate-600 capitalize">{ans}</span>
                  <span className={`font-semibold text-sm ${ans==='completed'?'text-green-600':'text-amber-500'}`}>{faqStats.survey_status?.[ans] ?? 0}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
