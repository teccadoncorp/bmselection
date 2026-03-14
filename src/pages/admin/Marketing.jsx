import { MessageCircle, MessageSquare, Share2, Construction } from 'lucide-react'
import { useState } from 'react'

const SUBS = [
  { key: 'whatsapp', label: 'WhatsApp Messaging', icon: MessageCircle, color: 'text-green-500' },
  { key: 'sms', label: 'SMS Messaging', icon: MessageSquare, color: 'text-blue-500' },
  { key: 'social', label: 'Social Media', icon: Share2, color: 'text-purple-500' },
]

export default function AdminMarketing() {
  const [sub, setSub] = useState('whatsapp')
  const current = SUBS.find(s => s.key === sub)
  const Icon = current.icon

  return (
    <div className="p-6 flex gap-5">
      <div className="card w-52 shrink-0 overflow-hidden">
        <div className="p-3 border-b border-slate-100"><p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Marketing</p></div>
        {SUBS.map(s => (
          <button key={s.key} onClick={() => setSub(s.key)}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors text-left ${sub===s.key ? 'bg-brand-50 text-brand-700 border-l-4 border-brand-600' : 'text-slate-600 hover:bg-slate-50'}`}>
            <s.icon size={16} className={s.color} />{s.label.split(' ')[0]}
          </button>
        ))}
      </div>
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center mx-auto mb-6">
            <Icon size={36} className={current.color} />
          </div>
          <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 px-3 py-1.5 rounded-full text-xs font-semibold mb-4">
            <Construction size={14} /> Coming Soon
          </div>
          <h2 className="font-display font-bold text-2xl text-slate-800">{current.label}</h2>
          <p className="text-slate-400 mt-2 text-sm">This module is currently disabled. It will be available in the next release.</p>
        </div>
      </div>
    </div>
  )
}
