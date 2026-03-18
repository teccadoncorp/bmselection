import { useQuery } from '@tanstack/react-query'
import {
  X, User, Phone, MapPin, Home, Wallet, HardHat,
  AlertTriangle, CheckCircle2, Clock3, PhoneOff, PhoneCall,
  Calendar, UserCog, Hash, Layers, MessageSquare, Building2,
  ArrowUpRight, ClipboardCheck
} from 'lucide-react'
import { surveyAPI } from '../../api'
import Spinner from '../../components/ui/Spinner'
import { formatDateTime, answerBadge, surveyBadge, callBadge } from '../../utils'

// ─── FAQ config ──────────────────────────────────────────────────────────────
const FAQ_ITEMS = [
  {
    key: 'received_govt_house',
    label: 'Received Government House',
    icon: Home,
    yesColor: 'text-green-600',
    noColor: 'text-red-500',
    yesDesc: 'Beneficiary confirmed receiving the government house scheme.',
    noDesc: 'Beneficiary has NOT received the government house scheme.',
  },
  {
    key: 'amount_credited',
    label: 'Amount Credited to Account',
    icon: Wallet,
    yesColor: 'text-green-600',
    noColor: 'text-red-500',
    yesDesc: 'Amount has been credited to the beneficiary\'s account.',
    noDesc: 'Amount has NOT been credited to the beneficiary\'s account.',
  },
  {
    key: 'construction_status',
    label: 'Construction Completed',
    icon: HardHat,
    yesColor: 'text-green-600',
    noColor: 'text-amber-500',
    yesDesc: 'House construction has been completed.',
    noDesc: 'House construction is NOT yet completed.',
  },
  {
    key: 'money_taken',
    label: 'Money Taken by Official',
    icon: AlertTriangle,
    yesColor: 'text-red-600',
    noColor: 'text-green-600',
    yesDesc: 'Beneficiary reported that money was taken by an official.',
    noDesc: 'No money was taken by an official.',
  },
]

// ─── Answer badge chip ────────────────────────────────────────────────────────
function AnswerChip({ value, yesColor, noColor }) {
  if (value === 'Yes')
    return <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 border border-green-200 ${yesColor}`}>
      <CheckCircle2 size={12} /> Yes
    </span>
  if (value === 'No')
    return <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 border border-red-200 ${noColor}`}>
      <X size={12} /> No
    </span>
  return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 border border-slate-200 text-slate-500">
    — Not Answered
  </span>
}

// ─── Info row helper ─────────────────────────────────────────────────────────
function InfoRow({ icon: Icon, label, value, mono = false, className = '' }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-slate-50 last:border-0">
      <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
        <Icon size={13} className="text-slate-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-400 font-medium mb-0.5">{label}</p>
        <p className={`text-sm text-slate-800 font-semibold break-words ${mono ? 'font-mono' : ''} ${className}`}>
          {value || <span className="text-slate-300 font-normal">—</span>}
        </p>
      </div>
    </div>
  )
}

// ─── Section card ────────────────────────────────────────────────────────────
function Section({ title, icon: Icon, children, accent = 'slate' }) {
  const accents = {
    slate:  'bg-slate-600',
    blue:   'bg-brand-600',
    green:  'bg-emerald-600',
    amber:  'bg-amber-500',
    red:    'bg-red-500',
    purple: 'bg-purple-600',
  }
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-slate-100 bg-slate-50/60">
        <div className={`p-1.5 rounded-lg ${accents[accent]}`}>
          <Icon size={13} className="text-white" />
        </div>
        <h3 className="font-display font-semibold text-sm text-slate-700">{title}</h3>
      </div>
      <div className="px-5 py-1">{children}</div>
    </div>
  )
}

