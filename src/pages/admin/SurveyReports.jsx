import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts'
import {
  ClipboardList, CheckCircle2, Clock3, Phone, PhoneOff, MapPin,
  TrendingUp, MessageCircleQuestion, Users, ChevronDown, ChevronLeft,
  ChevronRight, Download, RefreshCw, Calendar, Filter, Home, Wallet,
  HardHat, AlertTriangle
} from 'lucide-react'
import { surveyReportAPI } from '../../api'
import Spinner from '../../components/ui/Spinner'
import StatCard from '../../components/ui/StatCard'
import Select from '../../components/ui/Select'
import { useDistricts, useBlocks, useGPs } from '../../hooks/useGeography'

// ─── Colour palette consistent with existing app ─────────────────────────────
const C = {
  green:  '#10b981',
  amber:  '#f59e0b',
  blue:   '#3b82f6',
  red:    '#ef4444',
  purple: '#8b5cf6',
  slate:  '#94a3b8',
  brand:  '#2563eb',
}
const PIE_COLORS = [C.green, C.amber, C.blue, C.red, C.purple, C.slate]

// ─── Tiny helpers ─────────────────────────────────────────────────────────────
const pct = (n, d) => (d ? ((n / d) * 100).toFixed(1) + '%' : '—')
const fmt = (n) => (n ?? 0).toLocaleString()

function Badge({ label, color = 'gray' }) {
  const cls = {
    green:  'badge-green',
    red:    'badge-red',
    yellow: 'badge-yellow',
    blue:   'badge-blue',
    gray:   'badge-gray',
  }
  return <span className={cls[color]}>{label}</span>
}

function TabBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
        active ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
      }`}
    >
      {children}
    </button>
  )
}

// ─── Geo filter bar (shared) ──────────────────────────────────────────────────
function GeoFilters({ filters, setFilters }) {
  const [districtId, setDistrictId] = useState('')
  const [blockId,    setBlockId]    = useState('')

  const { data: districts } = useDistricts()
  const { data: blocks }    = useBlocks(districtId)
  const { data: gps }       = useGPs(blockId)

  return (
    <div className="flex gap-2 flex-wrap">
      <Select
        placeholder="All Districts"
        value={districtId}
        onChange={v => {
          setDistrictId(v); setBlockId('')
          setFilters(f => ({
            ...f,
            district_lgd: districts?.find(d => String(d.id) === v)?.lgd_code || undefined,
            block_lgd: undefined, gp_lgd: undefined,
          }))
        }}
        options={(districts || []).map(d => ({ value: String(d.id), label: d.name }))}
      />
      <Select
        placeholder="All Blocks"
        value={blockId}
        onChange={v => {
          setBlockId(v)
          setFilters(f => ({
            ...f,
            block_lgd: blocks?.find(b => String(b.id) === v)?.lgd_code || undefined,
            gp_lgd: undefined,
          }))
        }}
        options={(blocks || []).map(b => ({ value: String(b.id), label: b.name }))}
      />
      <Select
        placeholder="All GPs"
        onChange={v => {
          setFilters(f => ({
            ...f,
            gp_lgd: gps?.find(g => String(g.id) === v)?.lgd_code || undefined,
          }))
        }}
        options={(gps || []).map(g => ({ value: String(g.id), label: g.name }))}
      />
    </div>
  )
}

// ─── Date filter bar ──────────────────────────────────────────────────────────
function DateFilters({ filters, setFilters }) {
  const PERIODS = [
    { value: 'today', label: 'Today' },
    { value: 'week',  label: 'Last 7 days' },
    { value: 'month', label: 'Last 30 days' },
    { value: 'custom',label: 'Custom' },
  ]
  return (
    <div className="flex gap-2 items-center flex-wrap">
      <div className="flex rounded-lg border border-slate-200 overflow-hidden bg-white">
        {PERIODS.map(p => (
          <button
            key={p.value}
            onClick={() => setFilters(f => ({ ...f, period: p.value }))}
            className={`px-3 py-1.5 text-xs font-medium transition-colors ${
              filters.period === p.value
                ? 'bg-brand-600 text-white'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
      {filters.period === 'custom' && (
        <>
          <input
            type="date"
            className="input text-xs py-1.5"
            style={{ width: 140 }}
            value={filters.date_from || ''}
            onChange={e => setFilters(f => ({ ...f, date_from: e.target.value }))}
          />
          <span className="text-slate-400 text-xs">to</span>
          <input
            type="date"
            className="input text-xs py-1.5"
            style={{ width: 140 }}
            value={filters.date_to || ''}
            onChange={e => setFilters(f => ({ ...f, date_to: e.target.value }))}
          />
        </>
      )}
    </div>
  )
}

