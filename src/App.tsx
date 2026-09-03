import { useState } from 'react'
import { House, Scale, Settings, type LucideIcon } from 'lucide-react'
import { useAppData } from './useAppData'
import { Today } from './screens/Today'
import { Ajustes } from './screens/Ajustes'
import { Peso } from './screens/Peso'

type Tab = 'hoy' | 'peso' | 'ajustes'

const TABS: { id: Tab; label: string; icon: LucideIcon }[] = [
  { id: 'hoy', label: 'Hoy', icon: House },
  { id: 'peso', label: 'Peso', icon: Scale },
  { id: 'ajustes', label: 'Ajustes', icon: Settings },
]

// Nav is given this exact height (rather than letting padding size it), and
// the scroll area reserves precisely that much space — so there's never a
// mismatch gap between the two, whatever font rendering does to text height.
const NAV_HEIGHT = 52

export default function App() {
  const [tab, setTab] = useState<Tab>('hoy')
  const { data, update } = useAppData()

  return (
    <div className="h-full">
      <main
        className="h-full overflow-y-auto flex flex-col"
        style={{ paddingBottom: `calc(${NAV_HEIGHT}px + env(safe-area-inset-bottom))` }}
      >
        {tab === 'hoy' && <Today data={data} update={update} onGoToBackup={() => setTab('ajustes')} />}
        {tab === 'peso' && <Peso data={data} update={update} />}
        {tab === 'ajustes' && <Ajustes data={data} update={update} />}
      </main>

      <nav
        className="fixed inset-x-0 bottom-0 mx-auto max-w-[480px] flex border-t border-[var(--border)] bg-[var(--bg)]"
        style={{ height: NAV_HEIGHT, paddingBottom: '4px' }}
      >
        {TABS.map((t) => {
          const Icon = t.icon
          const active = tab === t.id
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex-1 h-full flex flex-col items-center justify-center gap-0.5"
            >
              <Icon size={22} strokeWidth={active ? 2.3 : 1.8} color={active ? 'var(--accent)' : 'var(--text-faint)'} />
              <span
                className="text-[10px]"
                style={{ color: active ? 'var(--accent)' : 'var(--text-faint)' }}
              >
                {t.label}
              </span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
