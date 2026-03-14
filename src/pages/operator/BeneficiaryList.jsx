import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Search, Phone } from 'lucide-react'
import { surveyAPI } from '../../api'
import Spinner from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'
import Pagination from '../../components/ui/Pagination'
import { callBadge, surveyBadge } from '../../utils'

const FILTER_CHIPS = [
  { label: 'All', params: {} },
  { label: 'Pending', params: { survey_status: 'Pending' } },
  { label: 'Completed', params: { survey_status: 'Completed' } },
  { label: 'Connected', params: { call_connected: 'Yes' } },
  { label: 'Not Connected', params: { call_connected: 'No' } },
]

export default function OperatorBeneficiaries() {
  const navigate = useNavigate()
  const [chip, setChip] = useState(0)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const params = { ...FILTER_CHIPS[chip].params, search: search || undefined, page, page_size: 30 }

  const { data, isLoading } = useQuery({
    queryKey: ['operator-assigned', params],
    queryFn: () => surveyAPI.assignedList(params).then(r => r.data),
  })

  const results = data?.results || []
  const count = data?.count || 0

  return (
    <div className="p-4 space-y-4">
      <h1 className="font-display font-bold text-xl text-slate-800">My Beneficiaries</h1>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input className="input pl-9" placeholder="Search name or mobile…" value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }} />
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
        {FILTER_CHIPS.map((c, i) => (
          <button key={i} onClick={() => { setChip(i); setPage(1) }}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${chip===i ? 'bg-brand-600 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>
            {c.label}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? <Spinner /> : results.length === 0 ? <EmptyState message="No beneficiaries found." /> : (
        <div className="space-y-2">
          {results.map(({ beneficiary: b, survey: s }) => (
            <div key={b.id} onClick={() => navigate(`/operator/beneficiaries/${b.id}`)}
              className="card p-4 cursor-pointer hover:shadow-md transition-all active:scale-[0.99]">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 truncate">{b.beneficiary_name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Phone size={12} className="text-slate-400" />
                    <span className="font-mono text-xs text-slate-500">{b.mobile_number}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 truncate">{b.district_name} › {b.block_name} › {b.gp_name}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span className={surveyBadge(s?.survey_status)}>{s?.survey_status || 'Pending'}</span>
                  <span className={callBadge(s?.call_connected)}>{s?.call_connected === 'Yes' ? 'Connected' : 'Not Connected'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <Pagination count={count} page={page} pageSize={30} onPage={setPage} />
    </div>
  )
}
