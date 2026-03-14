import { AlertTriangle } from 'lucide-react'
import Modal from './Modal'

export default function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Delete', loading }) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <div className="flex flex-col items-center text-center gap-4">
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
          <AlertTriangle size={24} className="text-red-500" />
        </div>
        <p className="text-slate-600 text-sm">{message}</p>
        <div className="flex gap-3 w-full">
          <button onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
          <button onClick={onConfirm} disabled={loading} className="btn-danger flex-1 justify-center">
            {loading ? 'Deleting…' : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  )
}
