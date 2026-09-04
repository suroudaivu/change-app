import { useState } from 'react'

/**
 * Shown for a beat when a gym day is marked. Degrades to nothing if the
 * image isn't there, so a missing file can never break the screen.
 */
export function GymCelebration({ onDone }: { onDone: () => void }) {
  const [failed, setFailed] = useState(false)
  if (failed) return null

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none px-10"
      onAnimationEnd={onDone}
      style={{ animation: 'gym-pop 1.9s ease-out forwards' }}
    >
      <div
        className="rounded-3xl overflow-hidden text-center"
        style={{
          backgroundColor: 'var(--surface)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
          border: '1px solid var(--border)',
        }}
      >
        <img
          src={`${import.meta.env.BASE_URL}gym-cat.png`}
          alt=""
          onError={() => setFailed(true)}
          className="w-56 h-auto block"
        />
        <p className="text-sm font-semibold text-[var(--accent)] py-3">Día de gym ✓</p>
      </div>
    </div>
  )
}
