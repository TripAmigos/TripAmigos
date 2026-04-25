import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Logo } from '@/components/Logo'
import Link from 'next/link'
import { LogOut, Menu, Settings } from 'lucide-react'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const handleLogout = async () => {
    'use server'
    const supabaseLogout = await createClient()
    await supabaseLogout.auth.signOut()
    redirect('/')
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Top Navigation */}
      <nav className="border-b border-border bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Logo size="md" linkTo="/dashboard" />

          <div className="flex items-center gap-4">
            <Link
              href="/trips/create"
              className="px-4 py-2 bg-accent text-white rounded-input font-medium hover:bg-accent-hover transition-colors text-sm"
            >
              + New trip
            </Link>

            {/* User Menu */}
            <details className="relative">
              <summary className="list-none cursor-pointer flex items-center gap-2 py-2 px-3 rounded-input hover:bg-bg-soft transition-colors">
                <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  {user.email?.[0].toUpperCase()}
                </div>
                <Menu size={20} className="text-text-secondary" />
              </summary>

              <div className="absolute right-0 mt-2 w-48 bg-white border border-border rounded-card shadow-lg overflow-hidden">
                <div className="px-4 py-3 border-b border-border">
                  <p className="text-sm font-medium text-primary">
                    {user.user_metadata?.full_name || user.email}
                  </p>
                  <p className="text-xs text-text-secondary">{user.email}</p>
                </div>

                <Link
                  href="/settings"
                  className="w-full px-4 py-2 text-left text-sm text-primary hover:bg-bg-soft flex items-center gap-2 transition-colors"
                >
                  <Settings size={16} />
                  Settings
                </Link>

                <form action={handleLogout}>
                  <button
                    type="submit"
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                  >
                    <LogOut size={16} />
                    Sign out
                  </button>
                </form>
              </div>
            </details>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
