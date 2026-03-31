import { useState, useEffect, useRef } from 'react'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Cell, PieChart, Pie
} from 'recharts'
import {
  Plus, Upload, Download, Trash2, Edit2, X, Check,
  ChevronDown, BarChart2, TrendingUp, Users, MapPin,
  AlertCircle, FileText, RefreshCw, Eye, Filter, UserMinus, Search
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../api/axios'
import { geographyAPI } from '../../api'

// ─── tiny helpers ─────────────────────────────────────────────────────────────
const fmt = (n) => (n == null ? '—' : `${n}%`)
const cls = (...a) => a.filter(Boolean).join(' ')

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#14b8a6', '#a855f7', '#f97316']

// ─── Cascading Geography Filter Bar ──────────────────────────────────────────
function GeoFilterBar({ geoFilters, setGeoFilters, className = '' }) {
  const [districts, setDistricts] = useState([])
  const [blocks, setBlocks]       = useState([])
  const [gps, setGps]             = useState([])
  const [distId, setDistId]       = useState('')
  const [blockId, setBlockId]     = useState('')
  const [gpId, setGpId]           = useState('')

  useEffect(() => {
    geographyAPI.districts.list({ page_size: 200 })
      .then(r => setDistricts(r.data.results ?? r.data)).catch(() => {})
  }, [])
  useEffect(() => {
    if (!distId) { setBlocks([]); setGps([]); setBlockId(''); setGpId(''); return }
    geographyAPI.blocks.list({ district: distId, page_size: 200 })
      .then(r => setBlocks(r.data.results ?? r.data)).catch(() => {})
    setBlockId(''); setGpId(''); setGps([])
  }, [distId])
  useEffect(() => {
    if (!blockId) { setGps([]); setGpId(''); return }
    geographyAPI.gps.list({ block: blockId, page_size: 200 })
      .then(r => setGps(r.data.results ?? r.data)).catch(() => {})
    setGpId('')
  }, [blockId])

  const sel = 'border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white'

  const reset = () => {
    setDistId(''); setBlockId(''); setGpId('')
    setGeoFilters({})
  }

  return (
    <div className={cls('flex flex-wrap items-center gap-2', className)}>
      <Filter size={13} className="text-slate-400" />
      <select className={sel} value={distId}
        onChange={e => {
          const d = districts.find(x => String(x.id) === e.target.value)
          setDistId(e.target.value)
          setGeoFilters(d
            ? { district_lgd: d.lgd_code }
            : {}
          )
        }}>
        <option value="">All Districts</option>
        {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
      </select>

      <select className={sel} value={blockId} disabled={!distId}
        onChange={e => {
          const b = blocks.find(x => String(x.id) === e.target.value)
          setBlockId(e.target.value)
          setGeoFilters(f => {
            const next = { ...f }
            delete next.block_lgd
            delete next.gp_lgd
            if (b) next.block_lgd = b.lgd_code
            return next
          })
        }}>
        <option value="">All Blocks</option>
        {blocks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
      </select>

      <select className={sel} value={gpId} disabled={!blockId}
        onChange={e => {
          const g = gps.find(x => String(x.id) === e.target.value)
          setGpId(e.target.value)
          setGeoFilters(f => {
            const next = { ...f }
            delete next.gp_lgd
            if (g) next.gp_lgd = g.lgd_code
            return next
          })
        }}>
        <option value="">All GPs</option>
        {gps.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
      </select>

      {Object.keys(geoFilters).length > 0 && (
        <button onClick={reset} className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-500 hover:text-indigo-600 border border-slate-200 rounded-lg hover:bg-slate-50">
          <X size={11} /> Clear
        </button>
      )}
    </div>
  )
}

function Badge({ result }) {
  return (
    <span className={cls(
      'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold',
      result === 'won' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
    )}>
      {result === 'won' ? '✓ Won' : '✗ Lost'}
    </span>
  )
}

function Spinner() {
  return <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
}

function Modal({ open, onClose, title, children, wide }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className={cls('bg-white rounded-2xl shadow-2xl w-full', wide ? 'max-w-2xl' : 'max-w-lg')}>
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="font-semibold text-slate-800">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 text-slate-500"><X size={18} /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-slate-600">{label}</label>
      {children}
    </div>
  )
}

const inp = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400'

// ─── Section tab bar ──────────────────────────────────────────────────────────
const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart2 },
  { id: 'booths',    label: 'Booths',    icon: MapPin },
  { id: 'results',   label: 'Election Results', icon: TrendingUp },
  { id: 'tasks',     label: 'Opinion Tasks',    icon: Users },
  { id: 'external',  label: 'External Sources', icon: FileText },
]

// ══════════════════════════════════════════════════════════════════════════════
export default function AdminOpinionAnalysis() {
  const [tab, setTab] = useState('dashboard')
  const [booths, setBooths]             = useState([])
  const [operators, setOperators]       = useState([])
  const [loading, setLoading]           = useState(false)

  // fetch booths + operators once (page_size=1000 to get all booths for client-side filtering)
  useEffect(() => {
    api.get('/opinion/booths/', { params: { page_size: 1000 } }).then(r => setBooths(r.data.results ?? r.data)).catch(() => {})
    api.get('/auth/operators/').then(r => setOperators(r.data.results ?? r.data)).catch(() => {})
  }, [])

  const reload = () => {
    api.get('/opinion/booths/', { params: { page_size: 1000 } }).then(r => setBooths(r.data.results ?? r.data)).catch(() => {})
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Opinion Analysis</h1>
          <p className="text-xs text-slate-500 mt-0.5">Booth-wise election data, operator opinions & final reports</p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="bg-white border-b px-6 flex gap-1 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cls(
              'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors',
              tab === t.id
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            )}>
            <t.icon size={15} />{t.label}
          </button>
        ))}
      </div>

      <div className="p-6">
        {tab === 'dashboard' && <DashboardTab booths={booths} />}
        {tab === 'booths'    && <BoothsTab booths={booths} onReload={reload} />}
        {tab === 'results'   && <ResultsTab booths={booths} />}
        {tab === 'tasks'     && <TasksTab booths={booths} operators={operators} />}
        {tab === 'external'  && <ExternalTab booths={booths} />}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// DASHBOARD TAB
