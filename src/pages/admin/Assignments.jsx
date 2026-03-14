import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Link2, CheckSquare, Square, CheckSquare2,
  ArrowLeft, Search, Phone, MapPin, BarChart2
} from 'lucide-react'
import toast from 'react-hot-toast'
import { assignmentAPI, beneficiaryAPI } from '../../api'
import Spinner from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'
import Pagination from '../../components/ui/Pagination'
import Select from '../../components/ui/Select'
import { getErrorMessage, surveyBadge, callBadge, answerBadge } from '../../utils'
import { useDistricts, useBlocks, useGPs } from '../../hooks/useGeography'

// ─── Tab: Assign ──────────────────────────────────────────────────────────────
function AssignTab() {
  const qc = useQueryClient()
  const [selectedOp, setSelectedOp] = useState(null)
  const [selectedBenes, setSelectedBenes] = useState([])
  const [page, setPage] = useState(1)
  const [districtObj, setDistrictObj] = useState(null)
  const [blockObj, setBlockObj] = useState(null)
  const [gpObj, setGpObj] = useState(null)

  const { data: districts } = useDistricts()
  const { data: blocks } = useBlocks(districtObj?.id)
  const { data: gps } = useGPs(blockObj?.id)

  const params = {
    page,
    page_size: 50,
    is_assigned: 'false',   // only unassigned
    ...(districtObj && { district_lgd: districtObj.lgd_code }),
    ...(blockObj    && { block_lgd:    blockObj.lgd_code }),
    ...(gpObj       && { gp_lgd:       gpObj.lgd_code }),
  }

  const { data: summary } = useQuery({
    queryKey: ['assignment-summary'],
    queryFn: () => assignmentAPI.operatorSummary().then(r => r.data),
  })

  const { data: beneData, isLoading: beneLoading } = useQuery({
    queryKey: ['beneficiaries-unassigned', params],
    queryFn: () => beneficiaryAPI.list(params).then(r => r.data),
  })

  const bulkMut = useMutation({
    mutationFn: () =>
      assignmentAPI.bulkAssign({ operator_id: selectedOp.operator_id, beneficiary_ids: selectedBenes }),
    onSuccess: (res) => {
      toast.success(`Assigned ${res.data.assigned} beneficiaries`)
      setSelectedBenes([])
      qc.invalidateQueries({ queryKey: ['assignment-summary'] })
      qc.invalidateQueries({ queryKey: ['beneficiaries-unassigned'] })
    },
    onError: e => toast.error(getErrorMessage(e)),
  })

  const benes = beneData?.results || []
  const allPageSelected = benes.length > 0 && benes.every(b => selectedBenes.includes(b.id))

  const toggleBene = (id) =>
    setSelectedBenes(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const selectAllPage = () => {
    const allIds = benes.map(b => b.id)
    if (allPageSelected) {
      setSelectedBenes(prev => prev.filter(id => !allIds.includes(id)))
    } else {
      setSelectedBenes(prev => [...new Set([...prev, ...allIds])])
    }
  }

  const handleDistrictChange = (val) => {
    const obj = (districts || []).find(d => String(d.id) === String(val)) || null
    setDistrictObj(obj); setBlockObj(null); setGpObj(null); setPage(1); setSelectedBenes([])
  }
  const handleBlockChange = (val) => {
    const obj = (blocks || []).find(b => String(b.id) === String(val)) || null
    setBlockObj(obj); setGpObj(null); setPage(1); setSelectedBenes([])
  }
  const handleGpChange = (val) => {
    const obj = (gps || []).find(g => String(g.id) === String(val)) || null
    setGpObj(obj); setPage(1); setSelectedBenes([])
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* Operator list */}
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
      <div className="lg:col-span-2 card overflow-hidden flex flex-col" style={{ minHeight: 500 }}>
        {/* Header + filters */}
        <div className="p-4 border-b border-slate-100 space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div>
              <h2 className="font-display font-semibold text-slate-700">Unassigned Beneficiaries</h2>
              <p className="text-xs text-slate-400">
                {beneData?.count ?? 0} available · {selectedBenes.length} selected
              </p>
            </div>
            <button
              onClick={selectAllPage}
              disabled={benes.length === 0}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-all whitespace-nowrap disabled:opacity-40 ${
                allPageSelected
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'border-slate-200 text-slate-600 hover:border-brand-400 hover:text-brand-600'
              }`}
            >
              <CheckSquare2 size={15} />
              {allPageSelected ? 'Deselect Page' : `Select Page (${benes.length})`}
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Select placeholder="All Districts" value={districtObj ? String(districtObj.id) : ''}
              onChange={handleDistrictChange}
              options={(districts || []).map(d => ({ value: String(d.id), label: d.name }))} />
            <Select placeholder="All Blocks" value={blockObj ? String(blockObj.id) : ''}
              onChange={handleBlockChange}
              options={(blocks || []).map(b => ({ value: String(b.id), label: b.name }))} />
            <Select placeholder="All GPs" value={gpObj ? String(gpObj.id) : ''}
              onChange={handleGpChange}
              options={(gps || []).map(g => ({ value: String(g.id), label: g.name }))} />
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto">
          {beneLoading ? <Spinner /> : benes.length === 0 ? (
            <EmptyState message="No unassigned beneficiaries found for this filter." />
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-2 w-8">
                    <button onClick={selectAllPage}>
                      {allPageSelected
                        ? <CheckSquare size={16} className="text-brand-600" />
                        : <Square size={16} className="text-slate-300" />}
                    </button>
                  </th>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-slate-500 uppercase">Name</th>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-slate-500 uppercase">Location</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {benes.map(b => (
                  <tr key={b.id} onClick={() => toggleBene(b.id)}
                    className={`cursor-pointer transition-colors ${selectedBenes.includes(b.id) ? 'bg-brand-50' : 'hover:bg-slate-50'}`}>
                    <td className="px-4 py-3 w-8">
                      {selectedBenes.includes(b.id)
                        ? <CheckSquare size={16} className="text-brand-600" />
                        : <Square size={16} className="text-slate-300" />}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">{b.beneficiary_name}</p>
                      <p className="text-xs text-slate-400 font-mono">{b.mobile_number}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {b.district_name} › {b.block_name} › {b.gp_name}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {beneData?.count > 50 && (
          <div className="px-4 border-t border-slate-100">
            <Pagination count={beneData.count} page={page} pageSize={50}
              onPage={(p) => { setPage(p); setSelectedBenes([]) }} />
          </div>
        )}

        {/* Assign footer */}
        <div className="p-4 border-t border-slate-100 flex items-center gap-3">
          {selectedOp ? (
            <>
              <p className="text-sm text-slate-600 flex-1">
                Assign <strong>{selectedBenes.length}</strong> beneficiar{selectedBenes.length === 1 ? 'y' : 'ies'} to <strong>{selectedOp.operator_name}</strong>
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
  )
}

// ─── Tab: Operator Detail ─────────────────────────────────────────────────────
function OperatorDetailTab() {
  const [selectedOp, setSelectedOp] = useState(null)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [callFilter, setCallFilter] = useState('')

  const { data: summary } = useQuery({
    queryKey: ['assignment-summary'],
    queryFn: () => assignmentAPI.operatorSummary().then(r => r.data),
  })

  const detailParams = {
    operator_id: selectedOp?.operator_id,
    page,
    page_size: 50,
    ...(search       && { search }),
    ...(statusFilter && { survey_status: statusFilter }),
    ...(callFilter   && { call_connected: callFilter }),
  }

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ['operator-detail', detailParams],
    queryFn: () => assignmentAPI.operatorDetail(detailParams).then(r => r.data),
    enabled: !!selectedOp,
  })

  const results = detail?.results || []

  const handleOpSelect = (op) => {
    setSelectedOp(op)
    setPage(1)
    setSearch('')
    setStatusFilter('')
    setCallFilter('')
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
      {/* Operator list */}
      <div className="card overflow-hidden lg:col-span-1">
        <div className="p-4 border-b border-slate-100">
          <h2 className="font-display font-semibold text-slate-700">Select Operator</h2>
        </div>
        {!summary ? <Spinner /> : (
          <div className="divide-y divide-slate-50">
            {summary.map(op => (
              <div key={op.operator_id} onClick={() => handleOpSelect(op)}
                className={`p-3 cursor-pointer transition-all hover:bg-slate-50 ${selectedOp?.operator_id === op.operator_id ? 'bg-brand-50 border-l-4 border-brand-600' : ''}`}>
                <p className="font-medium text-slate-800 text-sm">{op.operator_name}</p>
                <p className="text-xs text-slate-400">@{op.username}</p>
                <div className="flex gap-2 mt-1.5 text-xs">
                  <span className="font-semibold text-slate-700">{op.total_assigned} total</span>
                  <span className="text-green-600">✓{op.completed}</span>
                  <span className="text-amber-500">◷{op.pending}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail panel */}
      <div className="lg:col-span-3 space-y-4">
        {!selectedOp ? (
          <div className="card p-12 flex flex-col items-center justify-center text-center">
            <BarChart2 size={40} className="text-slate-200 mb-3" />
            <p className="text-slate-400 font-medium">Select an operator to view their assigned beneficiaries</p>
          </div>
        ) : (
          <>
            {/* Operator stats header */}
            <div className="card p-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h3 className="font-display font-bold text-lg text-slate-800">
                    {selectedOp.operator_name}
                    <span className="text-slate-400 font-normal text-sm ml-2">@{selectedOp.username}</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">{detail?.count ?? '—'} beneficiaries (filtered)</p>
                </div>
                <div className="flex gap-3 text-sm">
                  <div className="text-center px-3 py-1 bg-slate-50 rounded-lg">
                    <p className="font-bold text-slate-800">{selectedOp.total_assigned}</p>
                    <p className="text-xs text-slate-400">Assigned</p>
                  </div>
                  <div className="text-center px-3 py-1 bg-green-50 rounded-lg">
                    <p className="font-bold text-green-700">{selectedOp.completed}</p>
                    <p className="text-xs text-green-500">Completed</p>
                  </div>
                  <div className="text-center px-3 py-1 bg-amber-50 rounded-lg">
                    <p className="font-bold text-amber-700">{selectedOp.pending}</p>
                    <p className="text-xs text-amber-500">Pending</p>
                  </div>
                  <div className="text-center px-3 py-1 bg-blue-50 rounded-lg">
                    <p className="font-bold text-blue-700">{selectedOp.connected}</p>
                    <p className="text-xs text-blue-500">Connected</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              <div className="relative flex-1 min-w-[180px]">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input className="input pl-8 text-sm" placeholder="Search name / mobile…"
                  value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
              </div>
              <Select placeholder="All Statuses" value={statusFilter}
                onChange={v => { setStatusFilter(v); setPage(1) }}
                options={['Pending', 'Completed']} />
              <Select placeholder="All Calls" value={callFilter}
                onChange={v => { setCallFilter(v); setPage(1) }}
                options={[{ value: 'Yes', label: 'Connected' }, { value: 'No', label: 'Not Connected' }]} />
              {(search || statusFilter || callFilter) && (
                <button onClick={() => { setSearch(''); setStatusFilter(''); setCallFilter(''); setPage(1) }}
                  className="btn-secondary text-xs">Clear</button>
              )}
            </div>

            {/* Beneficiary table */}
            <div className="card overflow-hidden">
              {detailLoading ? <Spinner /> : results.length === 0 ? (
                <EmptyState message="No beneficiaries match the current filters." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[750px]">
                    <thead className="bg-slate-50 border-b border-slate-100">
                      <tr>
                        {['Beneficiary', 'Location', 'Survey Status', 'Call', 'Govt House', 'Amount', 'Money Taken'].map(h => (
                          <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {results.map(({ beneficiary: b, survey: s }) => (
                        <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-3">
                            <p className="font-medium text-slate-800 whitespace-nowrap">{b.beneficiary_name}</p>
                            <p className="text-xs font-mono text-slate-400">{b.mobile_number}</p>
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-500 max-w-[160px]">
                            <p className="truncate">{b.district_name} › {b.block_name}</p>
                            <p className="text-slate-400 truncate">{b.gp_name}</p>
                          </td>
                          <td className="px-4 py-3">
                            <span className={surveyBadge(s?.survey_status)}>{s?.survey_status || 'Pending'}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={callBadge(s?.call_connected)}>
                              {s?.call_connected === 'Yes' ? 'Yes' : 'No'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={answerBadge(s?.received_govt_house)}>{s?.received_govt_house || '—'}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={answerBadge(s?.amount_credited)}>{s?.amount_credited || '—'}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={answerBadge(s?.money_taken)}>{s?.money_taken || '—'}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="px-4">
                <Pagination count={detail?.count || 0} page={page} pageSize={50}
                  onPage={(p) => setPage(p)} />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AdminAssignments() {
  const [tab, setTab] = useState('assign') // 'assign' | 'detail' | 'summary'

  const { data: summary } = useQuery({
    queryKey: ['assignment-summary'],
    queryFn: () => assignmentAPI.operatorSummary().then(r => r.data),
  })

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="font-display font-bold text-2xl text-slate-800">Assignments</h1>
        <p className="text-slate-400 text-sm">Assign beneficiaries to operators and review their progress</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {[
          ['assign',  'Assign Beneficiaries'],
          ['detail',  'Operator Data'],
          ['summary', 'Summary Table'],
        ].map(([t, l]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            {l}
          </button>
        ))}
      </div>

      {tab === 'assign'  && <AssignTab />}
      {tab === 'detail'  && <OperatorDetailTab />}
      {tab === 'summary' && summary && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h2 className="font-display font-semibold text-slate-700">Operator Summary</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  {['Operator', 'Assigned', 'Completed', 'Pending', 'Connected', 'Not Connected'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {summary.map(op => (
                  <tr key={op.operator_id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {op.operator_name}
                      <span className="text-xs text-slate-400 ml-1">@{op.username}</span>
                    </td>
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
