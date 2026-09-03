import { useCallback, useState } from 'react'
import type { AppData } from './types'
import { loadData, saveData } from './storage'

/**
 * Single source of truth for the app's data, backed by localStorage.
 * `update` takes a function so callers always work off the latest state.
 */
export function useAppData() {
  const [data, setData] = useState<AppData>(() => loadData())

  const update = useCallback((fn: (current: AppData) => AppData) => {
    setData((current) => {
      const next = fn(current)
      saveData(next)
      return next
    })
  }, [])

  return { data, update }
}
