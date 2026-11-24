import { useEffect, useRef } from 'react'

const Disclosure = ({ className, toggleClassName, label, children, panel }) => {
  const disclosure = useRef(null)

  useEffect(() => {
    const element = disclosure.current
    const dismissOutside = (event) => {
      if (element.open && !element.contains(event.target)) element.open = false
    }
    const dismissOnEscape = (event) => {
      if (event.key !== 'Escape' || !element.open) return
      if (element.contains(document.activeElement)) {
        element.querySelector('summary').focus()
      }
      element.open = false
    }

    document.addEventListener('click', dismissOutside, true)
    document.addEventListener('keydown', dismissOnEscape)
    return () => {
      document.removeEventListener('click', dismissOutside, true)
      document.removeEventListener('keydown', dismissOnEscape)
    }
  }, [])

  return (
    <details className={className} ref={disclosure}>
      <summary className={toggleClassName} aria-label={label}>
        {children}
      </summary>
      {panel}
    </details>
  )
}

export default Disclosure
