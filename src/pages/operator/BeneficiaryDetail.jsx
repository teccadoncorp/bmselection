import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Phone, MapPin, User, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import { surveyAPI } from '../../api'
import Spinner from '../../components/ui/Spinner'
import RadioGroup from '../../components/ui/RadioGroup'
import { getErrorMessage, SURVEY_OPTIONS } from '../../utils'

export default function OperatorBeneficiaryDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['beneficiary-detail', id],
    queryFn: () => surveyAPI.detail(id).then(r => r.data),
  })

  const [form, setForm] = useState({
    received_govt_house: 'Not Answered',
    amount_credited: 'Not Answered',
    construction_status: 'Not Answered',
    money_taken: 'Not Answered',
    remarks: '',
    call_connected: 'No',
    survey_status: 'Pending',
  })

  useEffect(() => {
    if (data?.survey) {
      const s = data.survey
      setForm({
        received_govt_house: s.received_govt_house || 'Not Answered',
        amount_credited: s.amount_credited || 'Not Answered',
        construction_status: s.construction_status || 'Not Answered',
        money_taken: s.money_taken || 'Not Answered',
        remarks: s.remarks || '',
        call_connected: s.call_connected || 'No',
        survey_status: s.survey_status || 'Pending',
      })
    }
  }, [data])

  const saveMut = useMutation({
    mutationFn: () => surveyAPI.update(id, form),
    onSuccess: () => {
      toast.success('Survey saved!')
      qc.invalidateQueries({ queryKey: ['operator-assigned'] })
      qc.invalidateQueries({ queryKey: ['beneficiary-detail', id] })
    },
    onError: e => toast.error(getErrorMessage(e)),
  })

  if (isLoading) return <Spinner />

  const b = data?.beneficiary
  if (!b) return <div className="p-4 text-slate-500">Beneficiary not found.</div>

  return (
    <div className="max-w-lg mx-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-slate-100 px-4 py-3 flex items-center gap-3 z-10">
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-display font-bold text-slate-800 truncate">{b.beneficiary_name}</h1>
      </div>

      <div className="p-4 space-y-5">
        {/* Beneficiary info */}
        <div className="card p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-brand-100 flex items-center justify-center shrink-0">
              <User size={22} className="text-brand-600" />
            </div>
            <div>
              <p className="font-semibold text-slate-800">{b.beneficiary_name}</p>
              <p className="text-xs text-slate-400">{b.father_husband_name || 'N/A'}</p>
            </div>
          </div>

          <a href={`tel:${b.mobile_number}`}
            className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl hover:bg-green-100 transition-colors">
            <div className="w-9 h-9 rounded-lg bg-green-500 flex items-center justify-center">
              <Phone size={16} className="text-white" />
            </div>
            <div>
              <p className="font-mono font-semibold text-green-800 text-sm">{b.mobile_number}</p>
              <p className="text-xs text-green-600">Tap to call</p>
            </div>
          </a>

          <div className="flex items-start gap-2 text-xs text-slate-500">
            <MapPin size={14} className="mt-0.5 shrink-0 text-slate-400" />
            <span>{b.village_name}, {b.gp_name}, {b.block_name}, {b.district_name}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-50 rounded-lg p-2">
              <p className="text-slate-400">Scheme</p>
              <p className="font-medium text-slate-700 truncate">{b.govt_scheme_name}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-2">
              <p className="text-slate-400">Caste / Gender</p>
              <p className="font-medium text-slate-700">{b.caste_name} / {b.gender}</p>
            </div>
          </div>
        </div>

        {/* Survey form */}
        <div className="card p-4 space-y-5">
          <h2 className="font-display font-semibold text-slate-700 border-b border-slate-100 pb-3">Survey Form</h2>

          <RadioGroup label="Call Connected?" name="call_connected" value={form.call_connected}
            onChange={v => setForm(f => ({ ...f, call_connected: v }))} options={['Yes', 'No']} />

          <RadioGroup label="Received Govt House Scheme?" name="received_govt_house" value={form.received_govt_house}
            onChange={v => setForm(f => ({ ...f, received_govt_house: v }))} options={SURVEY_OPTIONS} />

          <RadioGroup label="Amount Credited to Account?" name="amount_credited" value={form.amount_credited}
            onChange={v => setForm(f => ({ ...f, amount_credited: v }))} options={SURVEY_OPTIONS} />

          <RadioGroup label="House Construction Status?" name="construction_status" value={form.construction_status}
            onChange={v => setForm(f => ({ ...f, construction_status: v }))} options={SURVEY_OPTIONS} />

          <RadioGroup label="Someone Took Money?" name="money_taken" value={form.money_taken}
            onChange={v => setForm(f => ({ ...f, money_taken: v }))} options={SURVEY_OPTIONS} />

          <div>
            <label className="label">Remarks</label>
            <textarea className="input min-h-[80px] resize-none" placeholder="Add remarks…"
              value={form.remarks} onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))} />
          </div>

          <div>
            <label className="label">Survey Status</label>
            <div className="flex gap-3">
              {['Pending', 'Completed'].map(s => (
                <label key={s} className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all font-medium text-sm ${
                  form.survey_status === s
                    ? s === 'Completed' ? 'border-green-500 bg-green-50 text-green-700' : 'border-amber-400 bg-amber-50 text-amber-700'
                    : 'border-slate-200 text-slate-500 hover:border-slate-300'
                }`}>
                  <input type="radio" name="survey_status" value={s} checked={form.survey_status === s}
                    onChange={() => setForm(f => ({ ...f, survey_status: s }))} className="sr-only" />
                  {s}
                </label>
              ))}
            </div>
          </div>
        </div>

        <button onClick={() => saveMut.mutate()} disabled={saveMut.isPending}
          className="btn-primary w-full justify-center py-3 text-base sticky bottom-20">
          {saveMut.isPending
            ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving…</>
            : <><Save size={18} />Save Survey</>}
        </button>
      </div>
    </div>
  )
}
