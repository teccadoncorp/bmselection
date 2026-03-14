export default function RadioGroup({ label, name, value, onChange, options }) {
  return (
    <div>
      {label && <label className="label">{label}</label>}
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <label key={opt} className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm cursor-pointer transition-all ${
            value === opt
              ? 'bg-brand-600 border-brand-600 text-white font-medium'
              : 'border-slate-200 text-slate-600 hover:border-brand-300 hover:bg-brand-50'
          }`}>
            <input type="radio" name={name} value={opt} checked={value === opt}
              onChange={() => onChange(opt)} className="sr-only" />
            {opt}
          </label>
        ))}
      </div>
    </div>
  )
}
