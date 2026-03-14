import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, KeyRound, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import { operatorAPI } from '../../api'
import Modal from '../../components/ui/Modal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import Spinner from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'
import Pagination from '../../components/ui/Pagination'
import { getErrorMessage, formatDate } from '../../utils'

const createSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
  full_name: z.string().min(1),
  mobile: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
})
const editSchema = z.object({ full_name: z.string().min(1), mobile: z.string().optional(), email: z.string().email().optional().or(z.literal('')) })
const pwSchema = z.object({ new_password: z.string().min(6) })

export default function AdminOperators() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [modal, setModal] = useState(null) // 'create' | 'edit' | 'password' | 'delete'
  const [selected, setSelected] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['operators', page, search],
    queryFn: () => operatorAPI.list({ page, search, page_size: 20 }).then(r => r.data),
  })

  const createForm = useForm({ resolver: zodResolver(createSchema) })
  const editForm = useForm({ resolver: zodResolver(editSchema) })
  const pwForm = useForm({ resolver: zodResolver(pwSchema) })

  const invalidate = () => qc.invalidateQueries({ queryKey: ['operators'] })

  const createMut = useMutation({
    mutationFn: (d) => operatorAPI.create(d),
    onSuccess: () => { toast.success('Operator created'); setModal(null); createForm.reset(); invalidate() },
    onError: (e) => toast.error(getErrorMessage(e)),
  })
  const editMut = useMutation({
    mutationFn: (d) => operatorAPI.update(selected.id, d),
    onSuccess: () => { toast.success('Operator updated'); setModal(null); invalidate() },
    onError: (e) => toast.error(getErrorMessage(e)),
  })
  const toggleMut = useMutation({
    mutationFn: (op) => operatorAPI.toggleActive(op.id),
    onSuccess: () => { toast.success('Status updated'); invalidate() },
  })
  const deleteMut = useMutation({
    mutationFn: () => operatorAPI.delete(selected.id),
    onSuccess: () => { toast.success('Operator deleted'); setModal(null); invalidate() },
    onError: (e) => toast.error(getErrorMessage(e)),
  })
  const pwMut = useMutation({
    mutationFn: (d) => operatorAPI.resetPassword(selected.id, d),
    onSuccess: () => { toast.success('Password reset'); setModal(null); pwForm.reset() },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const openEdit = (op) => {
    setSelected(op)
    editForm.reset({ full_name: op.full_name, mobile: op.mobile, email: op.email })
    setModal('edit')
  }

  const results = data?.results || []
  const count = data?.count || 0

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-slate-800">Operators</h1>
          <p className="text-slate-400 text-sm">{count} operators</p>
        </div>
        <button onClick={() => { createForm.reset(); setModal('create') }} className="btn-primary">
          <Plus size={16} /> Add Operator
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-xs">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input className="input pl-9" placeholder="Search operators…" value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }} />
      </div>

      <div className="card overflow-hidden">
        {isLoading ? <Spinner /> : results.length === 0 ? <EmptyState title="No operators" /> : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {['Name', 'Username', 'Mobile', 'Email', 'Status', 'Created', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {results.map(op => (
                <tr key={op.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-800">{op.full_name}</td>
                  <td className="px-4 py-3 font-mono text-slate-600 text-xs">{op.username}</td>
                  <td className="px-4 py-3 text-slate-600">{op.mobile || '—'}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{op.email || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={op.is_active ? 'badge-green' : 'badge-red'}>
                      {op.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{formatDate(op.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(op)} className="p-1.5 rounded hover:bg-slate-100 text-slate-500" title="Edit">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => toggleMut.mutate(op)} className="p-1.5 rounded hover:bg-slate-100 text-slate-500" title="Toggle">
                        {op.is_active ? <ToggleRight size={14} className="text-green-500" /> : <ToggleLeft size={14} />}
                      </button>
                      <button onClick={() => { setSelected(op); setModal('password') }} className="p-1.5 rounded hover:bg-slate-100 text-slate-500" title="Reset password">
                        <KeyRound size={14} />
                      </button>
                      <button onClick={() => { setSelected(op); setModal('delete') }} className="p-1.5 rounded hover:bg-red-50 text-red-400" title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="px-4"><Pagination count={count} page={page} pageSize={20} onPage={setPage} /></div>
      </div>

      {/* Create Modal */}
      <Modal open={modal === 'create'} onClose={() => setModal(null)} title="Create Operator">
        <form onSubmit={createForm.handleSubmit(d => createMut.mutate(d))} className="space-y-4">
          {[['username','Username'],['password','Password'],['full_name','Full Name'],['mobile','Mobile'],['email','Email']].map(([f,l]) => (
            <div key={f}>
              <label className="label">{l}</label>
              <input {...createForm.register(f)} className="input" type={f==='password'?'password':f==='email'?'email':'text'} />
              {createForm.formState.errors[f] && <p className="text-red-500 text-xs mt-1">{createForm.formState.errors[f].message}</p>}
            </div>
          ))}
          <button type="submit" disabled={createMut.isPending} className="btn-primary w-full justify-center">
            {createMut.isPending ? 'Creating…' : 'Create Operator'}
          </button>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal open={modal === 'edit'} onClose={() => setModal(null)} title="Edit Operator">
        <form onSubmit={editForm.handleSubmit(d => editMut.mutate(d))} className="space-y-4">
          {[['full_name','Full Name'],['mobile','Mobile'],['email','Email']].map(([f,l]) => (
            <div key={f}>
              <label className="label">{l}</label>
              <input {...editForm.register(f)} className="input" />
            </div>
          ))}
          <button type="submit" disabled={editMut.isPending} className="btn-primary w-full justify-center">
            {editMut.isPending ? 'Saving…' : 'Save Changes'}
          </button>
        </form>
      </Modal>

      {/* Password Modal */}
      <Modal open={modal === 'password'} onClose={() => setModal(null)} title="Reset Password" size="sm">
        <form onSubmit={pwForm.handleSubmit(d => pwMut.mutate(d))} className="space-y-4">
          <div>
            <label className="label">New Password</label>
            <input {...pwForm.register('new_password')} type="password" className="input" />
            {pwForm.formState.errors.new_password && <p className="text-red-500 text-xs mt-1">{pwForm.formState.errors.new_password.message}</p>}
          </div>
          <button type="submit" disabled={pwMut.isPending} className="btn-primary w-full justify-center">
            {pwMut.isPending ? 'Resetting…' : 'Reset Password'}
          </button>
        </form>
      </Modal>

      <ConfirmDialog open={modal === 'delete'} onClose={() => setModal(null)}
        onConfirm={() => deleteMut.mutate()} loading={deleteMut.isPending}
        title="Delete Operator" message={`Delete operator "${selected?.full_name}"? This cannot be undone.`} />
    </div>
  )
}
