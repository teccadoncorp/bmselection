import { SearchX } from 'lucide-react'
export default function EmptyState({ title = 'No results', message = 'Nothing found matching your criteria.' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
        <SearchX size={24} className="text-slate-400" />
      </div>
      <h3 className="font-display font-semibold text-slate-700 text-base">{title}</h3>
      <p className="text-slate-400 text-sm mt-1 max-w-xs">{message}</p>
    </div>
  )
}
