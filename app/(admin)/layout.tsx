import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/login')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin navbar */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🌍</span>
            <span className="font-bold text-gray-900">EcoTrack</span>
            <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 text-xs
                            font-semibold rounded-full">
              Admin
            </span>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <a href="/admin/dashboard"
               className="text-gray-600 hover:text-gray-900 font-medium">
              Dashboard
            </a>
            <a href="/admin/users"
               className="text-gray-600 hover:text-gray-900 font-medium">
              Users
            </a>
            <a href="/admin/organizations"
               className="text-gray-600 hover:text-gray-900 font-medium">
              Organisations
            </a>
            <a href="/admin/audit-logs"
               className="text-gray-600 hover:text-gray-900 font-medium">
              Audit Logs
            </a>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  )
}