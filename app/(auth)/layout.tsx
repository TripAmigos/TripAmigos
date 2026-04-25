// Force auth pages to render dynamically (not at build time)
// so they don't crash when env vars are absent during `next build`
export const dynamic = 'force-dynamic'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
