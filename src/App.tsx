import { useState } from 'react'
import { useAppData } from './useAppData'
import { Today } from './screens/Today'
import { Ajustes } from './screens/Ajustes'
import { Peso } from './screens/Peso'

type Tab = 'hoy' | 'peso' | 'ajustes'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'hoy', label: 'Hoy', icon: '●' },
  { id: 'peso', label: 'Peso', icon: '▲' },
  { id: 'ajustes', label: 'Ajustes', icon: '⚙' },
]

export default function App() {
  const [tab, setTab] = useState<Tab>('hoy')
  const { data, update } = useAppData()

  return (
    <div className="h-full">
      <main
        className="h-full overflow-y-auto flex flex-col"
        style={{ paddingBottom: 'calc(64px + env(safe-area-inset-bottom))' }}
      >
        {tab === 'hoy' && <Today data={data} update={update} onGoToBackup={() => setTab('ajustes')} />}
        {tab === 'peso' && <Peso data={data} update={update} />}
        {tab === 'ajustes' && <Ajustes data={data} update={update} />}
      </main>

      <nav
        className="fixed inset-x-0 bottom-0 mx-auto max-w-[480px] flex border-t border-[var(--border)] bg-[var(--bg)]"
        style={{ paddingBottom: '4px' }}
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="flex-1 flex flex-col items-center gap-1 py-2.5"
          >
            <span
              className="text-lg"
              style={{ color: tab === t.id ? 'var(--accent)' : 'var(--text-faint)' }}
            >
              {t.icon}
            </span>
            <span
              className="text-[11px]"
              style={{ color: tab === t.id ? 'var(--accent)' : 'var(--text-faint)' }}
            >
              {t.label}
            </span>
          </button>
        ))}
      </nav>
    </div>
  )
}
