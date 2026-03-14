import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, BarChart3, Users, MapPin, TrendingUp, Download } from 'lucide-react'
import { beneficiaryAPI, analyticsAPI } from '../../api'
import Spinner from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'
import Pagination from '../../components/ui/Pagination'
import Select from '../../components/ui/Select'
import { useDistricts, useBlocks, useGPs } from '../../hooks/useGeography'
import { SURVEY_OPTIONS, CALL_OPTIONS, STATUS_OPTIONS, answerBadge, surveyBadge, callBadge } from '../../utils'

const FAQ_FIELDS = [
  { key: 'received_govt_house', label: 'Received Govt House?' },
  { key: 'amount_credited', label: 'Amount Credited?' },
  { key: 'construction_status', label: 'Construction Status?' },
  { key: 'money_taken', label: 'Money Taken?' },
]

export default function AdminResearch() {
  const [tab, setTab] = useState('filter') // 'filter' | 'geo'
  const [page, setPage] = useState(1)

  // FAQ Filter tab
  const [faqFilters, setFaqFilters] = useState({})

  // Geography deep-dive tab
  const [districtObj, setDistrictObj] = useState(null)
  const [blockObj, setBlockObj] = useState(null)
  const [gpObj, setGpObj] = useState(null)
  const [geoSearch, setGeoSearch] = useState('')

  const { data: districts } = useDistricts()
  const { data: blocks } = useBlocks(districtObj?.id)
  const { data: gps } = useGPs(blockObj?.id)

  const faqParams = { page, page_size: 50, ...faqFilters }
  const geoParams = {
    page, page_size: 50,
    search: geoSearch || undefined,
    ...(districtObj && { district_lgd: districtObj.lgd_code }),
    ...(blockObj && { block_lgd: blockObj.lgd_code }),
    ...(gpObj && { gp_lgd: gpObj.lgd_code }),
  }

  const { data: faqData, isLoading: faqLoading } = useQuery({
    queryKey: ['research-faq', faqParams],
    queryFn: () => beneficiaryAPI.filterBySurvey(faqParams).then(r => r.data),
    enabled: tab === 'filter',
  })

  const { data: geoData, isLoading: geoLoading } = useQuery({
    queryKey: ['research-geo', geoParams],
    queryFn: () => beneficiaryAPI.list(geoParams).then(r => r.data),
    enabled: tab === 'geo',
  })

  const { data: analytics } = useQuery({
    queryKey: ['analytics-dashboard'],
    queryFn: () => analyticsAPI.dashboard().then(r => r.data),
  })

  const faqResults = faqData?.results || []
  const geoResults = geoData?.results || []

  const handleDistrictChange = (val) => {
    const obj = (districts || []).find(d => String(d.id) === String(val)) || null
    setDistrictObj(obj); setBlockObj(null); setGpObj(null); setPage(1)
  }
  const handleBlockChange = (val) => {
    const obj = (blocks || []).find(b => String(b.id) === String(val)) || null
    setBlockObj(obj); setGpObj(null); setPage(1)
  }
  const handleGpChange = (val) => {
    const obj = (gps || []).find(g => String(g.id) === String(val)) || null
    setGpObj(obj); setPage(1)
  }

  const stats = analytics || {}

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-slate-800">Research</h1>
          <p className="text-slate-400 text-sm">Deep-dive analysis across beneficiaries and survey responses</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Users, label: 'Total Beneficiaries', value: stats.total_beneficiaries?.toLocaleString() ?? '—', color: 'text-brand-600 bg-brand-50' },
          { icon: BarChart3, label: 'Surveys Completed', value: stats.completed?.toLocaleString() ?? '—', color: 'text-green-600 bg-green-50' },
          { icon: TrendingUp, label: 'Money Taken Cases', value: stats.money_taken_yes?.toLocaleString() ?? '—', color: 'text-red-600 bg-red-50' },
          { icon: MapPin, label: 'Districts Covered', value: stats.districts_covered?.toLocaleString() ?? (districts?.length?.toLocaleString() ?? '—'), color: 'text-purple-600 bg-purple-50' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="card p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
              <Icon size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-400 truncate">{label}</p>
              <p className="font-display font-bold text-xl text-slate-800">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {[['filter', 'Survey Filter'], ['geo', 'Geography Drill-down']].map(([t, l]) => (
          <button key={t} onClick={() => { setTab(t); setPage(1) }}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            {l}
          </button>
        ))}
      </div>

      {/* FAQ Filter Tab */}
      {tab === 'filter' && (
        <>
          <div className="card p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {FAQ_FIELDS.map(({ key, label }) => (
              <Select key={key} label={label} value={faqFilters[key]}
                onChange={v => { setFaqFilters(f => ({ ...f, [key]: v })); setPage(1) }}
                options={SURVEY_OPTIONS} placeholder="Any" />
            ))}
            <Select label="Call Connected" value={faqFilters.call_connected}
              onChange={v => { setFaqFilters(f => ({ ...f, call_connected: v })); setPage(1) }}
              options={CALL_OPTIONS} placeholder="Any" />
            <Select label="Survey Status" value={faqFilters.survey_status}
              onChange={v => { setFaqFilters(f => ({ ...f, survey_status: v })); setPage(1) }}
              options={STATUS_OPTIONS} placeholder="Any" />
            <div className="flex items-end">
              <button onClick={() => { setFaqFilters({}); setPage(1) }} className="btn-secondary w-full justify-center">
                Clear All
              </button>
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <p className="text-sm text-slate-500">
                <span className="font-semibold text-slate-800">{faqData?.count ?? 0}</span> results
              </p>
            </div>
            {faqLoading ? <Spinner /> : faqResults.length === 0 ? <EmptyState message="No results match the filters." /> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[900px]">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      {['Name', 'Mobile', 'Location', 'Govt House', 'Amount Credited', 'Construction', 'Money Taken', 'Status'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {faqResults.map(({ beneficiary: b, survey: s }) => (
                      <tr key={b?.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap">{b?.beneficiary_name}</td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-600">{b?.mobile_number}</td>
                        <td className="px-4 py-3 text-xs text-slate-500">
                          {b?.district_name} › {b?.block_name} › {b?.gp_name}
                        </td>
                        <td className="px-4 py-3"><span className={answerBadge(s?.received_govt_house)}>{s?.received_govt_house || '—'}</span></td>
                        <td className="px-4 py-3"><span className={answerBadge(s?.amount_credited)}>{s?.amount_credited || '—'}</span></td>
                        <td className="px-4 py-3"><span className={answerBadge(s?.construction_status)}>{s?.construction_status || '—'}</span></td>
                        <td className="px-4 py-3"><span className={answerBadge(s?.money_taken)}>{s?.money_taken || '—'}</span></td>
                        <td className="px-4 py-3"><span className={surveyBadge(s?.survey_status)}>{s?.survey_status || 'Pending'}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="px-4">
              <Pagination count={faqData?.count || 0} page={page} pageSize={50} onPage={setPage} />
            </div>
          </div>
        </>
      )}

      {/* Geography Drill-down Tab */}
      {tab === 'geo' && (
        <>
          <div className="card p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="relative md:col-span-1">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input className="input pl-9" placeholder="Search name / mobile…"
                  value={geoSearch} onChange={e => { setGeoSearch(e.target.value); setPage(1) }} />
              </div>
              <Select
                placeholder="All Districts"
                value={districtObj ? String(districtObj.id) : ''}
                onChange={handleDistrictChange}
                options={(districts || []).map(d => ({ value: String(d.id), label: d.name }))}
              />
              <Select
                placeholder="All Blocks"
                value={blockObj ? String(blockObj.id) : ''}
                onChange={handleBlockChange}
                options={(blocks || []).map(b => ({ value: String(b.id), label: b.name }))}
              />
              <Select
                placeholder="All GPs"
                value={gpObj ? String(gpObj.id) : ''}
                onChange={handleGpChange}
                options={(gps || []).map(g => ({ value: String(g.id), label: g.name }))}
              />
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <p className="text-sm text-slate-500">
                <span className="font-semibold text-slate-800">{geoData?.count ?? 0}</span> beneficiaries in selected area
              </p>
            </div>
            {geoLoading ? <Spinner /> : geoResults.length === 0 ? <EmptyState message="No beneficiaries found for this area." /> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[700px]">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      {['Name', 'Mobile', 'District', 'Block', 'GP', 'Village', 'Scheme'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {geoResults.map(b => (
                      <tr key={b.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-medium text-slate-800">{b.beneficiary_name}</td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-600">{b.mobile_number}</td>
                        <td className="px-4 py-3 text-xs text-slate-600">{b.district_name}</td>
                        <td className="px-4 py-3 text-xs text-slate-600">{b.block_name}</td>
                        <td className="px-4 py-3 text-xs text-slate-600">{b.gp_name}</td>
                        <td className="px-4 py-3 text-xs text-slate-500">{b.village_name}</td>
                        <td className="px-4 py-3 text-xs text-slate-500 max-w-[160px] truncate">{b.govt_scheme_name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="px-4">
              <Pagination count={geoData?.count || 0} page={page} pageSize={50} onPage={setPage} />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
