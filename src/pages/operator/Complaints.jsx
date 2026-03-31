import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, AlertCircle, CheckCircle2, Clock, Eye } from 'lucide-react'
import toast from 'react-hot-toast'
import { complaintAPI } from '../../api'
import Spinner from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'
import Pagination from '../../components/ui/Pagination'
import Select from '../../components/ui/Select'
import Modal from '../../components/ui/Modal'
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

export default function OperatorComplaints() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [modal, setModal] = useState(null) // 'create' | 'view'
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)

  // Form geography
  const [formDistrictObj, setFormDistrictObj] = useState(null)
  const [formBlockObj, setFormBlockObj] = useState(null)
  const [formGpObj, setFormGpObj] = useState(null)

  const { data: districts } = useDistricts()
  const { data: formBlocks } = useBlocks(formDistrictObj?.id)
  const { data: formGps } = useGPs(formBlockObj?.id)

  const params = { page, page_size: 20 }

  const { data, isLoading } = useQuery({
    queryKey: ['complaints-operator', params],
    queryFn: () => complaintAPI.list(params).then(r => r.data),
  })

  const createMut = useMutation({
    mutationFn: () => complaintAPI.create(form),
    onSuccess: () => {
      toast.success('Complaint registered')
      setModal(null)
      setForm(EMPTY_FORM)
      setFormDistrictObj(null); setFormBlockObj(null); setFormGpObj(null)
      qc.invalidateQueries({ queryKey: ['complaints-operator'] })
    },
    onError: e => toast.error(getErrorMessage(e)),
  })

  const openCreate = () => {
    setForm(EMPTY_FORM)
    setFormDistrictObj(null); setFormBlockObj(null); setFormGpObj(null)
    setModal('create')
  }

  const openView = (item) => {
    setSelected(item)
    setModal('view')
  }

  const results = data?.results || []
  const count = data?.count || 0

  return (
    <div className="p-4 space-y-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-xl text-slate-800">Complaints</h1>
          <p className="text-slate-400 text-xs">Register and view complaints</p>
        </div>
        <button onClick={openCreate} className="btn-primary text-sm">
          <Plus size={15} /> New
        </button>
      </div>

      {/* List */}
      <div className="card overflow-hidden">
        {isLoading ? <Spinner /> : results.length === 0 ? (
          <EmptyState message="No complaints registered yet." />
        ) : (
          <div className="divide-y divide-slate-50">
            {results.map(c => (
              <div key={c.id} className="p-4 flex items-start gap-3 hover:bg-slate-50">
                <div className="mt-0.5">{statusIcon(c.status)}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800 text-sm">{c.complainant_name}</p>
                  <p className="text-xs text-slate-500">{c.complaint_type}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {[c.district, c.block, c.gp].filter(Boolean).join(' › ') || '—'}
                  </p>
                  <p className="text-xs text-slate-400">{formatDateTime(c.created_at)}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={statusBadge(c.status)}>{c.status}</span>
                  <button onClick={() => openView(c)} className="p-1.5 rounded hover:bg-slate-100 text-slate-400">
                    <Eye size={14} />
                  </button>
                </div>
              </div>
            ))}
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
            <textarea className="input min-h-[80px] resize-none" placeholder="Describe the complaint…"
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

      {/* View Modal */}
      <Modal open={modal === 'view'} onClose={() => setModal(null)} title={`Complaint #${selected?.id}`}>
        {selected && (
          <div className="space-y-3">
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
                <span className="text-slate-500">Status</span>
                <span className={statusBadge(selected.status)}>{selected.status}</span>
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
            {selected.resolution_notes && (
              <div className="p-3 bg-green-50 rounded-xl">
                <p className="text-xs text-green-600 mb-1">Resolution Notes</p>
                <p className="text-sm text-slate-800">{selected.resolution_notes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
