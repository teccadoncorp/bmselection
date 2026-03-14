import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Upload, Search, Trash2, CloudUpload } from 'lucide-react'
import toast from 'react-hot-toast'
import { beneficiaryAPI } from '../../api'
import Modal from '../../components/ui/Modal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import Spinner from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'
import Pagination from '../../components/ui/Pagination'
import Select from '../../components/ui/Select'
import { useDistricts, useBlocks, useGPs } from '../../hooks/useGeography'
import { getErrorMessage, GENDER_OPTIONS, SURVEY_OPTIONS, CALL_OPTIONS, STATUS_OPTIONS } from '../../utils'

const FAQ_FIELDS = [
  { key: 'received_govt_house', label: 'Received Govt House?' },
  { key: 'amount_credited', label: 'Amount Credited?' },
  { key: 'construction_status', label: 'Construction Status?' },
  { key: 'money_taken', label: 'Money Taken?' },
]

export default function AdminBeneficiaries() {
  const qc = useQueryClient()
  const fileRef = useRef()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState('list') // 'list' | 'faq'
  const [modal, setModal] = useState(null)
  const [selected, setSelected] = useState(null)
  const [geoFilters, setGeoFilters] = useState({})
  const [faqFilters, setFaqFilters] = useState({})
  const [uploadResult, setUploadResult] = useState(null)
  const [districtId, setDistrictId] = useState('')
  const [blockId, setBlockId] = useState('')

  const { data: districts } = useDistricts()
  const { data: blocks } = useBlocks(districtId)
  const { data: gps } = useGPs(blockId)

  const listParams = { page, search, page_size: 50, ...geoFilters }
  const faqParams = { page, page_size: 50, ...faqFilters }

  const { data, isLoading } = useQuery({
    queryKey: tab === 'list' ? ['beneficiaries', listParams] : ['beneficiaries-faq', faqParams],
    queryFn: () => tab === 'list'
      ? beneficiaryAPI.list(listParams).then(r => r.data)
      : beneficiaryAPI.filterBySurvey(faqParams).then(r => r.data),
  })

  const deleteMut = useMutation({
    mutationFn: () => beneficiaryAPI.delete(selected.id),
    onSuccess: () => { toast.success('Deleted'); setModal(null); qc.invalidateQueries({ queryKey: ['beneficiaries'] }) },
    onError: e => toast.error(getErrorMessage(e)),
  })

  const uploadMut = useMutation({
    mutationFn: (file) => beneficiaryAPI.bulkUpload(file),
    onSuccess: (res) => { setUploadResult(res.data); qc.invalidateQueries({ queryKey: ['beneficiaries'] }) },
    onError: e => toast.error(getErrorMessage(e)),
  })

  const handleFile = (e) => {
    const file = e.target.files?.[0]
    if (file) { setUploadResult(null); uploadMut.mutate(file) }
  }

  const results = data?.results || []
  const count = data?.count || 0

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-slate-800">Beneficiaries</h1>
          <p className="text-slate-400 text-sm">{count.toLocaleString()} records</p>
        </div>
        <div className="flex gap-2">
          <input type="file" ref={fileRef} className="hidden" accept=".csv" onChange={handleFile} />
          <button onClick={() => { setUploadResult(null); setModal('upload') }} className="btn-secondary">
            <Upload size={16} /> Bulk Upload CSV
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {[['list','All Beneficiaries'],['faq','FAQ Filter']].map(([t,l]) => (
          <button key={t} onClick={() => { setTab(t); setPage(1) }}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab===t ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            {l}
          </button>
        ))}
      </div>

      {/* Filters */}
      {tab === 'list' && (
        <div className="flex flex-wrap gap-2 items-end">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className="input pl-9" placeholder="Search name / mobile…" value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }} />
          </div>
          <Select value={districtId} placeholder="District"
            onChange={v => { setDistrictId(v); setBlockId(''); setGeoFilters({ district_lgd: districts?.find(d => String(d.id)===v)?.lgd_code }) }}
            options={(districts||[]).map(d => ({ value: String(d.id), label: d.name }))} />
          <Select value={blockId} placeholder="Block"
            onChange={v => { setBlockId(v); setGeoFilters(f => ({ ...f, block_lgd: blocks?.find(b => String(b.id)===v)?.lgd_code })) }}
            options={(blocks||[]).map(b => ({ value: String(b.id), label: b.name }))} />
          <Select placeholder="Gender"
            onChange={v => setGeoFilters(f => ({ ...f, gender: v }))}
            options={GENDER_OPTIONS} value={geoFilters.gender} />
        </div>
      )}

      {tab === 'faq' && (
        <div className="card p-4 grid grid-cols-2 md:grid-cols-3 gap-3">
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
            <button onClick={() => { setFaqFilters({}); setPage(1) }} className="btn-secondary w-full justify-center">Clear</button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? <Spinner /> : results.length === 0 ? <EmptyState /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[800px]">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  {['Name','Mobile','District','Block','GP','Village','Gender','Scheme','Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {results.map(b => (
                  <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap">{b.beneficiary_name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{b.mobile_number}</td>
                    <td className="px-4 py-3 text-slate-600 text-xs">{b.district_name}</td>
                    <td className="px-4 py-3 text-slate-600 text-xs">{b.block_name}</td>
                    <td className="px-4 py-3 text-slate-600 text-xs">{b.gp_name}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{b.village_name}</td>
                    <td className="px-4 py-3"><span className="badge-blue">{b.gender}</span></td>
                    <td className="px-4 py-3 text-slate-500 text-xs max-w-[160px] truncate">{b.govt_scheme_name}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => { setSelected(b); setModal('delete') }}
                        className="p-1.5 rounded hover:bg-red-50 text-red-400"><Trash2 size={14} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="px-4"><Pagination count={count} page={page} pageSize={50} onPage={setPage} /></div>
      </div>

      {/* Upload Modal */}
      <Modal open={modal === 'upload'} onClose={() => setModal(null)} title="Bulk Upload CSV">
        <div className="space-y-4">
          <div onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-slate-200 rounded-xl p-10 text-center cursor-pointer hover:border-brand-400 hover:bg-brand-50 transition-all">
            <CloudUpload size={40} className="mx-auto text-slate-300 mb-3" />
            <p className="font-medium text-slate-600">Click to select CSV file</p>
            <p className="text-xs text-slate-400 mt-1">OldReferenceID, BeneficiaryName, MobileNumber, District, Block, GP…</p>
            <input type="file" ref={fileRef} className="hidden" accept=".csv" onChange={handleFile} />
          </div>
          {uploadMut.isPending && <div className="flex items-center gap-2 text-brand-600 text-sm"><div className="w-4 h-4 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" />Uploading…</div>}
          {uploadResult && (
            <div className="rounded-xl bg-slate-50 p-4 space-y-2 text-sm">
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center"><p className="text-2xl font-display font-bold text-green-600">{uploadResult.created}</p><p className="text-xs text-slate-500">Created</p></div>
                <div className="text-center"><p className="text-2xl font-display font-bold text-blue-600">{uploadResult.updated}</p><p className="text-xs text-slate-500">Updated</p></div>
                <div className="text-center"><p className="text-2xl font-display font-bold text-red-500">{uploadResult.error_count}</p><p className="text-xs text-slate-500">Errors</p></div>
              </div>
              {uploadResult.errors?.length > 0 && (
                <div className="mt-3 max-h-40 overflow-y-auto">
                  {uploadResult.errors.map((e, i) => <p key={i} className="text-xs text-red-500">{JSON.stringify(e)}</p>)}
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>

      <ConfirmDialog open={modal === 'delete'} onClose={() => setModal(null)}
        onConfirm={() => deleteMut.mutate()} loading={deleteMut.isPending}
        title="Delete Beneficiary" message={`Delete "${selected?.beneficiary_name}"?`} />
    </div>
  )
}
