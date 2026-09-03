import { Undo2 } from 'lucide-react'

interface UndoToastProps {
  message: string
  onUndo: () => void
  bottomOffset: number
}

export function UndoToast({ message, onUndo, bottomOffset }: UndoToastProps) {
  return (
    <div
      className="fixed inset-x-0 z-40 flex justify-center px-4 pointer-events-none"
      style={{ bottom: `calc(${bottomOffset}px + env(safe-area-inset-bottom) + 12px)` }}
    >
      <div
        className="pointer-events-auto flex items-center gap-3 pl-4 pr-2 py-2 rounded-2xl shadow-lg w-full max-w-[440px]"
        style={{ backgroundColor: 'var(--surface-2)' }}
      >
        <span className="flex-1 text-sm text-[var(--text)]">{message}</span>
        <button
          onClick={onUndo}
          className="flex items-center gap-1.5 h-11 px-3 rounded-xl text-sm font-semibold"
          style={{ color: 'var(--accent)' }}
        >
          <Undo2 size={16} />
          Deshacer
        </button>
      </div>
    </div>
  )
}
