import { CheckSquare, Construction } from 'lucide-react'

export default function OperatorTasks() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
      <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center mb-5">
        <CheckSquare size={36} className="text-slate-400" />
      </div>
      <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 px-3 py-1.5 rounded-full text-xs font-semibold mb-4">
        <Construction size={14} /> Coming Soon
      </div>
      <h2 className="font-display font-bold text-xl text-slate-800">Task Module</h2>
      <p className="text-slate-400 text-sm mt-2 max-w-xs">The task management feature will be available in an upcoming release.</p>
    </div>
  )
}
