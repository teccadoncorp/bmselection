import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { geographyAPI } from '../../api'
import Modal from '../../components/ui/Modal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import Spinner from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'
import Select from '../../components/ui/Select'
import { getErrorMessage } from '../../utils'

const TABS = ['States', 'Districts', 'Blocks', 'GPs']

function GeoTable({ items, cols, onEdit, onDelete, loading }) {
  if (loading) return <Spinner />
  if (!items?.length) return <EmptyState />
  return (
    <table className="w-full text-sm">
      <thead className="bg-slate-50 border-b border-slate-100">
        <tr>{cols.map(c => <th key={c} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{c}</th>)}</tr>
      </thead>
      <tbody className="divide-y divide-slate-50">
        {items.map(item => (
          <tr key={item.id} className="hover:bg-slate-50">
            <td className="px-4 py-3 font-medium text-slate-800">{item.name}</td>
            <td className="px-4 py-3 font-mono text-xs text-slate-500">{item.lgd_code}</td>
            {item.state_name && <td className="px-4 py-3 text-slate-500 text-xs">{item.state_name}</td>}
            {item.district_name && <td className="px-4 py-3 text-slate-500 text-xs">{item.district_name}</td>}
            {item.block_name && <td className="px-4 py-3 text-slate-500 text-xs">{item.block_name}</td>}
            <td className="px-4 py-3"><span className={item.is_active ? 'badge-green' : 'badge-red'}>{item.is_active ? 'Active' : 'Inactive'}</span></td>
            <td className="px-4 py-3">
              <div className="flex gap-1">
                <button onClick={() => onEdit(item)} className="p-1.5 rounded hover:bg-slate-100 text-slate-500"><Pencil size={14} /></button>
                <button onClick={() => onDelete(item)} className="p-1.5 rounded hover:bg-red-50 text-red-400"><Trash2 size={14} /></button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default function AdminGeography() {
  const qc = useQueryClient()
  const [tab, setTab] = useState(0)
  const [modal, setModal] = useState(null)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState({ name: '', lgd_code: '', state: '', district: '', block: '' })

  const apis = [geographyAPI.states, geographyAPI.districts, geographyAPI.blocks, geographyAPI.gps]
  const qkeys = ['states', 'districts', 'blocks', 'gps']
  const colSets = [
    ['Name', 'LGD Code', 'Status', 'Actions'],
    ['Name', 'LGD Code', 'State', 'Status', 'Actions'],
    ['Name', 'LGD Code', 'District', 'Status', 'Actions'],
    ['Name', 'LGD Code', 'Block', 'Status', 'Actions'],
  ]

  const { data: states } = useQuery({ queryKey: ['states'], queryFn: () => geographyAPI.states.list({ page_size: 200 }).then(r => r.data.results || r.data) })
  const { data: districts } = useQuery({ queryKey: ['districts'], queryFn: () => geographyAPI.districts.list({ page_size: 200 }).then(r => r.data.results || r.data) })
  const { data: blocks } = useQuery({ queryKey: ['blocks'], queryFn: () => geographyAPI.blocks.list({ page_size: 200 }).then(r => r.data.results || r.data) })

  const { data: items, isLoading } = useQuery({
    queryKey: [qkeys[tab]],
    queryFn: () => apis[tab].list({ page_size: 200 }).then(r => r.data.results || r.data),
  })

  const saveMut = useMutation({
    mutationFn: () => selected ? apis[tab].update(selected.id, form) : apis[tab].create(form),
    onSuccess: () => { toast.success(selected ? 'Updated' : 'Created'); setModal(null); qc.invalidateQueries({ queryKey: [qkeys[tab]] }) },
    onError: e => toast.error(getErrorMessage(e)),
  })
  const deleteMut = useMutation({
    mutationFn: () => apis[tab].delete(selected.id),
    onSuccess: () => { toast.success('Deleted'); setModal(null); qc.invalidateQueries({ queryKey: [qkeys[tab]] }) },
    onError: e => toast.error(getErrorMessage(e)),
  })

  const openCreate = () => { setSelected(null); setForm({ name: '', lgd_code: '' }); setModal('form') }
  const openEdit = (item) => { setSelected(item); setForm({ name: item.name, lgd_code: item.lgd_code, state: item.state, district: item.district, block: item.block }); setModal('form') }
  const openDelete = (item) => { setSelected(item); setModal('delete') }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="font-display font-bold text-2xl text-slate-800">Geography</h1></div>
        <button onClick={openCreate} className="btn-primary"><Plus size={16} />Add {TABS[tab].slice(0,-1)}</button>
      </div>

      <div className="flex gap-1 border-b border-slate-200">
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab===i ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            {t}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        <GeoTable items={items} cols={colSets[tab]} onEdit={openEdit} onDelete={openDelete} loading={isLoading} />
      </div>

      <Modal open={modal === 'form'} onClose={() => setModal(null)} title={`${selected ? 'Edit' : 'Add'} ${TABS[tab].slice(0,-1)}`} size="sm">
        <div className="space-y-4">
          <div><label className="label">Name</label><input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
          <div><label className="label">LGD Code</label><input className="input" value={form.lgd_code} onChange={e => setForm(f => ({ ...f, lgd_code: e.target.value }))} /></div>
          {tab === 1 && <Select label="State" value={String(form.state||'')} onChange={v => setForm(f => ({ ...f, state: v }))} options={(states||[]).map(s => ({ value: String(s.id), label: s.name }))} placeholder="Select State" />}
          {tab === 2 && <Select label="District" value={String(form.district||'')} onChange={v => setForm(f => ({ ...f, district: v }))} options={(districts||[]).map(d => ({ value: String(d.id), label: d.name }))} placeholder="Select District" />}
          {tab === 3 && <Select label="Block" value={String(form.block||'')} onChange={v => setForm(f => ({ ...f, block: v }))} options={(blocks||[]).map(b => ({ value: String(b.id), label: b.name }))} placeholder="Select Block" />}
          <button onClick={() => saveMut.mutate()} disabled={saveMut.isPending} className="btn-primary w-full justify-center">
            {saveMut.isPending ? 'Saving…' : 'Save'}
          </button>
        </div>
      </Modal>
      <ConfirmDialog open={modal === 'delete'} onClose={() => setModal(null)}
        onConfirm={() => deleteMut.mutate()} loading={deleteMut.isPending}
        title="Delete" message={`Delete "${selected?.name}"?`} />
    </div>
  )
}
