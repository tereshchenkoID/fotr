import { createNavigation } from 'next-intl/navigation'

import { routing } from './routing.js'

export const { Link, usePathname, useRouter } = createNavigation(routing)
