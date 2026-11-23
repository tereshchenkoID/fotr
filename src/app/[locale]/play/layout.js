import PlayShell from '@/widgets/PlayShell'

export const metadata = { robots: { index: false, follow: false } }

export default function PlayLayout({ children }) {
  return <PlayShell>{children}</PlayShell>
}
