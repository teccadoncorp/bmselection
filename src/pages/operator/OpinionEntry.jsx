import { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Legend
} from 'recharts'
import {
  MapPin, Plus, Check, X, ChevronDown, ChevronUp,
  TrendingUp, ClipboardList, AlertCircle
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../api/axios'

const cls = (...a) => a.filter(Boolean).join(' ')

const inp = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400'

function Spinner() {
  return <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white rounded-xl border p-4 flex items-start gap-3">
      <div className={cls('p-2 rounded-lg', color)}>
        <Icon size={18} className="text-white" />
      </div>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-xl font-bold text-slate-800 mt-0.5">{value ?? '—'}</p>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
export default function OperatorOpinion() {
  const [tasks, setTasks]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [expandedTask, setExpandedTask] = useState(null)
  const [entriesByTask, setEntriesByTask] = useState({})
  const [newEntry, setNewEntry]   = useState({})
  const [savingFor, setSavingFor] = useState(null)

  const load = () => {
    setLoading(true)
    api.get('/opinion/my-tasks/')
      .then(r => setTasks(r.data))
      .catch(() => toast.error('Failed to load tasks'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const toggleTask = async (task) => {
    if (expandedTask === task.id) {
      setExpandedTask(null)
      return
    }
    setExpandedTask(task.id)
    if (!entriesByTask[task.id]) {
      const r = await api.get('/opinion/entries/', { params: { task: task.id } })
      setEntriesByTask(p => ({ ...p, [task.id]: r.data.results ?? r.data }))
    }
  }

  const submitEntry = async (taskId) => {
    const entry = newEntry[taskId] || {}
    if (!entry.place_visited || !entry.estimated_vote_pct || !entry.reason) {
      toast.error('Please fill all fields')
      return
    }
    setSavingFor(taskId)
    try {
      await api.post('/opinion/entries/', {
        task: taskId,
        place_visited: entry.place_visited,
        estimated_vote_pct: entry.estimated_vote_pct,
        reason: entry.reason,
      })
      toast.success('Opinion submitted!')
      // Reload entries for this task
      const r = await api.get('/opinion/entries/', { params: { task: taskId } })
      setEntriesByTask(p => ({ ...p, [taskId]: r.data.results ?? r.data }))
      // Clear form
      setNewEntry(p => ({ ...p, [taskId]: {} }))
      // Reload tasks to refresh avg
      load()
    } catch { toast.error('Submit failed') }
    finally { setSavingFor(null) }
  }

  const updateField = (taskId, field, value) => {
    setNewEntry(p => ({ ...p, [taskId]: { ...(p[taskId] || {}), [field]: value } }))
  }

  const totalTasks    = tasks.length
  const activeTasks   = tasks.filter(t => t.is_active).length
  const totalEntries  = tasks.reduce((a, t) => a + t.entry_count, 0)
  const avgAllPct = (() => {
    const valid = tasks.filter(t => t.avg_vote_pct != null)
    if (!valid.length) return null
    return Math.round(valid.reduce((a, t) => a + t.avg_vote_pct, 0) / valid.length * 10) / 10
  })()

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b px-4 py-4">
        <h1 className="text-lg font-bold text-slate-800">Opinion Collection</h1>
        <p className="text-xs text-slate-500 mt-0.5">Visit booths, enter voter opinions and reasons</p>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Stat row */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={ClipboardList} label="My Tasks"     value={totalTasks}  color="bg-indigo-500" />
          <StatCard icon={TrendingUp}    label="Total Entries" value={totalEntries} color="bg-green-500" />
          <StatCard icon={MapPin}        label="Active Tasks"  value={activeTasks}  color="bg-amber-500" />
          <StatCard icon={TrendingUp}    label="My Avg Vote %" value={avgAllPct != null ? `${avgAllPct}%` : null} color="bg-purple-500" />
        </div>

        {/* All-task summary chart */}
        {tasks.filter(t => t.avg_vote_pct != null).length > 0 && (
          <div className="bg-white rounded-xl border p-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">My Booth Opinion Summary</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={tasks.filter(t => t.avg_vote_pct).map(t => ({
                name: t.booth_number,
                'Avg Vote %': t.avg_vote_pct,
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 10 }} />
                <Tooltip formatter={v => `${v}%`} />
                <Bar dataKey="Avg Vote %" fill="#6366f1" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Task list */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner />
          </div>
        ) : tasks.length === 0 ? (
          <div className="bg-white rounded-xl border p-8 text-center">
            <AlertCircle className="mx-auto text-slate-300 mb-3" size={32} />
            <p className="text-slate-500 font-medium">No opinion tasks assigned yet</p>
            <p className="text-xs text-slate-400 mt-1">Your admin will assign booths for you to visit</p>
          </div>
        ) : (
          tasks.map(task => {
            const isOpen   = expandedTask === task.id
            const entries  = entriesByTask[task.id] ?? []
            const formData = newEntry[task.id] ?? {}

            // Chart for this task's entries
            const chartData = entries.map(e => ({
              place: e.place_visited,
              'Vote %': parseFloat(e.estimated_vote_pct),
            }))

            // Line chart: entry order trend
            const trendData = entries.map((e, i) => ({
              entry: `#${i + 1}`,
              'Vote %': parseFloat(e.estimated_vote_pct),
            }))

            return (
              <div key={task.id} className="bg-white rounded-xl border overflow-hidden">
                {/* Task header */}
                <button
                  className="w-full px-4 py-4 flex items-start justify-between text-left"
                  onClick={() => toggleTask(task)}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-semibold">
                        {task.booth_number}
                      </span>
                      {task.is_active
                        ? <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Active</span>
                        : <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">Inactive</span>}
                    </div>
                    <p className="font-semibold text-slate-800 mt-1">{task.booth_name}</p>
                    <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                      <span>{task.entry_count} entries</span>
                      {task.avg_vote_pct != null && (
                        <span className="text-indigo-600 font-semibold">Avg: {task.avg_vote_pct}%</span>
                      )}
                    </div>
                    {task.instructions && (
                      <p className="text-xs text-slate-400 mt-1 line-clamp-1">{task.instructions}</p>
                    )}
                  </div>
                  {isOpen ? <ChevronUp size={18} className="text-slate-400 shrink-0 mt-1" /> : <ChevronDown size={18} className="text-slate-400 shrink-0 mt-1" />}
                </button>

                {/* Expanded content */}
                {isOpen && (
                  <div className="border-t px-4 py-4 space-y-4 bg-slate-50/50">
                    {/* Entry trend chart */}
                    {entries.length >= 2 && (
                      <div>
                        <p className="text-xs font-semibold text-slate-600 mb-2">Opinion Trend (entry order)</p>
                        <ResponsiveContainer width="100%" height={140}>
                          <LineChart data={trendData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="entry" tick={{ fontSize: 10 }} />
                            <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 9 }} />
                            <Tooltip formatter={v => `${v}%`} />
                            <Line type="monotone" dataKey="Vote %" stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}

                    {/* Bar chart per place */}
                    {chartData.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-slate-600 mb-2">Opinion by Place</p>
                        <ResponsiveContainer width="100%" height={160}>
                          <BarChart data={chartData} margin={{ bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="place" tick={{ fontSize: 9 }} angle={-20} textAnchor="end" />
                            <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 9 }} />
                            <Tooltip formatter={v => `${v}%`} />
                            <Bar dataKey="Vote %" fill="#22c55e" radius={[4,4,0,0]} />
                          </BarChart>
                        </ResponsiveContainer>
                        <p className="text-center text-xs font-bold text-indigo-700 mt-1">
                          Average: {task.avg_vote_pct != null ? `${task.avg_vote_pct}%` : '—'}
                        </p>
                      </div>
                    )}

                    {/* Past entries list */}
                    {entries.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-slate-600 mb-2">Past Entries</p>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {entries.map(e => (
                            <div key={e.id} className="bg-white border rounded-lg px-3 py-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-slate-700">{e.place_visited}</span>
                                <span className="text-indigo-600 font-bold text-sm">{e.estimated_vote_pct}%</span>
                              </div>
                              <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{e.reason}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* New entry form */}
                    {task.is_active && (
                      <div className="bg-white border rounded-xl p-4 space-y-3">
                        <p className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                          <Plus size={14} className="text-indigo-500" /> Add New Entry
                        </p>
                        <div>
                          <label className="text-xs font-medium text-slate-500 block mb-1">Place / Locality Visited *</label>
                          <input
                            className={inp}
                            placeholder="e.g. Ward 4, Near Market"
                            value={formData.place_visited ?? ''}
                            onChange={e => updateField(task.id, 'place_visited', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-slate-500 block mb-1">Estimated Vote % for Our Candidate *</label>
                          <input
                            type="number" min="0" max="100" step="1"
                            className={inp}
                            placeholder="e.g. 60"
                            value={formData.estimated_vote_pct ?? ''}
                            onChange={e => updateField(task.id, 'estimated_vote_pct', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-slate-500 block mb-1">Reason / Ground Observations *</label>
                          <textarea
                            rows={3}
                            className={inp}
                            placeholder="What did people say? What's the ground feeling?"
                            value={formData.reason ?? ''}
                            onChange={e => updateField(task.id, 'reason', e.target.value)}
                          />
                        </div>
                        <button
                          onClick={() => submitEntry(task.id)}
                          disabled={savingFor === task.id}
                          className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 transition-colors">
                          {savingFor === task.id ? <Spinner /> : <Check size={14} />}
                          Submit Opinion
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
