import { useCallback, useEffect, useRef, useState } from 'react'
import type { AppData } from './types'
import { loadData, saveData } from './storage'

const UNDO_WINDOW_MS = 6000

export interface UndoState {
  message: string
  snapshot: AppData
}

/**
 * Single source of truth for the app's data, backed by localStorage.
 * `update` takes a function so callers always work off the latest state.
 */
export function useAppData() {
  const [data, setData] = useState<AppData>(() => loadData())
  const [undoState, setUndoState] = useState<UndoState | null>(null)
  const timerRef = useRef<number | undefined>(undefined)

  const update = useCallback((fn: (current: AppData) => AppData) => {
    setData((current) => {
      const next = fn(current)
      saveData(next)
      return next
    })
  }, [])

  /** Like `update`, but keeps a snapshot so the change can be undone from a
   * toast for a few seconds — used for destructive actions, which are far
   * more common here than they are risky enough to warrant a dialog. */
  const updateUndoable = useCallback(
    (fn: (current: AppData) => AppData, message: string) => {
      setData((current) => {
        const next = fn(current)
        saveData(next)
        setUndoState({ message, snapshot: current })
        return next
      })
    },
    [],
  )

  const undo = useCallback(() => {
    setUndoState((state) => {
      if (state) {
        saveData(state.snapshot)
        setData(state.snapshot)
      }
      return null
    })
  }, [])

  const dismissUndo = useCallback(() => setUndoState(null), [])

  useEffect(() => {
    if (!undoState) return
    window.clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(() => setUndoState(null), UNDO_WINDOW_MS)
    return () => window.clearTimeout(timerRef.current)
  }, [undoState])

  return { data, update, updateUndoable, undoState, undo, dismissUndo }
}
