import { useState, useEffect, useRef } from 'react'
import {
  Users, Plus, Search, Filter, Edit2, Trash2, X, Check,
  Phone, Mail, MapPin, User, Upload, ChevronDown, BarChart2,
  UserCheck, Building2, RefreshCw
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell
} from 'recharts'
import toast from 'react-hot-toast'
import { boothCommitteeAPI, geographyAPI } from '../../api'

// ─── helpers ──────────────────────────────────────────────────────────────────
const cls = (...a) => a.filter(Boolean).join(' ')
const inp = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400'

const ROLE_COLORS = {
  'President':      'bg-purple-100 text-purple-700',
  'Vice President': 'bg-indigo-100 text-indigo-700',
  'Secretary':      'bg-blue-100 text-blue-700',
  'Treasurer':      'bg-green-100 text-green-700',
  'Member':         'bg-slate-100 text-slate-600',
  'Booth Agent':    'bg-amber-100 text-amber-700',
  'Youth Wing':     'bg-cyan-100 text-cyan-700',
  'Mahila Wing':    'bg-pink-100 text-pink-700',
  'Other':          'bg-gray-100 text-gray-600',
}
const ROLES = Object.keys(ROLE_COLORS)
const CHART_COLORS = ['#6366f1','#22c55e','#f59e0b','#ef4444','#14b8a6','#a855f7','#f97316','#0ea5e9','#ec4899']

function Spinner() {
  return <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
}

function Modal({ open, onClose, title, children, wide }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className={cls('bg-white rounded-2xl shadow-2xl w-full overflow-y-auto max-h-[90vh]', wide ? 'max-w-2xl' : 'max-w-lg')}>
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white z-10">
          <h3 className="font-semibold text-slate-800">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 text-slate-500"><X size={18} /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

function Field({ label, required, children }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-slate-600">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      {children}
    </div>
  )
}

function RoleBadge({ role }) {
  return (
    <span className={cls('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold', ROLE_COLORS[role] ?? ROLE_COLORS['Other'])}>
      {role}
    </span>
  )
}

