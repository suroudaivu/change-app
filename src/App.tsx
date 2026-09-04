import { useState } from 'react'
import { CalendarDays, House, Scale, Settings } from 'lucide-react'
import { useAppData } from './useAppData'
import { todayISO } from './storage'
import { Today } from './screens/Today'
import { Ajustes } from './screens/Ajustes'
import { Peso } from './screens/Peso'
import { Historial } from './screens/Historial'
import { UndoToast } from './components/UndoToast'
import { UpdatePrompt } from './components/UpdatePrompt'
import { FloatingNav, type NavTab } from './components/FloatingNav'

type Tab = 'hoy' | 'historial' | 'peso' | 'ajustes'

const TABS: NavTab<Tab>[] = [
  { id: 'hoy', label: 'Hoy', icon: House },
  { id: 'historial', label: 'Historial', icon: CalendarDays },
  { id: 'peso', label: 'Peso', icon: Scale },
  { id: 'ajustes', label: 'Ajustes', icon: Settings },
]

// The floating bar overlaps content, so the scroll area reserves its height
// plus the small gap it sits in — just enough that the last row clears it.
const NAV_CLEARANCE = 72

export default function App() {
  const [tab, setTab] = useState<Tab>('hoy')
  // Lifted so Historial can open a specific day on the Hoy screen.
  const [viewedDate, setViewedDate] = useState(todayISO)
  const { data, update, updateUndoable, undoState, undo } = useAppData()

  function openDay(date: string) {
    setViewedDate(date)
    setTab('hoy')
  }

  return (
    <div className="h-full">
      <main
        className="h-full overflow-y-auto flex flex-col"
        style={{ paddingBottom: `${NAV_CLEARANCE}px` }}
      >
        {tab === 'hoy' && (
          <Today
            data={data}
            update={update}
            updateUndoable={updateUndoable}
            date={viewedDate}
            onDateChange={setViewedDate}
            onGoToBackup={() => setTab('ajustes')}
          />
        )}
        {tab === 'historial' && <Historial data={data} onOpenDay={openDay} />}
        {tab === 'peso' && <Peso data={data} update={update} updateUndoable={updateUndoable} />}
        {tab === 'ajustes' && (
          <Ajustes data={data} update={update} updateUndoable={updateUndoable} />
        )}
      </main>

      {undoState ? (
        <UndoToast message={undoState.message} onUndo={undo} bottomOffset={NAV_CLEARANCE} />
      ) : (
        <UpdatePrompt bottomOffset={NAV_CLEARANCE} />
      )}

      <FloatingNav tabs={TABS} active={tab} onChange={setTab} />
    </div>
  )
}
