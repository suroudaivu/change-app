import { useState } from 'react'

type Tab = 'hoy' | 'peso' | 'ajustes'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'hoy', label: 'Hoy', icon: '●' },
  { id: 'peso', label: 'Peso', icon: '▲' },
  { id: 'ajustes', label: 'Ajustes', icon: '⚙' },
]

function Placeholder({ title }: { title: string }) {
  return (
    <div className="flex-1 flex items-center justify-center px-6 text-center">
      <div>
        <p className="text-[var(--text-dim)] text-sm">Pantalla</p>
        <h1 className="text-2xl font-semibold text-[var(--text)] mt-1">{title}</h1>
        <p className="text-[var(--text-faint)] text-sm mt-3">Se construye en la siguiente fase.</p>
      </div>
    </div>
  )
}

export default function App() {
  const [tab, setTab] = useState<Tab>('hoy')

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 flex flex-col overflow-y-auto">
        {tab === 'hoy' && <Placeholder title="Hoy" />}
        {tab === 'peso' && <Placeholder title="Peso" />}
        {tab === 'ajustes' && <Placeholder title="Ajustes" />}
      </main>

      <nav className="flex border-t border-[var(--border)] bg-[var(--surface)] pb-[env(safe-area-inset-bottom)]">
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
