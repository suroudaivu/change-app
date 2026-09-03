import { useState } from 'react'
import { House, Scale, Settings } from 'lucide-react'
import { useAppData } from './useAppData'
import { Today } from './screens/Today'
import { Ajustes } from './screens/Ajustes'
import { Peso } from './screens/Peso'
import { UndoToast } from './components/UndoToast'
import { UpdatePrompt } from './components/UpdatePrompt'
import { FloatingNav, type NavTab } from './components/FloatingNav'

type Tab = 'hoy' | 'peso' | 'ajustes'

const TABS: NavTab<Tab>[] = [
  { id: 'hoy', label: 'Hoy', icon: House },
  { id: 'peso', label: 'Peso', icon: Scale },
  { id: 'ajustes', label: 'Ajustes', icon: Settings },
]

// The floating bar overlaps content, so the scroll area reserves its height
// plus the small gap it sits in — just enough that the last row clears it.
const NAV_CLEARANCE = 72

export default function App() {
  const [tab, setTab] = useState<Tab>('hoy')
  const { data, update, updateUndoable, undoState, undo } = useAppData()

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
            onGoToBackup={() => setTab('ajustes')}
          />
        )}
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