// ══════════════════════════════════════════════════════════════════════════════
function DashboardTab({ booths }) {
  const [analytics, setAnalytics]   = useState(null)
  const [loading, setLoading]       = useState(false)
  const [filterBooth, setFilterBooth] = useState('')
  const [filterYear, setFilterYear]   = useState('')
  const [geoFilters, setGeoFilters]   = useState({})

  const load = () => {
    setLoading(true)
    const params = { ...geoFilters }
    if (filterBooth) params.booth = filterBooth
    if (filterYear)  params.election_year = filterYear
    api.get('/opinion/analytics/', { params })
      .then(r => setAnalytics(r.data))
      .catch(() => toast.error('Failed to load analytics'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const summary = analytics?.final_summary ?? []

  // Chart data: bar of combined avg per booth
  const barData = summary
    .filter(b => b.combined_avg != null)
    .map(b => ({
      name: b.booth_number,
      'Operator Avg': b.operator_avg,
      'External Avg': b.external_avg,
      'Combined':     b.combined_avg,
    }))

  // Historical vote share line chart (all years for selected booth)
  const lineData = (() => {
    if (!filterBooth || !analytics) return []
    const booth = summary.find(b => String(b.booth_id) === String(filterBooth))
    if (!booth) return []
    const byYear = {}
    booth.election_results.forEach(er => {
      byYear[er.year] = er.vote_share
    })
    return Object.entries(byYear)
      .sort(([a], [b]) => a - b)
      .map(([year, share]) => ({ year, 'Vote Share %': share }))
  })()

  // Radar: operator vs external per booth
  const radarData = summary
    .filter(b => b.operator_avg != null || b.external_avg != null)
    .map(b => ({
      booth:    b.booth_number,
      Operator: b.operator_avg ?? 0,
      External: b.external_avg ?? 0,
    }))

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-xl border p-4 space-y-3">
        <GeoFilterBar geoFilters={geoFilters} setGeoFilters={v => { setGeoFilters(v); }} />
        <div className="flex flex-wrap gap-3 items-end">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Filter by Booth</label>
            <select value={filterBooth} onChange={e => setFilterBooth(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 min-w-[180px]">
              <option value="">All Booths</option>
              {booths.map(b => <option key={b.id} value={b.id}>{b.booth_number} – {b.booth_name}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Election Year</label>
            <input type="number" placeholder="e.g. 2024" value={filterYear}
              onChange={e => setFilterYear(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 w-32" />
          </div>
          <button onClick={load}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
            {loading ? <Spinner /> : <RefreshCw size={14} />} Refresh
          </button>
        </div>
      </div>

      {loading && !analytics ? (
        <div className="flex items-center justify-center h-40"><Spinner /></div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Booths',   value: summary.length,                                   color: 'text-indigo-600' },
              { label: 'With Operator Opinion', value: summary.filter(b => b.operator_avg).length, color: 'text-green-600' },
              { label: 'Avg Combined %', value: fmt(summary.length ? Math.round(summary.reduce((a,b) => a + (b.combined_avg??0), 0) / summary.filter(b=>b.combined_avg).length * 10) / 10 : null), color: 'text-amber-600' },
              { label: 'Elections Logged', value: analytics?.election_results?.length ?? 0,       color: 'text-purple-600' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-xl border p-4">
                <p className="text-xs text-slate-500">{s.label}</p>
                <p className={cls('text-2xl font-bold mt-1', s.color)}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Combined Opinion bar chart */}
          {barData.length > 0 && (
            <div className="bg-white rounded-xl border p-5">
              <h3 className="font-semibold text-slate-700 mb-4">Booth-wise Opinion Estimates (%)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barData} margin={{ top: 5, right: 20, bottom: 30, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} tickFormatter={v => `${v}%`} />
                  <Tooltip formatter={(v) => `${v}%`} />
                  <Legend />
                  <Bar dataKey="Operator Avg" fill="#6366f1" radius={[4,4,0,0]} />
                  <Bar dataKey="External Avg" fill="#22c55e" radius={[4,4,0,0]} />
                  <Bar dataKey="Combined"     fill="#f59e0b" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Row: Line + Radar */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Historical Vote Share */}
            <div className="bg-white rounded-xl border p-5">
              <h3 className="font-semibold text-slate-700 mb-1">Historical Vote Share</h3>
              <p className="text-xs text-slate-400 mb-4">
                {filterBooth ? 'Selected booth across years' : 'Select a booth to see history'}
              </p>
              {lineData.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={lineData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} tickFormatter={v => `${v}%`} />
                    <Tooltip formatter={v => `${v}%`} />
                    <Legend />
                    <Line type="monotone" dataKey="Vote Share %" stroke="#6366f1" strokeWidth={2} dot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-40 text-slate-400 text-sm">
                  No historical data available
                </div>
              )}
            </div>

            {/* Radar: Operator vs External */}
            <div className="bg-white rounded-xl border p-5">
              <h3 className="font-semibold text-slate-700 mb-1">Operator vs External Opinions</h3>
              <p className="text-xs text-slate-400 mb-4">Comparison per booth</p>
              {radarData.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="booth" tick={{ fontSize: 10 }} />
                    <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
                    <Radar name="Operator" dataKey="Operator" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} />
                    <Radar name="External" dataKey="External" stroke="#22c55e" fill="#22c55e" fillOpacity={0.3} />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-40 text-slate-400 text-sm">No data yet</div>
              )}
            </div>
          </div>

          {/* Final Summary Table */}
          {summary.length > 0 && (
            <div className="bg-white rounded-xl border overflow-hidden">
              <div className="px-5 py-4 border-b">
                <h3 className="font-semibold text-slate-700">Final Booth-wise Report</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                    <tr>
                      <th className="px-4 py-3 text-left">Booth</th>
                      <th className="px-4 py-3 text-right">Voters</th>
                      <th className="px-4 py-3 text-right">Operator Avg</th>
                      <th className="px-4 py-3 text-right">External Avg</th>
                      <th className="px-4 py-3 text-right">Combined</th>
                      <th className="px-4 py-3 text-center">Last Result</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {summary.map(b => {
                      const lastResult = b.election_results.sort((a,z) => z.year - a.year)[0]
                      return (
                        <tr key={b.booth_id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-medium text-slate-800">{b.booth_number}</div>
                            <div className="text-xs text-slate-400">{b.booth_name}</div>
                          </td>
                          <td className="px-4 py-3 text-right text-slate-600">{b.total_voters.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right">
                            {b.operator_avg != null
                              ? <span className="text-indigo-600 font-semibold">{b.operator_avg}%</span>
                              : <span className="text-slate-300">—</span>}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {b.external_avg != null
                              ? <span className="text-green-600 font-semibold">{b.external_avg}%</span>
                              : <span className="text-slate-300">—</span>}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {b.combined_avg != null
                              ? <span className="text-amber-600 font-bold text-base">{b.combined_avg}%</span>
                              : <span className="text-slate-300">—</span>}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {lastResult
                              ? <div>
                                  <Badge result={lastResult.result} />
                                  <div className="text-xs text-slate-400 mt-0.5">{lastResult.year} · {lastResult.vote_share}%</div>
                                </div>
                              : <span className="text-slate-300">No data</span>}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// BOOTHS TAB
// ══════════════════════════════════════════════════════════════════════════════

// Cascading geo selector used inside the Add/Edit Booth modal
function BoothGeoSelector({ form, setForm }) {
  const [districts, setDistricts] = useState([])
  const [blocks, setBlocks]       = useState([])
  const [gps, setGps]             = useState([])
  const [selDistId, setSelDistId] = useState('')
  const [selBlockId, setSelBlockId] = useState('')

  const sel = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400'

  useEffect(() => {
    geographyAPI.districts.list({ page_size: 200 })
      .then(r => setDistricts(r.data.results ?? r.data)).catch(() => {})
  }, [])

  useEffect(() => {
    if (!selDistId) { setBlocks([]); setGps([]); return }
    geographyAPI.blocks.list({ district: selDistId, page_size: 200 })
      .then(r => setBlocks(r.data.results ?? r.data)).catch(() => {})
    setSelBlockId('')
    setGps([])
  }, [selDistId])

  useEffect(() => {
    if (!selBlockId) { setGps([]); return }
    geographyAPI.gps.list({ block: selBlockId, page_size: 200 })
      .then(r => setGps(r.data.results ?? r.data)).catch(() => {})
  }, [selBlockId])

  return (
    <>
      <div className="space-y-1 col-span-2">
        <label className="text-xs font-medium text-slate-600">Select District</label>
        <select className={sel} value={selDistId}
          onChange={e => {
            const d = districts.find(x => String(x.id) === e.target.value)
            setSelDistId(e.target.value)
            setForm(p => ({
              ...p,
              district_name: d?.name ?? '',
              district_lgd:  d?.lgd_code ?? '',
              block_name: '', block_lgd: '', gp_name: '', gp_lgd: '',
            }))
          }}>
          <option value="">— Select District —</option>
          {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-600">Select Block</label>
        <select className={sel} value={selBlockId} disabled={!selDistId}
          onChange={e => {
            const b = blocks.find(x => String(x.id) === e.target.value)
            setSelBlockId(e.target.value)
            setForm(p => ({
              ...p,
              block_name: b?.name ?? '',
              block_lgd:  b?.lgd_code ?? '',
              gp_name: '', gp_lgd: '',
            }))
          }}>
          <option value="">— Select Block —</option>
          {blocks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-600">Select GP</label>
        <select className={sel} disabled={!selBlockId}
          onChange={e => {
            const g = gps.find(x => String(x.id) === e.target.value)
            setForm(p => ({
              ...p,
              gp_name: g?.name ?? '',
              gp_lgd:  g?.lgd_code ?? '',
            }))
          }}>
          <option value="">— Select GP —</option>
          {gps.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
      </div>

      {/* Read-only LGD code displays */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-400">District LGD (auto)</label>
        <input className={inp} value={form.district_lgd ?? ''} readOnly placeholder="Auto-filled" />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-400">Block LGD (auto)</label>
        <input className={inp} value={form.block_lgd ?? ''} readOnly placeholder="Auto-filled" />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-400">GP LGD (auto)</label>
        <input className={inp} value={form.gp_lgd ?? ''} readOnly placeholder="Auto-filled" />
      </div>
    </>
  )
}

function BoothsTab({ booths, onReload }) {
  const [modal, setModal]   = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm]     = useState({})
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [geoFilters, setGeoFilters] = useState({})
  const [search, setSearch] = useState('')
  // Dedicated filter state for the booth list GP/Block dropdowns
  const [filterDistricts, setFilterDistricts] = useState([])
  const [filterBlocks, setFilterBlocks]       = useState([])
  const [filterGps, setFilterGps]             = useState([])
  const [filterDistId, setFilterDistId]       = useState('')
  const [filterBlockId, setFilterBlockId]     = useState('')
  const [filterGpId, setFilterGpId]           = useState('')

  // Load districts for filter bar
  useEffect(() => {
    geographyAPI.districts.list({ page_size: 200 })
      .then(r => setFilterDistricts(r.data.results ?? r.data)).catch(() => {})
  }, [])
  useEffect(() => {
    if (!filterDistId) { setFilterBlocks([]); setFilterGps([]); return }
    geographyAPI.blocks.list({ district: filterDistId, page_size: 200 })
      .then(r => setFilterBlocks(r.data.results ?? r.data)).catch(() => {})
    setFilterBlockId(''); setFilterGpId('')
    setFilterGps([])
  }, [filterDistId])
  useEffect(() => {
    if (!filterBlockId) { setFilterGps([]); return }
    geographyAPI.gps.list({ block: filterBlockId, page_size: 200 })
      .then(r => setFilterGps(r.data.results ?? r.data)).catch(() => {})
    setFilterGpId('')
  }, [filterBlockId])

  const openCreate = () => { setEditing(null); setForm({}); setModal(true) }
  const openEdit   = (b)  => { setEditing(b); setForm({ ...b }); setModal(true) }

  const filteredBooths = booths.filter(b => {
    const selDist  = filterDistricts.find(d => String(d.id) === filterDistId)
    const selBlock = filterBlocks.find(bl => String(bl.id) === filterBlockId)
    const selGp    = filterGps.find(g => String(g.id) === filterGpId)
    if (selDist  && b.district_lgd !== selDist.lgd_code)  return false
    if (selBlock && b.block_lgd    !== selBlock.lgd_code)  return false
    if (selGp    && b.gp_lgd       !== selGp.lgd_code)     return false
    if (search && !b.booth_name?.toLowerCase().includes(search.toLowerCase())
               && !b.booth_number?.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const save = async () => {
    setSaving(true)
    try {
      if (editing) {
        await api.patch(`/opinion/booths/${editing.id}/`, form)
        toast.success('Booth updated')
      } else {
        await api.post('/opinion/booths/', form)
        toast.success('Booth created')
      }
      onReload(); setModal(false)
    } catch { toast.error('Save failed') }
    finally { setSaving(false) }
  }

  const del = async (id) => {
    setDeleting(id)
    try { await api.delete(`/opinion/booths/${id}/`); onReload(); toast.success('Deleted') }
    catch { toast.error('Delete failed') }
    finally { setDeleting(null) }
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Filter size={13} className="text-slate-400" />
          <select className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
            value={filterDistId} onChange={e => { setFilterDistId(e.target.value) }}>
            <option value="">All Districts</option>
            {filterDistricts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <select className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
            value={filterBlockId} disabled={!filterDistId} onChange={e => { setFilterBlockId(e.target.value) }}>
            <option value="">All Blocks</option>
            {filterBlocks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <select className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
            value={filterGpId} disabled={!filterBlockId} onChange={e => { setFilterGpId(e.target.value) }}>
            <option value="">All GPs</option>
            {filterGps.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
          {(filterDistId || filterBlockId || filterGpId) && (
            <button onClick={() => { setFilterDistId(''); setFilterBlockId(''); setFilterGpId('') }}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-500 hover:text-indigo-600 border border-slate-200 rounded-lg hover:bg-slate-50">
              <X size={11} /> Clear
            </button>
          )}
        </div>
        <div className="relative max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search booths..."
            className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        </div>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-sm text-slate-500">{filteredBooths.length} booth{filteredBooths.length !== 1 ? 's' : ''}</span>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
          <Plus size={15} /> Add Booth
        </button>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
            <tr>
              <th className="px-4 py-3 text-left">Booth No.</th>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">District</th>
              <th className="px-4 py-3 text-left">Block / GP</th>
              <th className="px-4 py-3 text-right">Voters</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredBooths.length === 0 && (
              <tr><td colSpan={6} className="text-center py-10 text-slate-400">No booths match filters.</td></tr>
            )}
            {filteredBooths.map(b => (
              <tr key={b.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-mono font-semibold text-indigo-700">{b.booth_number}</td>
                <td className="px-4 py-3 text-slate-700">{b.booth_name}</td>
                <td className="px-4 py-3 text-slate-500">{b.district_name}</td>
                <td className="px-4 py-3 text-slate-500">{b.block_name} / {b.gp_name}</td>
                <td className="px-4 py-3 text-right text-slate-600">{b.total_voters.toLocaleString()}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => openEdit(b)} className="p-1.5 rounded-lg hover:bg-indigo-50 text-indigo-600"><Edit2 size={14} /></button>
                    <button onClick={() => del(b.id)} disabled={deleting === b.id}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 disabled:opacity-40">
                      {deleting === b.id ? <Spinner /> : <Trash2 size={14} />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Booth' : 'Add Booth'} wide>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Booth Number *">
            <input className={inp} value={form.booth_number ?? ''} onChange={e => setForm(p => ({ ...p, booth_number: e.target.value }))} />
          </Field>
          <Field label="Booth Name *">
            <input className={inp} value={form.booth_name ?? ''} onChange={e => setForm(p => ({ ...p, booth_name: e.target.value }))} />
          </Field>
          {/* Cascading District → Block → GP selector */}
          <BoothGeoSelector form={form} setForm={setForm} />
          <Field label="Total Voters">
            <input type="number" className={inp} value={form.total_voters ?? ''} onChange={e => setForm(p => ({ ...p, total_voters: e.target.value }))} />
          </Field>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setModal(false)} className="px-4 py-2 text-sm rounded-lg border hover:bg-slate-50">Cancel</button>
          <button onClick={save} disabled={saving}
            className="px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60 flex items-center gap-2">
            {saving ? <Spinner /> : <Check size={14} />} Save
          </button>
        </div>
      </Modal>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// ELECTION RESULTS TAB
// ══════════════════════════════════════════════════════════════════════════════
function ResultsTab({ booths }) {
  const [results, setResults]   = useState([])
  const [loading, setLoading]   = useState(false)
  const [modal, setModal]       = useState(false)
  const [csvModal, setCsvModal] = useState(false)
  const [editing, setEditing]   = useState(null)
  const [form, setForm]         = useState({})
  const [saving, setSaving]     = useState(false)
  const [filterBooth, setFilterBooth] = useState('')
  const fileRef = useRef()

  const load = () => {
    setLoading(true)
    const params = {}
    if (filterBooth) params.booth = filterBooth
    api.get('/opinion/election-results/', { params })
      .then(r => setResults(r.data.results ?? r.data))
      .catch(() => toast.error('Failed to load results'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [filterBooth])

  const openCreate = () => { setEditing(null); setForm({}); setModal(true) }
  const openEdit   = (r) => { setEditing(r); setForm({ ...r }); setModal(true) }

  const save = async () => {
    setSaving(true)
    try {
      if (editing) {
        await api.patch(`/opinion/election-results/${editing.id}/`, form)
        toast.success('Updated')
      } else {
        await api.post('/opinion/election-results/', form)
        toast.success('Created')
      }
      load(); setModal(false)
    } catch { toast.error('Save failed') }
    finally { setSaving(false) }
  }

  const del = async (id) => {
    if (!confirm('Delete this result?')) return
    try { await api.delete(`/opinion/election-results/${id}/`); load(); toast.success('Deleted') }
    catch { toast.error('Delete failed') }
  }

  const uploadCSV = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const form = new FormData()
    form.append('file', file)
    try {
      const r = await api.post('/opinion/election-results/upload-csv/', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      const d = r.data
      toast.success(`CSV processed: ${d.created} created, ${d.updated} updated${d.errors.length ? `, ${d.errors.length} errors` : ''}`)
      if (d.errors.length) console.warn('CSV errors:', d.errors)
      load(); setCsvModal(false)
    } catch { toast.error('CSV upload failed') }
    e.target.value = ''
  }

  // Chart for selected booth
  const chartData = results
    .filter(r => !filterBooth || String(r.booth) === String(filterBooth))
    .map(r => ({
      name: `${r.election_year}${r.election_name ? ' · ' + r.election_name : ''}`,
      'Total Votes':    r.total_votes,
      'Votes Received': r.votes_received,
      'Vote Share %':   r.vote_share,
      result: r.result,
    }))
    .sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-end justify-between">
        <div className="flex gap-3 items-end">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Filter by Booth</label>
            <select value={filterBooth} onChange={e => setFilterBooth(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 min-w-[200px]">
              <option value="">All Booths</option>
              {booths.map(b => <option key={b.id} value={b.id}>{b.booth_number} – {b.booth_name}</option>)}
            </select>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setCsvModal(true)}
            className="flex items-center gap-2 px-4 py-2 border border-indigo-300 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-50">
            <Upload size={14} /> Upload CSV
          </button>
          <button onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
            <Plus size={14} /> Add Result
          </button>
        </div>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-xl border p-5">
          <h3 className="font-semibold text-slate-700 mb-4">
            {filterBooth ? 'Booth Election History' : 'All Results – Vote Count'}
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 40, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="Total Votes"    fill="#e2e8f0" radius={[4,4,0,0]} />
              <Bar dataKey="Votes Received" fill="#6366f1" radius={[4,4,0,0]}>
                {chartData.map((d, i) => (
                  <Cell key={i} fill={d.result === 'won' ? '#22c55e' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="text-xs text-slate-400 text-center mt-1">Green = Won · Red = Lost</p>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-32"><Spinner /></div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Booth</th>
                <th className="px-4 py-3 text-left">Election</th>
                <th className="px-4 py-3 text-right">Total Votes</th>
                <th className="px-4 py-3 text-right">Votes Received</th>
                <th className="px-4 py-3 text-right">Vote Share</th>
                <th className="px-4 py-3 text-center">Result</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {results.length === 0 && (
                <tr><td colSpan={7} className="text-center py-10 text-slate-400">No results yet.</td></tr>
              )}
              {results.map(r => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-800">{r.booth_number}</div>
                    <div className="text-xs text-slate-400">{r.booth_name}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    <div className="font-medium">{r.election_year}</div>
                    <div className="text-xs text-slate-400">{r.election_name}</div>
                  </td>
                  <td className="px-4 py-3 text-right text-slate-600">{r.total_votes.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-slate-600">{r.votes_received.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right font-semibold text-indigo-600">{r.vote_share}%</td>
                  <td className="px-4 py-3 text-center"><Badge result={r.result} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(r)} className="p-1.5 rounded-lg hover:bg-indigo-50 text-indigo-600"><Edit2 size={14} /></button>
                      <button onClick={() => del(r.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add/Edit modal */}
      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Result' : 'Add Election Result'} wide>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Booth *">
            <select className={inp} value={form.booth ?? ''} onChange={e => setForm(p => ({ ...p, booth: e.target.value }))}>
              <option value="">Select booth</option>
              {booths.map(b => <option key={b.id} value={b.id}>{b.booth_number} – {b.booth_name}</option>)}
            </select>
          </Field>
          <Field label="Election Year *">
            <input type="number" className={inp} value={form.election_year ?? ''} onChange={e => setForm(p => ({ ...p, election_year: e.target.value }))} placeholder="2024" />
          </Field>
          <Field label="Election Name">
            <input className={inp} value={form.election_name ?? ''} onChange={e => setForm(p => ({ ...p, election_name: e.target.value }))} placeholder="e.g. Lok Sabha 2024" />
          </Field>
          <Field label="Result *">
            <select className={inp} value={form.result ?? ''} onChange={e => setForm(p => ({ ...p, result: e.target.value }))}>
              <option value="">Select</option>
              <option value="won">Won</option>
              <option value="lost">Lost</option>
            </select>
          </Field>
          <Field label="Total Votes *">
            <input type="number" className={inp} value={form.total_votes ?? ''} onChange={e => setForm(p => ({ ...p, total_votes: e.target.value }))} />
          </Field>
          <Field label="Votes Received *">
            <input type="number" className={inp} value={form.votes_received ?? ''} onChange={e => setForm(p => ({ ...p, votes_received: e.target.value }))} />
          </Field>
          <div className="col-span-2">
            <Field label="Notes">
              <textarea rows={2} className={inp} value={form.notes ?? ''} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
            </Field>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setModal(false)} className="px-4 py-2 text-sm rounded-lg border hover:bg-slate-50">Cancel</button>
          <button onClick={save} disabled={saving}
            className="px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60 flex items-center gap-2">
            {saving ? <Spinner /> : <Check size={14} />} Save
          </button>
        </div>
      </Modal>

      {/* CSV modal */}
      <Modal open={csvModal} onClose={() => setCsvModal(false)} title="Upload Election Results CSV">
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
            <p className="font-semibold mb-1">Required CSV columns:</p>
            <code className="bg-amber-100 px-1 rounded">booth_number, election_year, election_name, total_votes, votes_received, result, notes</code>
            <p className="mt-2">• <code>result</code> must be <code>won</code> or <code>lost</code></p>
            <p>• If booth_number doesn't exist, that row will be skipped</p>
            <p>• Existing records (same booth + year + name) will be updated</p>
          </div>
          <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-300 transition-colors"
            onClick={() => fileRef.current?.click()}>
            <Upload size={28} className="mx-auto text-slate-400 mb-2" />
            <p className="text-sm font-medium text-slate-600">Click to select CSV file</p>
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={uploadCSV} />
          </div>
        </div>
      </Modal>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// OPINION TASKS TAB
// ══════════════════════════════════════════════════════════════════════════════
function TasksTab({ booths, operators }) {
  const [tasks, setTasks]         = useState([])
  const [entries, setEntries]     = useState([]  )
  const [loading, setLoading]     = useState(false)
  const [modal, setModal]         = useState(false)
  const [viewTask, setViewTask]   = useState(null)
  const [form, setForm]           = useState({})
  const [saving, setSaving]       = useState(false)
  const [geoFilters, setGeoFilters] = useState({})

  const filteredBooths = booths.filter(b => {
    if (geoFilters.district_lgd && b.district_lgd !== geoFilters.district_lgd) return false
    if (geoFilters.block_lgd    && b.block_lgd    !== geoFilters.block_lgd)    return false
    if (geoFilters.gp_lgd       && b.gp_lgd       !== geoFilters.gp_lgd)       return false
    return true
  })

  const load = () => {
    setLoading(true)
    api.get('/opinion/tasks/')
      .then(r => setTasks(r.data.results ?? r.data))
      .catch(() => toast.error('Failed to load tasks'))
      .finally(() => setLoading(false))
  }

  const loadEntries = (taskId) => {
    api.get('/opinion/entries/', { params: { task: taskId } })
      .then(r => setEntries(r.data.results ?? r.data))
      .catch(() => {})
  }

  useEffect(() => { load() }, [])

  const save = async () => {
    setSaving(true)
    try {
      await api.post('/opinion/tasks/', form)
      toast.success('Task assigned')
      load(); setModal(false)
    } catch (e) {
      toast.error(e.response?.data?.detail ?? 'Save failed')
    } finally { setSaving(false) }
  }

  const del = async (id) => {
    if (!confirm('Delete this task?')) return
    try { await api.delete(`/opinion/tasks/${id}/`); load(); toast.success('Deleted') }
    catch { toast.error('Delete failed') }
  }

  const disassign = async (t) => {
    if (!confirm(`Disassign ${t.operator_name} from this task?`)) return
    try {
      await api.patch(`/opinion/tasks/${t.id}/`, { is_active: false })
      toast.success('Task disassigned')
      load()
    } catch { toast.error('Disassign failed') }
  }

  const openView = (task) => {
    setViewTask(task)
    loadEntries(task.id)
  }

  // Filter tasks by geo (match booth's geo fields)
  const filteredTasks = tasks.filter(t => {
    if (geoFilters.district_lgd && t.district_lgd && t.district_lgd !== geoFilters.district_lgd) return false
    if (geoFilters.block_lgd    && t.block_lgd    && t.block_lgd    !== geoFilters.block_lgd)    return false
    if (geoFilters.gp_lgd       && t.gp_lgd       && t.gp_lgd       !== geoFilters.gp_lgd)       return false
    return true
  })

  // Chart: entries for viewed task
  const entryChartData = entries.map((e, i) => ({
    name: e.place_visited,
    'Vote %': parseFloat(e.estimated_vote_pct),
  }))

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border p-4">
        <GeoFilterBar geoFilters={geoFilters} setGeoFilters={setGeoFilters} />
      </div>
      <div className="flex justify-between items-center">
        <span className="text-sm text-slate-500">{filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}</span>
        <button onClick={() => { setForm({}); setModal(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
          <Plus size={14} /> Assign Task
        </button>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-32"><Spinner /></div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Booth</th>
                <th className="px-4 py-3 text-left">Operator</th>
                <th className="px-4 py-3 text-right">Entries</th>
                <th className="px-4 py-3 text-right">Avg Vote %</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTasks.length === 0 && (
                <tr><td colSpan={6} className="text-center py-10 text-slate-400">No tasks found.</td></tr>
              )}
              {filteredTasks.map(t => (
                <tr key={t.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-800">{t.booth_number}</div>
                    <div className="text-xs text-slate-400">{t.booth_name}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{t.operator_name}</td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-semibold text-slate-700">{t.entry_count}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {t.avg_vote_pct != null
                      ? <span className="font-bold text-indigo-600">{t.avg_vote_pct}%</span>
                      : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={cls('px-2 py-0.5 rounded-full text-xs font-semibold',
                      t.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500')}>
                      {t.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <button onClick={() => openView(t)} className="p-1.5 rounded-lg hover:bg-indigo-50 text-indigo-600" title="View entries"><Eye size={14} /></button>
                      {t.is_active && (
                        <button onClick={() => disassign(t)} className="p-1.5 rounded-lg hover:bg-orange-50 text-orange-500" title="Disassign operator"><UserMinus size={14} /></button>
                      )}
                      <button onClick={() => del(t.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500" title="Delete task"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Assign task modal */}
      <Modal open={modal} onClose={() => setModal(false)} title="Assign Opinion Task">
        <div className="space-y-4">
          <Field label="Booth *">
            <select className={inp} value={form.booth ?? ''} onChange={e => setForm(p => ({ ...p, booth: e.target.value }))}>
              <option value="">Select booth</option>
              {filteredBooths.map(b => <option key={b.id} value={b.id}>{b.booth_number} – {b.booth_name}</option>)}
            </select>
          </Field>
          <Field label="Operator *">
            <select className={inp} value={form.operator ?? ''} onChange={e => setForm(p => ({ ...p, operator: e.target.value }))}>
              <option value="">Select operator</option>
              {operators.map(o => <option key={o.id} value={o.id}>{o.full_name} ({o.username})</option>)}
            </select>
          </Field>
          <Field label="Instructions">
            <textarea rows={3} className={inp} value={form.instructions ?? ''} onChange={e => setForm(p => ({ ...p, instructions: e.target.value }))} placeholder="What should the operator look for..." />
          </Field>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setModal(false)} className="px-4 py-2 text-sm rounded-lg border hover:bg-slate-50">Cancel</button>
          <button onClick={save} disabled={saving}
            className="px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60 flex items-center gap-2">
            {saving ? <Spinner /> : <Check size={14} />} Assign
          </button>
        </div>
      </Modal>

      {/* View task entries drawer */}
      <Modal open={!!viewTask} onClose={() => { setViewTask(null); setEntries([]) }} title={`Entries: ${viewTask?.booth_number} – ${viewTask?.operator_name}`} wide>
        {entryChartData.length > 0 && (
          <div className="mb-5">
            <p className="text-xs text-slate-500 mb-3">Vote % per place visited</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={entryChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 10 }} />
                <Tooltip formatter={v => `${v}%`} />
                <Bar dataKey="Vote %" fill="#6366f1" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
            <p className="text-center text-xs text-indigo-700 font-semibold mt-2">
              Average: {viewTask?.avg_vote_pct != null ? `${viewTask.avg_vote_pct}%` : '—'}
            </p>
          </div>
        )}
        <div className="space-y-3 max-h-72 overflow-y-auto">
          {entries.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-6">No entries submitted yet.</p>
          ) : entries.map(e => (
            <div key={e.id} className="border rounded-lg p-3 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-700">{e.place_visited}</span>
                <span className="text-indigo-600 font-bold">{e.estimated_vote_pct}%</span>
              </div>
              <p className="text-xs text-slate-500">{e.reason}</p>
              <p className="text-xs text-slate-300">{new Date(e.submitted_at).toLocaleString()}</p>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// EXTERNAL SOURCES TAB
// ══════════════════════════════════════════════════════════════════════════════
function ExternalTab({ booths }) {
  const [sources, setSources]   = useState([])
  const [loading, setLoading]   = useState(false)
  const [modal, setModal]       = useState(false)
  const [editing, setEditing]   = useState(null)
  const [form, setForm]         = useState({})
  const [saving, setSaving]     = useState(false)
  const [filterBooth, setFilterBooth] = useState('')

  const load = () => {
    setLoading(true)
    const params = {}
    if (filterBooth) params.booth = filterBooth
    api.get('/opinion/external-sources/', { params })
      .then(r => setSources(r.data.results ?? r.data))
      .catch(() => toast.error('Failed to load sources'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [filterBooth])

  const openCreate = () => { setEditing(null); setForm({}); setModal(true) }
  const openEdit   = (s) => { setEditing(s); setForm({ ...s }); setModal(true) }

  const save = async () => {
    setSaving(true)
    try {
      if (editing) {
        await api.patch(`/opinion/external-sources/${editing.id}/`, form)
        toast.success('Updated')
      } else {
        await api.post('/opinion/external-sources/', form)
        toast.success('Created')
      }
      load(); setModal(false)
    } catch { toast.error('Save failed') }
    finally { setSaving(false) }
  }

  const del = async (id) => {
    if (!confirm('Delete this source?')) return
    try { await api.delete(`/opinion/external-sources/${id}/`); load(); toast.success('Deleted') }
    catch { toast.error('Delete failed') }
  }

  const chartData = sources.map(s => ({
    name: s.source_name,
    'Vote %': parseFloat(s.estimated_vote_pct),
    booth: s.booth_number,
  }))

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-end justify-between">
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600">Filter by Booth</label>
          <select value={filterBooth} onChange={e => setFilterBooth(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 min-w-[200px]">
            <option value="">All Booths</option>
            {booths.map(b => <option key={b.id} value={b.id}>{b.booth_number} – {b.booth_name}</option>)}
          </select>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
          <Plus size={14} /> Add Source
        </button>
      </div>

      {chartData.length > 0 && (
        <div className="bg-white rounded-xl border p-5">
          <h3 className="font-semibold text-slate-700 mb-4">External Source Vote Estimates</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ bottom: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" />
              <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 10 }} />
              <Tooltip formatter={v => `${v}%`} />
              <Bar dataKey="Vote %" radius={[4,4,0,0]}>
                {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="bg-white rounded-xl border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-32"><Spinner /></div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Booth</th>
                <th className="px-4 py-3 text-left">Source</th>
                <th className="px-4 py-3 text-right">Vote %</th>
                <th className="px-4 py-3 text-left">Notes</th>
                <th className="px-4 py-3 text-left">Collected By</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sources.length === 0 && (
                <tr><td colSpan={6} className="text-center py-10 text-slate-400">No external sources yet.</td></tr>
              )}
              {sources.map(s => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-700">{s.booth_number}</td>
                  <td className="px-4 py-3 text-slate-700">{s.source_name}</td>
                  <td className="px-4 py-3 text-right font-bold text-green-600">{s.estimated_vote_pct}%</td>
                  <td className="px-4 py-3 text-slate-500 text-xs max-w-[200px] truncate">{s.notes || '—'}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{s.collected_by_name}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg hover:bg-indigo-50 text-indigo-600"><Edit2 size={14} /></button>
                      <button onClick={() => del(s.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Source' : 'Add External Source'} wide>
        <div className="space-y-4">
          <Field label="Booth *">
            <select className={inp} value={form.booth ?? ''} onChange={e => setForm(p => ({ ...p, booth: e.target.value }))}>
              <option value="">Select booth</option>
              {booths.map(b => <option key={b.id} value={b.id}>{b.booth_number} – {b.booth_name}</option>)}
            </select>
          </Field>
          <Field label="Source Name *">
            <input className={inp} value={form.source_name ?? ''} onChange={e => setForm(p => ({ ...p, source_name: e.target.value }))} placeholder="e.g. Party Survey, Local Leader" />
          </Field>
          <Field label="Estimated Vote % *">
            <input type="number" min="0" max="100" step="0.01" className={inp} value={form.estimated_vote_pct ?? ''} onChange={e => setForm(p => ({ ...p, estimated_vote_pct: e.target.value }))} />
          </Field>
          <Field label="Notes">
            <textarea rows={2} className={inp} value={form.notes ?? ''} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
          </Field>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setModal(false)} className="px-4 py-2 text-sm rounded-lg border hover:bg-slate-50">Cancel</button>
          <button onClick={save} disabled={saving}
            className="px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60 flex items-center gap-2">
            {saving ? <Spinner /> : <Check size={14} />} Save
          </button>
        </div>
      </Modal>
    </div>
  )
}