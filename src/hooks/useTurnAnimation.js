import { useEffect, useState } from 'react'

export const shouldAnimateTurn = (previous, current, allowJump, reduced) =>
  !reduced && (allowJump ? current > previous : current === previous + 1)

export const useTurnAnimation = (snapshot, turn, getDuration, allowJump = false) => {
  const [frame, setFrame] = useState({ snapshot, turn, animation: null })

  // Record the last committed state so holds and boss effects apply to the
  // outgoing frame. Hydrating an existing turn never starts an animation.
  if (frame.snapshot !== snapshot || frame.turn !== turn) {
    let animation = frame.animation
    if (frame.turn !== turn) {
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const duration = shouldAnimateTurn(frame.turn, turn, allowJump, reduced)
        ? getDuration(frame.snapshot, snapshot)
        : 0
      animation = duration ? { before: frame.snapshot, duration } : null
    }
    setFrame({ snapshot, turn, animation })
  }

  const { animation } = frame
  useEffect(() => {
    if (!animation) return
    const timeout = window.setTimeout(() => {
      setFrame((current) =>
        current.animation === animation
          ? { ...current, animation: null }
          : current
      )
    }, animation.duration)
    return () => window.clearTimeout(timeout)
  }, [animation])

  return animation?.before ?? null
}