// ─── Progress bar ─────────────────────────────────────────────────────────────
function ProgressBar({ value, max, color = C.green, label }) {
  const w = max ? Math.min(100, (value / max) * 100) : 0
  return (
    <div>
      {label && <div className="flex justify-between text-xs text-slate-500 mb-1"><span>{label}</span><span>{fmt(value)}</span></div>}
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${w}%`, background: color }} />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 1: Summary
// ─────────────────────────────────────────────────────────────────────────────
function SummaryTab({ filters }) {
  const { data, isLoading } = useQuery({
    queryKey: ['report-summary', filters],
    queryFn:  () => surveyReportAPI.summary(filters).then(r => r.data),
  })

  if (isLoading) return <div className="py-20 flex justify-center"><Spinner /></div>
  if (!data) return null

  const { status_summary: st, call_status_summary: cs, faq_summary: fq, total_surveys: total } = data

  const faqMeta = [
    { key: 'received_govt_house', label: 'Received Govt House',  icon: Home,        color: C.blue   },
    { key: 'amount_credited',     label: 'Amount Credited',       icon: Wallet,      color: C.green  },
    { key: 'construction_status', label: 'Construction Done',     icon: HardHat,     color: C.amber  },
    { key: 'money_taken',         label: 'Money Taken by Official',icon: AlertTriangle,color: C.red  },
  ]

  const pieData = [
    { name: 'Completed', value: st.completed },
    { name: 'Pending',   value: st.pending },
  ]
  const callPieData = [
    { name: 'Connected',     value: cs.connected },
    { name: 'Not Connected', value: cs.not_connected },
  ]

  return (
    <div className="space-y-6">
      {/* Top stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Total Surveys"   value={fmt(total)}          icon={ClipboardList} color="blue"   />
        <StatCard label="Completed"       value={fmt(st.completed)}   icon={CheckCircle2}  color="green"  />
        <StatCard label="Pending"         value={fmt(st.pending)}     icon={Clock3}        color="yellow" />
        <StatCard label="Calls Connected" value={fmt(cs.connected)}   icon={Phone}         color="purple" />
        <StatCard label="Not Connected"   value={fmt(cs.not_connected)}icon={PhoneOff}     color="red"    />
      </div>

      {/* Pie charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h3 className="font-display font-semibold text-slate-700 mb-1">Survey Status</h3>
          <p className="text-xs text-slate-400 mb-4">Completion rate: <strong className="text-slate-700">{st.completion_rate}%</strong></p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={4}>
                <Cell fill={C.green} /><Cell fill={C.amber} />
              </Pie>
              <Tooltip /><Legend iconType="circle" iconSize={10} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h3 className="font-display font-semibold text-slate-700 mb-1">Call Status</h3>
          <p className="text-xs text-slate-400 mb-4">Connection rate: <strong className="text-slate-700">{cs.connection_rate}%</strong></p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={callPieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={4}>
                <Cell fill={C.blue} /><Cell fill={C.red} />
              </Pie>
              <Tooltip /><Legend iconType="circle" iconSize={10} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* FAQ breakdown */}
      <div className="card p-5">
        <h3 className="font-display font-semibold text-slate-700 mb-5">FAQ Answer Breakdown</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {faqMeta.map(({ key, label, icon: Icon, color }) => {
            const s = fq[key] || {}
            const t = (s.yes || 0) + (s.no || 0) + (s.not_answered || 0)
            return (
              <div key={key} className="bg-slate-50 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg" style={{ background: color + '20' }}>
                    <Icon size={14} style={{ color }} />
                  </div>
                  <p className="text-xs font-semibold text-slate-600 leading-tight">{label}</p>
                </div>
                <ProgressBar value={s.yes || 0} max={t} color={C.green} label="Yes" />
                <ProgressBar value={s.no || 0} max={t} color={C.red} label="No" />
                <ProgressBar value={s.not_answered || 0} max={t} color={C.slate} label="Not Answered" />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 2: Status-wise list
// ─────────────────────────────────────────────────────────────────────────────
function StatusTab({ filters }) {
  const [status,   setStatus]   = useState('Pending')
  const [page,     setPage]     = useState(1)

  const params = { ...filters, status, page, page_size: 20 }
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['report-status', params],
    queryFn:  () => surveyReportAPI.byStatus(params).then(r => r.data),
    keepPreviousData: true,
  })

  return (
    <div className="space-y-4">
      {/* Toggle */}
      <div className="flex gap-2">
        <TabBtn active={status === 'Pending'}   onClick={() => { setStatus('Pending');   setPage(1) }}>⏳ Pending</TabBtn>
        <TabBtn active={status === 'Completed'} onClick={() => { setStatus('Completed'); setPage(1) }}>✅ Completed</TabBtn>
      </div>

      <div className="card overflow-hidden">
        {/* header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-display font-semibold text-slate-700">{status} Surveys</span>
            {data && <span className="badge-blue">{fmt(data.total)} total</span>}
          </div>
          {isFetching && <Spinner className="w-4 h-4" />}
        </div>

        {isLoading ? (
          <div className="py-16 flex justify-center"><Spinner /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  {['Beneficiary', 'Mobile', 'GP', 'Block', 'District', 'Call', 'Status', 'Updated By', 'Last Updated'].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {(data?.results || []).map(r => (
                  <tr key={r.survey_id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap">{r.beneficiary_name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{r.mobile_number}</td>
                    <td className="px-4 py-3 text-slate-600">{r.gp}</td>
                    <td className="px-4 py-3 text-slate-600">{r.block}</td>
                    <td className="px-4 py-3 text-slate-600">{r.district}</td>
                    <td className="px-4 py-3">
                      <Badge label={r.call_connected} color={r.call_connected === 'Yes' ? 'green' : 'red'} />
                    </td>
                    <td className="px-4 py-3">
                      <Badge label={r.survey_status} color={r.survey_status === 'Completed' ? 'green' : 'yellow'} />
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{r.last_updated_by || '—'}</td>
                    <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                      {r.updated_at ? new Date(r.updated_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {data && data.total > 20 && (
          <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              {(page - 1) * 20 + 1}–{Math.min(page * 20, data.total)} of <strong>{fmt(data.total)}</strong>
            </p>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => p - 1)} disabled={page === 1}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40">
                <ChevronLeft size={15} />
              </button>
              <button onClick={() => setPage(p => p + 1)} disabled={page * 20 >= data.total}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40">
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 3: GP-Wise
// ─────────────────────────────────────────────────────────────────────────────
function GPTab({ filters }) {
  const { data, isLoading } = useQuery({
    queryKey: ['report-gp', filters],
    queryFn:  () => surveyReportAPI.byGP(filters).then(r => r.data),
  })

  const rows = data?.results || []
  const top10 = useMemo(() => [...rows].sort((a, b) => b.total - a.total).slice(0, 10), [rows])

  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="py-16 flex justify-center"><Spinner /></div>
      ) : (
        <>
          {/* Bar chart */}
          {top10.length > 0 && (
            <div className="card p-5">
              <h3 className="font-display font-semibold text-slate-700 mb-4">Top GPs by Survey Volume</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={top10} margin={{ left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="gp_name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend iconType="circle" iconSize={10} />
                  <Bar dataKey="completed"  name="Completed"     fill={C.green}  radius={[4,4,0,0]} />
                  <Bar dataKey="pending"    name="Pending"       fill={C.amber}  radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Table */}
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <span className="font-display font-semibold text-slate-700">GP-wise Breakdown</span>
              <span className="badge-blue ml-2">{fmt(data?.total_gps)} GPs</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    {['District','Block','GP','GP LGD','Total','Completed','Pending','Done %','Connected','Not Connected'].map(h => (
                      <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {rows.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-slate-600">{r.district_name}</td>
                      <td className="px-4 py-3 text-slate-600">{r.block_name}</td>
                      <td className="px-4 py-3 font-medium text-slate-800">{r.gp_name}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-400">{r.gp_lgd}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{fmt(r.total)}</td>
                      <td className="px-4 py-3 text-green-600 font-semibold">{fmt(r.completed)}</td>
                      <td className="px-4 py-3 text-amber-500 font-semibold">{fmt(r.pending)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden" style={{ minWidth: 50 }}>
                            <div className="h-full rounded-full bg-green-500" style={{ width: `${r.completion_rate}%` }} />
                          </div>
                          <span className="text-xs font-semibold text-slate-600">{r.completion_rate}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-blue-600 font-semibold">{fmt(r.call_connected)}</td>
                      <td className="px-4 py-3 text-red-500 font-semibold">{fmt(r.call_not_connected)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 4: Call Status
// ─────────────────────────────────────────────────────────────────────────────
function CallStatusTab({ filters }) {
  const [callFilter, setCallFilter] = useState('No')
  const [page, setPage] = useState(1)

  const params = { ...filters, call_connected: callFilter, page, page_size: 20 }
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['report-call', params],
    queryFn:  () => surveyReportAPI.byCallStatus(params).then(r => r.data),
    keepPreviousData: true,
  })

  const FAQ_KEYS = ['received_govt_house', 'amount_credited', 'construction_status', 'money_taken']
  const FAQ_SHORT = { received_govt_house: 'Govt House', amount_credited: 'Amt Credit', construction_status: 'Construction', money_taken: 'Money Taken' }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <TabBtn active={callFilter === 'No'}  onClick={() => { setCallFilter('No');  setPage(1) }}>📵 Not Connected</TabBtn>
        <TabBtn active={callFilter === 'Yes'} onClick={() => { setCallFilter('Yes'); setPage(1) }}>📞 Connected</TabBtn>
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-display font-semibold text-slate-700">
              {callFilter === 'No' ? 'Calls Not Connected' : 'Calls Connected'}
            </span>
            {data && <span className="badge-blue">{fmt(data.total)} records</span>}
          </div>
          {isFetching && <Spinner className="w-4 h-4" />}
        </div>

        {isLoading ? (
          <div className="py-16 flex justify-center"><Spinner /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  {['Beneficiary', 'Mobile', 'GP', 'Block', 'Survey Status', ...FAQ_KEYS.map(k => FAQ_SHORT[k]), 'Updated By', 'Last Updated'].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {(data?.results || []).map(r => (
                  <tr key={r.survey_id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap">{r.beneficiary_name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{r.mobile_number}</td>
                    <td className="px-4 py-3 text-slate-600">{r.gp}</td>
                    <td className="px-4 py-3 text-slate-600">{r.block}</td>
                    <td className="px-4 py-3">
                      <Badge label={r.survey_status} color={r.survey_status === 'Completed' ? 'green' : 'yellow'} />
                    </td>
                    {FAQ_KEYS.map(k => (
                      <td key={k} className="px-4 py-3">
                        <Badge
                          label={r[k] === 'Not Answered' ? 'N/A' : r[k]}
                          color={r[k] === 'Yes' ? 'green' : r[k] === 'No' ? 'red' : 'gray'}
                        />
                      </td>
                    ))}
                    <td className="px-4 py-3 text-xs text-slate-500">{r.last_updated_by || '—'}</td>
                    <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                      {r.updated_at ? new Date(r.updated_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {data && data.total > 20 && (
          <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              {(page - 1) * 20 + 1}–{Math.min(page * 20, data.total)} of <strong>{fmt(data.total)}</strong>
            </p>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => p - 1)} disabled={page === 1}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40">
                <ChevronLeft size={15} />
              </button>
              <button onClick={() => setPage(p => p + 1)} disabled={page * 20 >= data.total}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40">
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 5: FAQ-Wise
// ─────────────────────────────────────────────────────────────────────────────
function FAQTab({ filters }) {
  const { data, isLoading } = useQuery({
    queryKey: ['report-faq', filters],
    queryFn:  () => surveyReportAPI.byFAQ(filters).then(r => r.data),
  })

  const fq = data?.faq_report || {}
  const total = data?.total_surveys_in_scope || 0

  const chartData = Object.entries(fq).map(([key, v]) => ({
    name: v.label?.replace('Government', 'Govt') || key,
    Yes: v.yes, No: v.no, 'N/A': v.not_answered,
  }))

  const faqMeta = [
    { key: 'received_govt_house', icon: Home,          color: C.blue   },
    { key: 'amount_credited',     icon: Wallet,         color: C.green  },
    { key: 'construction_status', icon: HardHat,        color: C.amber  },
    { key: 'money_taken',         icon: AlertTriangle,  color: C.red    },
  ]

  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="py-16 flex justify-center"><Spinner /></div>
      ) : (
        <>
          {/* Grouped bar */}
          {chartData.length > 0 && (
            <div className="card p-5">
              <h3 className="font-display font-semibold text-slate-700 mb-4">FAQ Answers — All Questions</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chartData} margin={{ left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend iconType="circle" iconSize={10} />
                  <Bar dataKey="Yes"  fill={C.green}  radius={[4,4,0,0]} />
                  <Bar dataKey="No"   fill={C.red}    radius={[4,4,0,0]} />
                  <Bar dataKey="N/A"  fill={C.slate}  radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Detail cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {faqMeta.map(({ key, icon: Icon, color }) => {
              const v = fq[key] || {}
              return (
                <div key={key} className="card p-5 space-y-4">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg" style={{ background: color + '18' }}>
                      <Icon size={16} style={{ color }} />
                    </div>
                    <p className="text-sm font-semibold text-slate-700 leading-tight">{v.label}</p>
                  </div>

                  <div className="space-y-2.5">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-green-600 font-medium">Yes</span>
                        <span className="text-slate-500">{fmt(v.yes)} ({v.yes_pct}%)</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full" style={{ width: `${v.yes_pct || 0}%` }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-red-500 font-medium">No</span>
                        <span className="text-slate-500">{fmt(v.no)} ({v.no_pct}%)</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-red-400 rounded-full" style={{ width: `${v.no_pct || 0}%` }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-400 font-medium">Not Answered</span>
                        <span className="text-slate-400">{fmt(v.not_answered)} ({v.not_answered_pct}%)</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-slate-300 rounded-full" style={{ width: `${v.not_answered_pct || 0}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 6: Date-Wise Trend
// ─────────────────────────────────────────────────────────────────────────────
function DateTrendTab({ filters }) {
  const [granularity, setGranularity] = useState('daily')

  const { data, isLoading } = useQuery({
    queryKey: ['report-date', granularity, filters],
    queryFn:  () => surveyReportAPI.byDate({ ...filters, granularity }).then(r => r.data),
  })

  const trend = data?.trend || []

  const formatPeriod = (p) => {
    if (!p) return ''
    const d = new Date(p)
    if (granularity === 'monthly') return d.toLocaleString('en-IN', { month: 'short', year: 'numeric' })
    return d.toLocaleString('en-IN', { day: '2-digit', month: 'short' })
  }

  const chartData = trend.map(t => ({
    ...t,
    period: formatPeriod(t.period),
  }))

  return (
    <div className="space-y-5">
      {/* Granularity toggle */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit">
        {['daily', 'weekly', 'monthly'].map(g => (
          <button key={g} onClick={() => setGranularity(g)}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all capitalize ${
              granularity === g ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}>
            {g}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="py-16 flex justify-center"><Spinner /></div>
      ) : (
        <>
          {/* Area chart */}
          <div className="card p-5">
            <h3 className="font-display font-semibold text-slate-700 mb-1">Survey Activity Over Time</h3>
            <p className="text-xs text-slate-400 mb-4 capitalize">{granularity} granularity · {data?.total_periods} periods</p>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={chartData} margin={{ left: -10 }}>
                <defs>
                  <linearGradient id="gComp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={C.green} stopOpacity={0.18}/>
                    <stop offset="95%" stopColor={C.green} stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="gPend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={C.amber} stopOpacity={0.18}/>
                    <stop offset="95%" stopColor={C.amber} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="period" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend iconType="circle" iconSize={10} />
                <Area type="monotone" dataKey="completed"     name="Completed"     stroke={C.green} fill="url(#gComp)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="pending"       name="Pending"       stroke={C.amber} fill="url(#gPend)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="call_connected" name="Call Connected" stroke={C.blue} fill="none" strokeWidth={1.5} strokeDasharray="4 2" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Summary table */}
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <span className="font-display font-semibold text-slate-700">Period-wise Data</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    {['Period', 'Total', 'Completed', 'Pending', 'Call Connected', 'Done %'].map(h => (
                      <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {chartData.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-700">{r.period}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{fmt(r.total)}</td>
                      <td className="px-4 py-3 text-green-600 font-semibold">{fmt(r.completed)}</td>
                      <td className="px-4 py-3 text-amber-500 font-semibold">{fmt(r.pending)}</td>
                      <td className="px-4 py-3 text-blue-600 font-semibold">{fmt(r.call_connected)}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-semibold text-slate-600">{pct(r.completed, r.total)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 7: Operator-wise (admin only)
// ─────────────────────────────────────────────────────────────────────────────
function OperatorTab({ filters }) {
  const { data, isLoading } = useQuery({
    queryKey: ['report-operator', filters],
    queryFn:  () => surveyReportAPI.byOperator(filters).then(r => r.data),
  })

  const rows = data?.results || []
  const chartData = rows.slice(0, 12).map(r => ({
    name: r.operator_username,
    Completed: r.completed,
    Pending: r.pending,
    Connected: r.calls_connected,
  }))

  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="py-16 flex justify-center"><Spinner /></div>
      ) : (
        <>
          {chartData.length > 0 && (
            <div className="card p-5">
              <h3 className="font-display font-semibold text-slate-700 mb-4">Operator Performance (Top 12)</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chartData} margin={{ left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend iconType="circle" iconSize={10} />
                  <Bar dataKey="Completed" fill={C.green}  radius={[4,4,0,0]} />
                  <Bar dataKey="Pending"   fill={C.amber}  radius={[4,4,0,0]} />
                  <Bar dataKey="Connected" fill={C.blue}   radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <span className="font-display font-semibold text-slate-700">All Operators</span>
              <span className="badge-blue ml-2">{fmt(data?.total_operators)} operators</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    {['#', 'Name', 'Username', 'Total Updated', 'Completed', 'Pending', 'Calls Connected', 'Done %'].map(h => (
                      <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {rows.map((r, i) => (
                    <tr key={r.operator_id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-slate-400 text-xs">{i + 1}</td>
                      <td className="px-4 py-3 font-medium text-slate-800">{r.operator_name}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">{r.operator_username}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{fmt(r.total_updated)}</td>
                      <td className="px-4 py-3 text-green-600 font-semibold">{fmt(r.completed)}</td>
                      <td className="px-4 py-3 text-amber-500 font-semibold">{fmt(r.pending)}</td>
                      <td className="px-4 py-3 text-blue-600 font-semibold">{fmt(r.calls_connected)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500 rounded-full"
                              style={{ width: `${r.total_updated ? (r.completed / r.total_updated * 100) : 0}%` }} />
                          </div>
                          <span className="text-xs font-semibold text-slate-600">
                            {r.total_updated ? ((r.completed / r.total_updated) * 100).toFixed(1) : 0}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT PAGE
// ─────────────────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'summary',    label: 'Summary',     icon: ClipboardList },
  { id: 'status',     label: 'By Status',   icon: CheckCircle2  },
  { id: 'gp',         label: 'GP-wise',     icon: MapPin        },
  { id: 'call',       label: 'Call Status', icon: Phone         },
  { id: 'faq',        label: 'FAQ-wise',    icon: MessageCircleQuestion },
  { id: 'date',       label: 'Date Trend',  icon: TrendingUp    },
  { id: 'operator',   label: 'Operators',   icon: Users         },
]

export default function SurveyReports() {
  const [activeTab, setActiveTab] = useState('summary')
  const [filters,   setFilters]   = useState({})

  const currentTab = TABS.find(t => t.id === activeTab)

  return (
    <div className="p-6 space-y-5 min-h-screen">
      {/* Page header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display font-bold text-2xl text-slate-800">Survey Reports</h1>
          <p className="text-slate-400 text-sm mt-0.5">In-depth analysis — status, GP, call, FAQ, and date trends</p>
        </div>
        <GeoFilters filters={filters} setFilters={setFilters} />
      </div>

      {/* Date filter row */}
      <DateFilters filters={filters} setFilters={setFilters} />

      {/* Tab navigation */}
      <div className="flex gap-1 flex-wrap border-b border-slate-200 pb-0.5">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-t-lg transition-colors border-b-2 ${
              activeTab === id
                ? 'border-brand-600 text-brand-700 bg-brand-50/60'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Active tab content */}
      <div>
        {activeTab === 'summary'  && <SummaryTab    filters={filters} />}
        {activeTab === 'status'   && <StatusTab     filters={filters} />}
        {activeTab === 'gp'       && <GPTab         filters={filters} />}
        {activeTab === 'call'     && <CallStatusTab filters={filters} />}
        {activeTab === 'faq'      && <FAQTab        filters={filters} />}
        {activeTab === 'date'     && <DateTrendTab  filters={filters} />}
        {activeTab === 'operator' && <OperatorTab   filters={filters} />}
      </div>
    </div>
  )
}