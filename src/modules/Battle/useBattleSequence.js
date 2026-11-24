import { useEffect, useState } from 'react'

import { battleSequence } from './cinematic'

export const useBattleSequence = (snapshot, boss) => {
  const [frame, setFrame] = useState({
    snapshot,
    before: null,
    steps: [],
    index: 0,
  })
  if (frame.snapshot !== snapshot) {
    const freshAction =
      frame.snapshot.turn !== snapshot.turn ||
      frame.snapshot.feedback?.revision !== snapshot.feedback?.revision
    if (freshAction) {
      const reduced = window.matchMedia(
        '(prefers-reduced-motion: reduce)'
      ).matches
      const compact = window.matchMedia('(max-width: 600px)').matches
      setFrame({
        snapshot,
        before: frame.snapshot,
        steps: battleSequence(frame.snapshot, snapshot, boss, reduced, compact),
        index: 0,
      })
    } else {
      setFrame({ ...frame, snapshot })
    }
  }

  const step = frame.steps[frame.index]
  useEffect(() => {
    if (step?.duration == null) return
    const timer = window.setTimeout(() => {
      setFrame((current) =>
        current.steps[current.index] === step
          ? { ...current, index: current.index + 1 }
          : current
      )
    }, step.duration)
    return () => window.clearTimeout(timer)
  }, [step])

  return {
    stage:
      step?.stage ?? (frame.before || snapshot.cinematic ? 'complete' : 'idle'),
    before: frame.before,
    pending: !!step,
    skip: () =>
      setFrame((current) => ({ ...current, index: current.steps.length })),
  }
}
