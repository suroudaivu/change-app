import { useRegisterSW } from 'virtual:pwa-register/react'
import { RefreshCw } from 'lucide-react'

/** Surfaces a new deployed version instead of leaving you to guess when to
 * force-close the app. The service worker updates in the background either
 * way; this just makes it visible and immediate. */
export function UpdatePrompt({ bottomOffset }: { bottomOffset: number }) {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  if (!needRefresh) return null

  return (
    <div
      className="fixed inset-x-0 z-40 flex justify-center px-4 pointer-events-none"
      style={{ bottom: `calc(${bottomOffset}px + env(safe-area-inset-bottom) + 12px)` }}
    >
      <div
        className="pointer-events-auto flex items-center gap-3 pl-4 pr-2 py-2 rounded-2xl shadow-lg w-full max-w-[440px]"
        style={{ backgroundColor: 'var(--accent-bg)' }}
      >
        <span className="flex-1 text-sm text-[var(--text)]">Hay una versión nueva</span>
        <button
          onClick={() => setNeedRefresh(false)}
          className="h-11 px-3 text-sm text-[var(--text-faint)]"
        >
          Después
        </button>
        <button
          onClick={() => updateServiceWorker(true)}
          className="flex items-center gap-1.5 h-11 px-3 rounded-xl text-sm font-semibold"
          style={{ color: 'var(--accent)' }}
        >
          <RefreshCw size={15} />
          Actualizar
        </button>
      </div>
    </div>
  )
}
