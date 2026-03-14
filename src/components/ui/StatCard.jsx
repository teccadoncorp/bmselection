import clsx from 'clsx'

export default function StatCard({ label, value, icon: Icon, color = 'blue', sub }) {
  const colors = {
    blue:   'bg-brand-600 text-white',
    green:  'bg-emerald-500 text-white',
    yellow: 'bg-amber-500 text-white',
    red:    'bg-red-500 text-white',
    purple: 'bg-purple-500 text-white',
  }
  const bg = {
    blue:   'from-brand-50 to-white border-brand-100',
    green:  'from-emerald-50 to-white border-emerald-100',
    yellow: 'from-amber-50 to-white border-amber-100',
    red:    'from-red-50 to-white border-red-100',
    purple: 'from-purple-50 to-white border-purple-100',
  }
  return (
    <div className={clsx('card p-5 bg-gradient-to-br flex items-start gap-4', bg[color])}>
      <div className={clsx('p-2.5 rounded-xl shrink-0', colors[color])}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
        <p className="text-3xl font-display font-bold text-slate-800 mt-0.5">{value ?? '—'}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}
