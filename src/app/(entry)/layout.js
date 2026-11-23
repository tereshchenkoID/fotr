import '@/app/[locale]/layout.scss'

import '@fontsource-variable/cinzel'
import '@fontsource-variable/dm-sans'

export default function EntryLayout({ children }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  )
}
