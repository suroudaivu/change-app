import type { LucideIcon } from 'lucide-react'

export interface NavTab<T extends string> {
  id: T
  label: string
  icon: LucideIcon
}

interface FloatingNavProps<T extends string> {
  tabs: NavTab<T>[]
  active: T
  onChange: (id: T) => void
}

/** Detached, translucent tab bar that floats over the content rather than
 * sitting in a solid strip at the edge — so the page reads as one surface
 * scrolling underneath it. */
export function FloatingNav<T extends string>({ tabs, active, onChange }: FloatingNavProps<T>) {
  return (
    <nav
      className="fixed inset-x-0 z-40 flex justify-center px-6 pointer-events-none"
      style={{ bottom: 'calc(env(safe-area-inset-bottom) + 14px)' }}
    >
      <div
        className="pointer-events-auto flex items-center gap-1 p-1.5 rounded-full w-full max-w-[320px]"
        style={{
          background: 'rgba(32, 32, 40, 0.72)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.45)',
        }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = tab.id === active
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
              className="flex-1 h-12 rounded-full flex items-center justify-center transition-transform active:scale-90"
            >
              <span
                className="w-11 h-11 rounded-full flex items-center justify-center transition-colors duration-200"
                style={{ backgroundColor: isActive ? 'var(--accent-bg)' : 'transparent' }}
              >
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2.4 : 1.9}
                  color={isActive ? 'var(--accent)' : 'var(--text-dim)'}
                />
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