// ─── Main drawer ─────────────────────────────────────────────────────────────
export default function AdminSurveyDetailDrawer({ beneficiaryId, onClose }) {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-survey-detail', beneficiaryId],
    queryFn:  () => surveyAPI.detail(beneficiaryId).then(r => r.data),
    enabled:  !!beneficiaryId,
  })

  const b = data?.beneficiary
  const s = data?.survey

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white z-50 shadow-2xl flex flex-col overflow-hidden">

        {/* Drawer header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-100 flex items-center justify-center">
              <ClipboardCheck size={18} className="text-brand-600" />
            </div>
            <div>
              <p className="font-display font-bold text-slate-800 text-sm leading-tight">Survey Detail</p>
              <p className="text-xs text-slate-400">Full beneficiary &amp; survey record</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Spinner />
          </div>
        ) : !b ? (
          <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
            No data found.
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-5">

            {/* ── Hero: Name + status badges ───────────────────────────── */}
            <div className="card p-5 bg-gradient-to-br from-brand-50 to-white border-brand-100">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-brand-600 flex items-center justify-center shrink-0 shadow-lg shadow-brand-600/20">
                  <User size={24} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-display font-bold text-xl text-slate-800 truncate">{b.beneficiary_name}</h2>
                  {b.father_husband_name && (
                    <p className="text-sm text-slate-500 mt-0.5">S/o D/o W/o: {b.father_husband_name}</p>
                  )}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {/* Survey status */}
                    {s?.survey_status === 'Completed' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200">
                        <CheckCircle2 size={12} /> Completed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">
                        <Clock3 size={12} /> Pending
                      </span>
                    )}
                    {/* Call status */}
                    {s?.call_connected === 'Yes' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200">
                        <PhoneCall size={12} /> Call Connected
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
                        <PhoneOff size={12} /> Not Connected
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Contact ──────────────────────────────────────────────── */}
            <Section title="Contact Information" icon={Phone} accent="blue">
              <a
                href={`tel:${b.mobile_number}`}
                className="flex items-center gap-3 my-3 p-3 bg-green-50 border border-green-200 rounded-xl hover:bg-green-100 transition-colors group"
              >
                <div className="w-9 h-9 rounded-lg bg-green-500 flex items-center justify-center">
                  <Phone size={15} className="text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-mono font-bold text-green-800">{b.mobile_number}</p>
                  <p className="text-xs text-green-600">Tap to call</p>
                </div>
                <ArrowUpRight size={16} className="text-green-400 group-hover:text-green-600 transition-colors" />
              </a>
              <InfoRow icon={Hash}    label="Reference ID"  value={b.old_reference_id} mono />
              <InfoRow icon={User}    label="Gender"        value={b.gender} />
              <InfoRow icon={Layers}  label="Caste"         value={b.caste_name} />
            </Section>

            {/* ── Geography ────────────────────────────────────────────── */}
            <Section title="Location" icon={MapPin} accent="slate">
              <InfoRow icon={MapPin}    label="Village"   value={b.village_name} />
              <InfoRow icon={MapPin}    label="GP"        value={`${b.gp_name} (${b.gp_lgd})`} />
              <InfoRow icon={MapPin}    label="Block"     value={`${b.block_name} (${b.block_lgd})`} />
              <InfoRow icon={Building2} label="District"  value={`${b.district_name} (${b.district_lgd})`} />
            </Section>

            {/* ── Scheme ───────────────────────────────────────────────── */}
            <Section title="Scheme" icon={ClipboardCheck} accent="purple">
              <InfoRow icon={ClipboardCheck} label="Government Scheme" value={b.govt_scheme_name} />
            </Section>

            {/* ── Survey answers ───────────────────────────────────────── */}
            <Section title="Survey Answers" icon={CheckCircle2} accent="green">
              <div className="py-2 space-y-3">
                {FAQ_ITEMS.map(({ key, label, icon: Icon, yesColor, noColor, yesDesc, noDesc }) => {
                  const val = s?.[key] || 'Not Answered'
                  const desc = val === 'Yes' ? yesDesc : val === 'No' ? noDesc : null
                  return (
                    <div key={key} className={`rounded-xl border p-4 transition-colors ${
                      val === 'Yes' && key === 'money_taken'
                        ? 'bg-red-50 border-red-200'
                        : val === 'Yes'
                        ? 'bg-green-50/50 border-green-100'
                        : val === 'No'
                        ? 'bg-red-50/40 border-red-100'
                        : 'bg-slate-50 border-slate-100'
                    }`}>
                      <div className="flex items-center justify-between gap-3 mb-1.5">
                        <div className="flex items-center gap-2">
                          <Icon size={14} className={
                            val === 'Yes' && key === 'money_taken' ? 'text-red-500'
                            : val === 'Yes' ? 'text-green-500'
                            : val === 'No' ? 'text-red-400'
                            : 'text-slate-400'
                          } />
                          <span className="text-sm font-semibold text-slate-700">{label}</span>
                        </div>
                        <AnswerChip value={val} yesColor={yesColor} noColor={noColor} />
                      </div>
                      {desc && (
                        <p className="text-xs text-slate-500 ml-5">{desc}</p>
                      )}
                    </div>
                  )
                })}
              </div>
            </Section>

            {/* ── Remarks ──────────────────────────────────────────────── */}
            {s?.remarks && (
              <Section title="Remarks" icon={MessageSquare} accent="amber">
                <div className="py-3">
                  <p className="text-sm text-slate-700 leading-relaxed bg-amber-50 border border-amber-200 rounded-xl p-4">
                    {s.remarks}
                  </p>
                </div>
              </Section>
            )}

            {/* ── Audit ────────────────────────────────────────────────── */}
            <Section title="Audit Trail" icon={Calendar} accent="slate">
              <InfoRow icon={UserCog}  label="Last Updated By" value={s?.last_updated_by ? `User #${s.last_updated_by}` : 'Not yet updated'} />
              <InfoRow icon={Calendar} label="Survey Updated"  value={formatDateTime(s?.updated_at)} />
              <InfoRow icon={Calendar} label="Survey Created"  value={formatDateTime(s?.created_at)} />
              <InfoRow icon={Calendar} label="Beneficiary Added" value={formatDateTime(b?.created_at)} />
            </Section>

          </div>
        )}

        {/* Footer */}
        {!isLoading && b && (
          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/60 shrink-0">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Survey ID: <span className="font-mono font-semibold text-slate-600">#{s?.id}</span></span>
              <span>Beneficiary ID: <span className="font-mono font-semibold text-slate-600">#{b?.id}</span></span>
            </div>
          </div>
        )}
      </div>
    </>
  )
}