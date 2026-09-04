import { useEffect, useState } from 'react'

/**
 * How much of the layout viewport the on-screen keyboard is covering.
 *
 * iOS shrinks the *visual* viewport when the keyboard opens but leaves the
 * layout viewport alone, so a `position: fixed` bottom sheet stays anchored
 * under the keyboard instead of above it. Tracking visualViewport lets a
 * sheet lift itself clear.
 */
export function useKeyboardInset(): number {
  const [inset, setInset] = useState(0)

  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return

    const update = () => {
      setInset(Math.max(0, window.innerHeight - vv.height - vv.offsetTop))
    }

    update()
    vv.addEventListener('resize', update)
    vv.addEventListener('scroll', update)
    return () => {
      vv.removeEventListener('resize', update)
      vv.removeEventListener('scroll', update)
    }
  }, [])

  return inset
}
