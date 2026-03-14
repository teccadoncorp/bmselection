import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Pagination({ count, page, pageSize = 50, onPage }) {
  const total = Math.ceil(count / pageSize)
  if (total <= 1) return null

  const pages = []
  for (let i = Math.max(1, page - 2); i <= Math.min(total, page + 2); i++) pages.push(i)

  return (
    <div className="flex items-center justify-between px-1 py-3">
      <p className="text-sm text-slate-500">
        {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, count)} of <span className="font-semibold text-slate-700">{count.toLocaleString()}</span>
      </p>
      <div className="flex items-center gap-1">
        <button onClick={() => onPage(page - 1)} disabled={page === 1}
          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          <ChevronLeft size={16} />
        </button>
        {pages[0] > 1 && <span className="px-2 text-slate-400 text-sm">…</span>}
        {pages.map((p) => (
          <button key={p} onClick={() => onPage(p)}
            className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${p === page ? 'bg-brand-600 text-white' : 'border border-slate-200 hover:bg-slate-50 text-slate-700'}`}>
            {p}
          </button>
        ))}
        {pages[pages.length - 1] < total && <span className="px-2 text-slate-400 text-sm">…</span>}
        <button onClick={() => onPage(page + 1)} disabled={page === total}
          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}
