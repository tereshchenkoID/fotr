import { useEffect, useState } from 'react'

export const useTurnAnimation = (snapshot, turn, getDuration) => {
  const [frame, setFrame] = useState({ snapshot, turn, animation: null })

  // Record the last committed state so holds and boss effects apply to the
  // outgoing frame. Hydrating an existing turn never starts an animation.
  if (frame.snapshot !== snapshot || frame.turn !== turn) {
    let animation = frame.animation
    if (frame.turn !== turn) {
      const duration = turn === frame.turn + 1 ? getDuration(frame.snapshot) : 0
      animation =
        duration &&
        !window.matchMedia('(prefers-reduced-motion: reduce)').matches
          ? { before: frame.snapshot, duration }
          : null
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
