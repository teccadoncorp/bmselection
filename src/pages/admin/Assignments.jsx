import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link2, CheckSquare, Square } from 'lucide-react'
import toast from 'react-hot-toast'
import { assignmentAPI, operatorAPI, beneficiaryAPI } from '../../api'
import Spinner from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'
import { getErrorMessage } from '../../utils'

export default function AdminAssignments() {
  const qc = useQueryClient()
  const [selectedOp, setSelectedOp] = useState(null)
  const [selectedBenes, setSelectedBenes] = useState([])
  const [beneSearch, setBeneSearch] = useState('')

  const { data: summary } = useQuery({
    queryKey: ['assignment-summary'],
    queryFn: () => assignmentAPI.operatorSummary().then(r => r.data),
  })
  const { data: beneData, isLoading: beneLoading } = useQuery({
    queryKey: ['beneficiaries-unassigned', beneSearch],
    queryFn: () => beneficiaryAPI.list({ search: beneSearch, page_size: 50 }).then(r => r.data),
  })

  const bulkMut = useMutation({
    mutationFn: () => assignmentAPI.bulkAssign({ operator_id: selectedOp.operator_id, beneficiary_ids: selectedBenes }),
    onSuccess: (res) => {
      toast.success(`Assigned ${res.data.assigned} beneficiaries`)
      setSelectedBenes([])
      qc.invalidateQueries({ queryKey: ['assignment-summary'] })
    },
    onError: e => toast.error(getErrorMessage(e)),
  })

  const toggleBene = (id) => setSelectedBenes(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const benes = beneData?.results || []

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="font-display font-bold text-2xl text-slate-800">Assignments</h1>
        <p className="text-slate-400 text-sm">Assign beneficiaries to operators</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Operator List */}
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h2 className="font-display font-semibold text-slate-700">Operators</h2>
            <p className="text-xs text-slate-400">Click to select target</p>
          </div>
          {!summary ? <Spinner /> : (
            <div className="divide-y divide-slate-50">
              {summary.map(op => (
                <div key={op.operator_id} onClick={() => setSelectedOp(op)}
                  className={`p-4 cursor-pointer transition-all hover:bg-slate-50 ${selectedOp?.operator_id === op.operator_id ? 'bg-brand-50 border-l-4 border-brand-600' : ''}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-slate-800 text-sm">{op.operator_name}</p>
                      <p className="text-xs text-slate-400">@{op.username}</p>
                    </div>
                    <span className="badge-blue">{op.total_assigned}</span>
                  </div>
                  <div className="flex gap-3 mt-2 text-xs text-slate-500">
                    <span className="text-green-600">✓ {op.completed}</span>
                    <span className="text-amber-500">◷ {op.pending}</span>
                    <span className="text-blue-500">📞 {op.connected}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Beneficiary selector */}
        <div className="lg:col-span-2 card overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display font-semibold text-slate-700">Select Beneficiaries</h2>
              <p className="text-xs text-slate-400">{selectedBenes.length} selected</p>
            </div>
            <input className="input max-w-xs" placeholder="Search…" value={beneSearch}
              onChange={e => setBeneSearch(e.target.value)} />
          </div>
          <div className="flex-1 overflow-y-auto">
            {beneLoading ? <Spinner /> : benes.length === 0 ? <EmptyState /> : (
              <table className="w-full text-sm">
                <tbody className="divide-y divide-slate-50">
                  {benes.map(b => (
                    <tr key={b.id} onClick={() => toggleBene(b.id)}
                      className="cursor-pointer hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 w-8">
                        {selectedBenes.includes(b.id)
                          ? <CheckSquare size={16} className="text-brand-600" />
                          : <Square size={16} className="text-slate-300" />}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-800">{b.beneficiary_name}</p>
                        <p className="text-xs text-slate-400 font-mono">{b.mobile_number}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">{b.district_name} › {b.block_name} › {b.gp_name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div className="p-4 border-t border-slate-100 flex items-center gap-3">
            {selectedOp ? (
              <>
                <p className="text-sm text-slate-600 flex-1">
                  Assign <strong>{selectedBenes.length}</strong> to <strong>{selectedOp.operator_name}</strong>
                </p>
                <button onClick={() => bulkMut.mutate()} disabled={!selectedBenes.length || bulkMut.isPending}
                  className="btn-primary">
                  <Link2 size={16} /> {bulkMut.isPending ? 'Assigning…' : 'Assign'}
                </button>
              </>
            ) : (
              <p className="text-sm text-slate-400">← Select an operator first</p>
            )}
          </div>
        </div>
      </div>

      {/* Summary table */}
      {summary && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h2 className="font-display font-semibold text-slate-700">Operator Summary</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  {['Operator','Assigned','Completed','Pending','Connected','Not Connected'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {summary.map(op => (
                  <tr key={op.operator_id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">{op.operator_name}<span className="text-xs text-slate-400 ml-1">@{op.username}</span></td>
                    <td className="px-4 py-3 font-semibold">{op.total_assigned}</td>
                    <td className="px-4 py-3 text-green-600 font-semibold">{op.completed}</td>
                    <td className="px-4 py-3 text-amber-500 font-semibold">{op.pending}</td>
                    <td className="px-4 py-3 text-blue-600 font-semibold">{op.connected}</td>
                    <td className="px-4 py-3 text-red-500 font-semibold">{op.not_connected}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
