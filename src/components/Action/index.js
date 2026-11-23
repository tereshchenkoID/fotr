import { Link } from '@/i18n/navigation'

import style from './index.module.scss'

const Action = ({ children, href, className, variant = 'primary', ...props }) => {
  const classes = [style.block, style[variant], className].filter(Boolean).join(' ')
  if (href)
    return (
      <Link className={classes} href={href} {...props}>
        {children}
      </Link>
    )
  return (
    <button type="button" className={classes} {...props}>
      {children}
    </button>
  )
}

export default Action
