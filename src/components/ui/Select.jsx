import { ChevronDown } from 'lucide-react'

export default function Select({ label, value, onChange, options = [], placeholder = 'All', className = '' }) {
  return (
    <div className={className}>
      {label && <label className="label">{label}</label>}
      <div className="relative">
        <select
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="input appearance-none pr-8 cursor-pointer"
        >
          <option value="">{placeholder}</option>
          {options.map((o) => (
            <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>
          ))}
        </select>
        <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
      </div>
    </div>
  )
}