// ─── Geo filter bar (cascading District → Block → GP) ─────────────────────────
function GeoFilterBar({ filters, onChange }) {
  const [districts, setDistricts] = useState([])
  const [blocks, setBlocks]       = useState([])
  const [gps, setGps]             = useState([])
  const [distId, setDistId]       = useState('')
  const [blockId, setBlockId]     = useState('')

  useEffect(() => {
    geographyAPI.districts.list({ page_size: 200 }).then(r => setDistricts(r.data.results ?? r.data)).catch(() => {})
  }, [])

  useEffect(() => {
    if (!distId) { setBlocks([]); setGps([]); return }
    geographyAPI.blocks.list({ district: distId, page_size: 200 }).then(r => setBlocks(r.data.results ?? r.data)).catch(() => {})
  }, [distId])

  useEffect(() => {
    if (!blockId) { setGps([]); return }
    geographyAPI.gps.list({ block: blockId, page_size: 200 }).then(r => setGps(r.data.results ?? r.data)).catch(() => {})
  }, [blockId])

  const sel = 'border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white'

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <select className={sel} value={distId}
        onChange={e => {
          setDistId(e.target.value); setBlockId('')
          const d = districts.find(x => String(x.id) === e.target.value)
          onChange({ ...filters, district: e.target.value || undefined, block: undefined, gp: undefined, _distName: d?.name })
        }}>
        <option value="">All Districts</option>
        {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
      </select>

      <select className={sel} value={blockId} disabled={!distId}
        onChange={e => {
          setBlockId(e.target.value)
          onChange({ ...filters, block: e.target.value || undefined, gp: undefined })
        }}>
        <option value="">All Blocks</option>
        {blocks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
      </select>

      <select className={sel} disabled={!blockId}
        onChange={e => onChange({ ...filters, gp: e.target.value || undefined })}>
        <option value="">All GPs</option>
        {gps.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
      </select>

      <select className={sel}
        onChange={e => onChange({ ...filters, role: e.target.value || undefined })}>
        <option value="">All Roles</option>
        {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
      </select>

      <button onClick={() => { setDistId(''); setBlockId(''); onChange({}) }}
        className="flex items-center gap-1 px-3 py-2 text-sm text-slate-500 hover:text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50">
        <RefreshCw size={13} /> Reset
      </button>
    </div>
  )
}

// ─── Member form (used for both Add & Edit) ───────────────────────────────────
function MemberForm({ initial = {}, onSave, onClose }) {
  const [form, setForm] = useState({
    name: '', role: 'Member', mobile_number: '', alternate_mobile: '',
    email: '', address: '', booth_number: '', booth_name: '',
    village_name: '', notes: '', is_active: true,
    district: '', block: '', gram_panchayat: '',
    ...initial,
  })
  const [photo, setPhoto] = useState(null)
  const [preview, setPreview] = useState(initial.photo_url ?? null)
  const [saving, setSaving] = useState(false)
  const [districts, setDistricts] = useState([])
  const [blocks, setBlocks]       = useState([])
  const [gps, setGps]             = useState([])
  const fileRef = useRef()

  useEffect(() => {
    geographyAPI.districts.list({ page_size: 200 }).then(r => setDistricts(r.data.results ?? r.data)).catch(() => {})
  }, [])
  useEffect(() => {
    if (!form.district) { setBlocks([]); return }
    geographyAPI.blocks.list({ district: form.district, page_size: 200 }).then(r => setBlocks(r.data.results ?? r.data)).catch(() => {})
  }, [form.district])
  useEffect(() => {
    if (!form.block) { setGps([]); return }
    geographyAPI.gps.list({ block: form.block, page_size: 200 }).then(r => setGps(r.data.results ?? r.data)).catch(() => {})
  }, [form.block])

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handlePhoto = (e) => {
    const f = e.target.files[0]
    if (!f) return
    setPhoto(f)
    setPreview(URL.createObjectURL(f))
  }

  const save = async () => {
    if (!form.name.trim()) return toast.error('Name is required')
    setSaving(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => {
        if (v !== '' && v !== null && v !== undefined) fd.append(k, v)
      })
      if (photo) fd.append('photo', photo)
      await onSave(fd)
    } catch (e) {
      toast.error(e.response?.data?.detail ?? JSON.stringify(e.response?.data) ?? 'Save failed')
    } finally { setSaving(false) }
  }

  return (
    <div className="space-y-5">
      {/* Photo */}
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-full bg-slate-100 border-2 border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
          {preview
            ? <img src={preview} alt="" className="w-full h-full object-cover" />
            : <User size={32} className="text-slate-300" />}
        </div>
        <div>
          <button onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 rounded-lg text-sm hover:bg-slate-50">
            <Upload size={13} /> Upload Photo
          </button>
          <p className="text-xs text-slate-400 mt-1">Optional · JPG/PNG</p>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Full Name" required>
          <input className={inp} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Member name" />
        </Field>
        <Field label="Role" required>
          <select className={inp} value={form.role} onChange={e => set('role', e.target.value)}>
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </Field>
        <Field label="Mobile Number">
          <input className={inp} value={form.mobile_number} onChange={e => set('mobile_number', e.target.value)} placeholder="10-digit mobile" />
        </Field>
        <Field label="Alternate Mobile">
          <input className={inp} value={form.alternate_mobile} onChange={e => set('alternate_mobile', e.target.value)} placeholder="Alternative number" />
        </Field>
        <Field label="Email">
          <input className={inp} type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@example.com" />
        </Field>
        <Field label="Status">
          <select className={inp} value={form.is_active ? 'true' : 'false'} onChange={e => set('is_active', e.target.value === 'true')}>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </Field>
      </div>

      <div className="border-t pt-4">
        <p className="text-xs font-semibold text-slate-500 uppercase mb-3">Geography</p>
        <div className="grid grid-cols-2 gap-4">
          <Field label="District">
            <select className={inp} value={form.district} onChange={e => { set('district', e.target.value); set('block', ''); set('gram_panchayat', '') }}>
              <option value="">Select district</option>
              {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </Field>
          <Field label="Block">
            <select className={inp} value={form.block} disabled={!form.district} onChange={e => { set('block', e.target.value); set('gram_panchayat', '') }}>
              <option value="">Select block</option>
              {blocks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </Field>
          <Field label="Gram Panchayat">
            <select className={inp} value={form.gram_panchayat} disabled={!form.block} onChange={e => set('gram_panchayat', e.target.value)}>
              <option value="">Select GP</option>
              {gps.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </Field>
          <Field label="Village Name">
            <input className={inp} value={form.village_name} onChange={e => set('village_name', e.target.value)} placeholder="Village" />
          </Field>
          <Field label="Booth Number">
            <input className={inp} value={form.booth_number} onChange={e => set('booth_number', e.target.value)} placeholder="e.g. 42" />
          </Field>
          <Field label="Booth Name">
            <input className={inp} value={form.booth_name} onChange={e => set('booth_name', e.target.value)} placeholder="Booth name/location" />
          </Field>
        </div>
      </div>

      <Field label="Address">
        <textarea rows={2} className={inp} value={form.address} onChange={e => set('address', e.target.value)} placeholder="Full address" />
      </Field>
      <Field label="Notes">
        <textarea rows={2} className={inp} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Any additional notes" />
      </Field>

      <div className="flex justify-end gap-3 pt-2">
        <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border hover:bg-slate-50">Cancel</button>
        <button onClick={save} disabled={saving}
          className="px-5 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60 flex items-center gap-2">
          {saving ? <Spinner /> : <Check size={14} />} Save Member
        </button>
      </div>
    </div>
  )
}

// ─── Stats panel ──────────────────────────────────────────────────────────────
function StatsPanel({ filters }) {
  const [stats, setStats] = useState(null)
  useEffect(() => {
    boothCommitteeAPI.stats(filters)
      .then(r => setStats(r.data))
      .catch(() => {})
  }, [JSON.stringify(filters)])

  if (!stats) return null

  const roleData = (stats.by_role ?? []).map((r, i) => ({
    name: r.role,
    count: r.count,
    fill: CHART_COLORS[i % CHART_COLORS.length],
  }))

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div className="bg-white rounded-xl border p-4 flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
          <Users size={20} className="text-indigo-600" />
        </div>
        <div>
          <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
          <p className="text-xs text-slate-500">Total Members</p>
        </div>
      </div>
      <div className="bg-white rounded-xl border p-4 flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
          <UserCheck size={20} className="text-green-600" />
        </div>
        <div>
          <p className="text-2xl font-bold text-slate-800">{stats.active}</p>
          <p className="text-xs text-slate-500">Active Members</p>
        </div>
      </div>
      <div className="bg-white rounded-xl border p-4">
        <p className="text-xs font-semibold text-slate-500 uppercase mb-2">By Role</p>
        {roleData.length > 0 ? (
          <ResponsiveContainer width="100%" height={80}>
            <BarChart data={roleData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 9 }} interval={0} angle={-20} textAnchor="end" />
              <YAxis tick={{ fontSize: 9 }} />
              <Tooltip formatter={v => [v, 'Members']} />
              <Bar dataKey="count" radius={[3,3,0,0]}>
                {roleData.map((e, i) => <Cell key={i} fill={e.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : <p className="text-xs text-slate-400">No data</p>}
      </div>
    </div>
  )
}

// ─── Member Card ──────────────────────────────────────────────────────────────
function MemberCard({ member, onEdit, onDelete }) {
  return (
    <div className="bg-white rounded-xl border hover:shadow-md transition-shadow p-4">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-full bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
          {member.photo_url
            ? <img src={member.photo_url} alt={member.name} className="w-full h-full object-cover" />
            : <User size={20} className="text-slate-400" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-slate-800 text-sm leading-tight">{member.name}</p>
              <div className="mt-1"><RoleBadge role={member.role} /></div>
            </div>
            <div className="flex gap-1 shrink-0">
              <button onClick={() => onEdit(member)} className="p-1.5 rounded-lg hover:bg-indigo-50 text-indigo-500">
                <Edit2 size={13} />
              </button>
              <button onClick={() => onDelete(member.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400">
                <Trash2 size={13} />
              </button>
            </div>
          </div>

          <div className="mt-2 space-y-1">
            {member.mobile_number && (
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <Phone size={11} className="text-slate-400 shrink-0" />
                <span>{member.mobile_number}</span>
                {member.alternate_mobile && <span className="text-slate-400">/ {member.alternate_mobile}</span>}
              </div>
            )}
            {member.email && (
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Mail size={11} className="text-slate-400 shrink-0" />
                <span className="truncate">{member.email}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <MapPin size={11} className="text-slate-400 shrink-0" />
              <span className="truncate">
                {[member.village_name, member.gp_name, member.block_name, member.district_name].filter(Boolean).join(', ') || '—'}
              </span>
            </div>
            {member.booth_number && (
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Building2 size={11} className="text-slate-400 shrink-0" />
                <span>Booth {member.booth_number}{member.booth_name ? ` – ${member.booth_name}` : ''}</span>
              </div>
            )}
          </div>
          {!member.is_active && (
            <span className="mt-2 inline-block px-2 py-0.5 bg-red-50 text-red-500 text-xs rounded-full">Inactive</span>
          )}
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════════════════
const TABS = [
  { id: 'members', label: 'Members', icon: Users },
  { id: 'stats',   label: 'Statistics', icon: BarChart2 },
]

export default function BoothCommitteePage() {
  const [tab, setTab]         = useState('members')
  const [members, setMembers] = useState([])
  const [total, setTotal]     = useState(0)
  const [loading, setLoading] = useState(false)
  const [search, setSearch]   = useState('')
  const [filters, setFilters] = useState({})
  const [page, setPage]       = useState(1)
  const [modal, setModal]     = useState(false)   // add modal
  const [editMember, setEditMember] = useState(null)

  const PAGE_SIZE = 24

  const load = (overrides = {}) => {
    setLoading(true)
    const params = { page, page_size: PAGE_SIZE, ...filters, ...overrides }
    if (search) params.search = search
    boothCommitteeAPI.list(params)
      .then(r => {
        setMembers(r.data.results ?? r.data)
        setTotal(r.data.count ?? (r.data.results ?? r.data).length)
      })
      .catch(() => toast.error('Failed to load members'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [page, filters, search])

  const handleAdd = async (fd) => {
    await boothCommitteeAPI.create(fd)
    toast.success('Member added')
    setModal(false)
    load()
  }

  const handleEdit = async (fd) => {
    await boothCommitteeAPI.update(editMember.id, fd)
    toast.success('Member updated')
    setEditMember(null)
    load()
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this member?')) return
    try {
      await boothCommitteeAPI.delete(id)
      toast.success('Deleted')
      load()
    } catch { toast.error('Delete failed') }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Booth Committee Members</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage committee contacts by assembly, block, GP, booth & village</p>
        </div>
        <button onClick={() => setModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 shadow-sm">
          <Plus size={15} /> Add Member
        </button>
      </div>

      {/* Tab bar */}
      <div className="bg-white border-b px-6 flex gap-1">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cls(
              'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
              tab === t.id ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            )}>
            <t.icon size={14} />{t.label}
          </button>
        ))}
      </div>

      <div className="p-6">
        {tab === 'stats' && (
          <div className="space-y-4">
            <StatsPanel filters={filters} />
            {/* District breakdown */}
            <DistrictBreakdown filters={filters} />
          </div>
        )}

        {tab === 'members' && (
          <div className="space-y-4">
            {/* Filter bar */}
            <div className="bg-white rounded-xl border p-4 space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Filter size={14} className="text-slate-400" />
                <GeoFilterBar filters={filters} onChange={f => { setFilters(f); setPage(1) }} />
              </div>
              <div className="relative max-w-xs">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  placeholder="Search name, mobile..."
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1) }}
                />
              </div>
            </div>

            {/* Stats mini row */}
            <div className="flex items-center justify-between text-sm text-slate-500">
              <span>{total.toLocaleString()} member{total !== 1 ? 's' : ''} found</span>
              <button onClick={() => load()} className="flex items-center gap-1 hover:text-indigo-600">
                <RefreshCw size={13} /> Refresh
              </button>
            </div>

            {/* Members grid */}
            {loading ? (
              <div className="flex items-center justify-center h-48"><Spinner /></div>
            ) : members.length === 0 ? (
              <div className="bg-white rounded-xl border flex flex-col items-center justify-center h-48 text-slate-400">
                <Users size={36} className="mb-2 opacity-30" />
                <p className="text-sm">No members found. Adjust filters or add a member.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {members.map(m => (
                  <MemberCard
                    key={m.id}
                    member={m}
                    onEdit={setEditMember}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-2">
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                  className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40 hover:bg-slate-50">← Prev</button>
                <span className="text-sm text-slate-500">Page {page} / {totalPages}</span>
                <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
                  className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40 hover:bg-slate-50">Next →</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title="Add Committee Member" wide>
        <MemberForm onSave={handleAdd} onClose={() => setModal(false)} />
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editMember} onClose={() => setEditMember(null)} title="Edit Committee Member" wide>
        {editMember && (
          <MemberForm
            initial={{
              ...editMember,
              district: editMember.district ?? '',
              block: editMember.block ?? '',
              gram_panchayat: editMember.gram_panchayat ?? '',
            }}
            onSave={handleEdit}
            onClose={() => setEditMember(null)}
          />
        )}
      </Modal>
    </div>
  )
}

// ─── District breakdown table ─────────────────────────────────────────────────
function DistrictBreakdown({ filters }) {
  const [data, setData] = useState([])
  useEffect(() => {
    boothCommitteeAPI.stats(filters)
      .then(r => setData(r.data.by_district ?? []))
      .catch(() => {})
  }, [JSON.stringify(filters)])

  if (!data.length) return null
  const chartData = data.slice(0, 10).map((d, i) => ({
    name: d.district__name ?? 'Unknown',
    Members: d.count,
    fill: CHART_COLORS[i % CHART_COLORS.length],
  }))

  return (
    <div className="bg-white rounded-xl border p-5">
      <p className="text-sm font-semibold text-slate-700 mb-4">Members by District (Top 10)</p>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={chartData} margin={{ top: 0, right: 10, left: 0, bottom: 30 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" interval={0} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Bar dataKey="Members" radius={[4,4,0,0]}>
            {chartData.map((e, i) => <Cell key={i} fill={e.fill} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
