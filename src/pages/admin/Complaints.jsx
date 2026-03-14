import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, AlertCircle, CheckCircle2, Clock, Trash2, Eye } from 'lucide-react'
import toast from 'react-hot-toast'
import { complaintAPI } from '../../api'
import Spinner from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'
import Pagination from '../../components/ui/Pagination'
import Select from '../../components/ui/Select'
import Modal from '../../components/ui/Modal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { useDistricts, useBlocks, useGPs } from '../../hooks/useGeography'
import { getErrorMessage, formatDateTime } from '../../utils'

const COMPLAINT_TYPES = [
  'Corruption / Bribery',
  'Amount Not Credited',
  'House Not Constructed',
  'Wrong Beneficiary',
  'Harassment',
  'Other',
]

const STATUS_OPTIONS = ['Open', 'In Progress', 'Resolved', 'Closed']

const statusBadge = (s) => {
  if (s === 'Resolved' || s === 'Closed') return 'badge-green'
  if (s === 'In Progress') return 'badge-blue'
  return 'badge-yellow'
}

const statusIcon = (s) => {
  if (s === 'Resolved' || s === 'Closed') return <CheckCircle2 size={14} className="text-green-500" />
  if (s === 'In Progress') return <Clock size={14} className="text-blue-500" />
  return <AlertCircle size={14} className="text-amber-500" />
}

const EMPTY_FORM = {
  complainant_name: '',
  mobile_number: '',
  complaint_type: '',
  description: '',
  district: '',
  block: '',
  gp: '',
  status: 'Open',
  resolution_notes: '',
}

export default function AdminComplaints() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [modal, setModal] = useState(null) // 'create' | 'view' | 'delete'
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)

  // Filters
  const [filterStatus, setFilterStatus] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterDistrictObj, setFilterDistrictObj] = useState(null)
  const [filterBlockObj, setFilterBlockObj] = useState(null)
  const [filterGpObj, setFilterGpObj] = useState(null)

  // Form geography
  const [formDistrictObj, setFormDistrictObj] = useState(null)
  const [formBlockObj, setFormBlockObj] = useState(null)
  const [formGpObj, setFormGpObj] = useState(null)

  const { data: districts } = useDistricts()
  const { data: filterBlocks } = useBlocks(filterDistrictObj?.id)
  const { data: filterGps } = useGPs(filterBlockObj?.id)
  const { data: formBlocks } = useBlocks(formDistrictObj?.id)
  const { data: formGps } = useGPs(formBlockObj?.id)

  const params = {
    page, page_size: 20,
    ...(filterStatus && { status: filterStatus }),
    ...(filterType && { complaint_type: filterType }),
    ...(filterDistrictObj && { district: filterDistrictObj.name }),
    ...(filterBlockObj && { block: filterBlockObj.name }),
    ...(filterGpObj && { gp: filterGpObj.name }),
  }

  const { data, isLoading } = useQuery({
    queryKey: ['complaints', params],
    queryFn: () => complaintAPI.list(params).then(r => r.data),
  })

  const createMut = useMutation({
    mutationFn: () => complaintAPI.create(form),
    onSuccess: () => {
      toast.success('Complaint registered')
      setModal(null)
      setForm(EMPTY_FORM)
      qc.invalidateQueries({ queryKey: ['complaints'] })
    },
    onError: e => toast.error(getErrorMessage(e)),
  })

  const updateMut = useMutation({
    mutationFn: () => complaintAPI.update(selected.id, { status: form.status, resolution_notes: form.resolution_notes }),
    onSuccess: () => {
      toast.success('Complaint updated')
      setModal(null)
      qc.invalidateQueries({ queryKey: ['complaints'] })
    },
    onError: e => toast.error(getErrorMessage(e)),
  })

  const deleteMut = useMutation({
    mutationFn: () => complaintAPI.delete(selected.id),
    onSuccess: () => {
      toast.success('Deleted')
      setModal(null)
      qc.invalidateQueries({ queryKey: ['complaints'] })
    },
    onError: e => toast.error(getErrorMessage(e)),
  })

  const openCreate = () => {
    setSelected(null)
    setForm(EMPTY_FORM)
    setFormDistrictObj(null); setFormBlockObj(null); setFormGpObj(null)
    setModal('create')
  }

  const openView = (item) => {
    setSelected(item)
    setForm({ ...item })
    setModal('view')
  }

  const results = data?.results || []
  const count = data?.count || 0

  // Summary counts
  const open = results.filter(r => r.status === 'Open').length
  const inProgress = results.filter(r => r.status === 'In Progress').length
  const resolved = results.filter(r => r.status === 'Resolved' || r.status === 'Closed').length

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-slate-800">Complaints</h1>
          <p className="text-slate-400 text-sm">Manage complaints from GPs, Blocks, and Districts</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus size={16} /> New Complaint
        </button>
      </div>

      {/* Status summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Open', value: count > 0 ? open : '—', color: 'text-amber-600 bg-amber-50', icon: AlertCircle },
          { label: 'In Progress', value: count > 0 ? inProgress : '—', color: 'text-blue-600 bg-blue-50', icon: Clock },
          { label: 'Resolved', value: count > 0 ? resolved : '—', color: 'text-green-600 bg-green-50', icon: CheckCircle2 },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="card p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
              <Icon size={20} />
            </div>
            <div>
              <p className="text-xs text-slate-400">{label}</p>
              <p className="font-display font-bold text-xl text-slate-800">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card p-4 grid grid-cols-2 md:grid-cols-5 gap-3">
        <Select
          placeholder="All Statuses"
          value={filterStatus}
          onChange={v => { setFilterStatus(v); setPage(1) }}
          options={STATUS_OPTIONS}
        />
        <Select
          placeholder="All Types"
          value={filterType}
          onChange={v => { setFilterType(v); setPage(1) }}
          options={COMPLAINT_TYPES}
        />
        <Select
          placeholder="All Districts"
          value={filterDistrictObj ? String(filterDistrictObj.id) : ''}
          onChange={val => {
            const obj = (districts || []).find(d => String(d.id) === String(val)) || null
            setFilterDistrictObj(obj); setFilterBlockObj(null); setFilterGpObj(null); setPage(1)
          }}
          options={(districts || []).map(d => ({ value: String(d.id), label: d.name }))}
        />
        <Select
          placeholder="All Blocks"
          value={filterBlockObj ? String(filterBlockObj.id) : ''}
          onChange={val => {
            const obj = (filterBlocks || []).find(b => String(b.id) === String(val)) || null
            setFilterBlockObj(obj); setFilterGpObj(null); setPage(1)
          }}
          options={(filterBlocks || []).map(b => ({ value: String(b.id), label: b.name }))}
        />
        <Select
          placeholder="All GPs"
          value={filterGpObj ? String(filterGpObj.id) : ''}
          onChange={val => {
            const obj = (filterGps || []).find(g => String(g.id) === String(val)) || null
            setFilterGpObj(obj); setPage(1)
          }}
          options={(filterGps || []).map(g => ({ value: String(g.id), label: g.name }))}
        />
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? <Spinner /> : results.length === 0 ? (
          <EmptyState message="No complaints found." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[800px]">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  {['Complainant', 'Type', 'Location', 'Status', 'Filed On', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {results.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">{c.complainant_name}</p>
                      <p className="text-xs font-mono text-slate-400">{c.mobile_number}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">{c.complaint_type}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {[c.district, c.block, c.gp].filter(Boolean).join(' › ') || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {statusIcon(c.status)}
                        <span className={statusBadge(c.status)}>{c.status}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{formatDateTime(c.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => openView(c)} className="p-1.5 rounded hover:bg-slate-100 text-slate-500" title="View / Update">
                          <Eye size={14} />
                        </button>
                        <button onClick={() => { setSelected(c); setModal('delete') }} className="p-1.5 rounded hover:bg-red-50 text-red-400" title="Delete">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="px-4">
          <Pagination count={count} page={page} pageSize={20} onPage={setPage} />
        </div>
      </div>

      {/* Create Modal */}
      <Modal open={modal === 'create'} onClose={() => setModal(null)} title="Register New Complaint">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Complainant Name *</label>
              <input className="input" placeholder="Full name" value={form.complainant_name}
                onChange={e => setForm(f => ({ ...f, complainant_name: e.target.value }))} />
            </div>
            <div>
              <label className="label">Mobile Number</label>
              <input className="input" placeholder="10-digit mobile" value={form.mobile_number}
                onChange={e => setForm(f => ({ ...f, mobile_number: e.target.value }))} />
            </div>
          </div>

          <Select label="Complaint Type *" value={form.complaint_type}
            onChange={v => setForm(f => ({ ...f, complaint_type: v }))}
            options={COMPLAINT_TYPES} placeholder="Select type" />

          <div>
            <label className="label">Description *</label>
            <textarea className="input min-h-[90px] resize-none" placeholder="Describe the complaint in detail…"
              value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Select
              label="District"
              placeholder="Select district"
              value={formDistrictObj ? String(formDistrictObj.id) : ''}
              onChange={val => {
                const obj = (districts || []).find(d => String(d.id) === String(val)) || null
                setFormDistrictObj(obj); setFormBlockObj(null); setFormGpObj(null)
                setForm(f => ({ ...f, district: obj?.name || '', block: '', gp: '' }))
              }}
              options={(districts || []).map(d => ({ value: String(d.id), label: d.name }))}
            />
            <Select
              label="Block"
              placeholder="Select block"
              value={formBlockObj ? String(formBlockObj.id) : ''}
              onChange={val => {
                const obj = (formBlocks || []).find(b => String(b.id) === String(val)) || null
                setFormBlockObj(obj); setFormGpObj(null)
                setForm(f => ({ ...f, block: obj?.name || '', gp: '' }))
              }}
              options={(formBlocks || []).map(b => ({ value: String(b.id), label: b.name }))}
            />
            <Select
              label="GP"
              placeholder="Select GP"
              value={formGpObj ? String(formGpObj.id) : ''}
              onChange={val => {
                const obj = (formGps || []).find(g => String(g.id) === String(val)) || null
                setFormGpObj(obj)
                setForm(f => ({ ...f, gp: obj?.name || '' }))
              }}
              options={(formGps || []).map(g => ({ value: String(g.id), label: g.name }))}
            />
          </div>

          <button
            onClick={() => createMut.mutate()}
            disabled={!form.complainant_name || !form.complaint_type || !form.description || createMut.isPending}
            className="btn-primary w-full justify-center"
          >
            {createMut.isPending ? 'Registering…' : 'Register Complaint'}
          </button>
        </div>
      </Modal>

      {/* View / Update Modal */}
      <Modal open={modal === 'view'} onClose={() => setModal(null)} title={`Complaint #${selected?.id}`}>
        {selected && (
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-xl space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Filed by</span>
                <span className="font-medium text-slate-800">{selected.complainant_name} · {selected.mobile_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Type</span>
                <span className="font-medium text-slate-800">{selected.complaint_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Location</span>
                <span className="font-medium text-slate-800">
                  {[selected.district, selected.block, selected.gp].filter(Boolean).join(' › ') || '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Filed on</span>
                <span className="font-medium text-slate-800">{formatDateTime(selected.created_at)}</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl">
              <p className="text-xs text-slate-500 mb-1">Description</p>
              <p className="text-sm text-slate-800">{selected.description}</p>
            </div>

            <Select label="Update Status" value={form.status}
              onChange={v => setForm(f => ({ ...f, status: v }))}
              options={STATUS_OPTIONS} />

            <div>
              <label className="label">Resolution Notes</label>
              <textarea className="input min-h-[70px] resize-none" placeholder="Add resolution notes…"
                value={form.resolution_notes || ''} onChange={e => setForm(f => ({ ...f, resolution_notes: e.target.value }))} />
            </div>

            <button onClick={() => updateMut.mutate()} disabled={updateMut.isPending} className="btn-primary w-full justify-center">
              {updateMut.isPending ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        )}
      </Modal>

      <ConfirmDialog open={modal === 'delete'} onClose={() => setModal(null)}
        onConfirm={() => deleteMut.mutate()} loading={deleteMut.isPending}
        title="Delete Complaint" message={`Delete complaint from "${selected?.complainant_name}"?`} />
    </div>
  )
}
