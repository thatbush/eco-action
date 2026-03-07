import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'

export default async function OrgOverviewPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const adminClient = createAdminClient()

  const { data: org } = await adminClient
    .from('organizations')
    .select('org_name, contact_email, description, verification_status, created_at')
    .eq('profile_id', user.id)
    .single()

  if (!org) redirect('/login')

  const statusStyles: Record<string, { label: string; color: string }> = {
    pending:  { label: 'Pending Review', color: 'bg-yellow-100 text-yellow-700' },
    verified: { label: 'Verified',       color: 'bg-green-100 text-green-700' },
    rejected: { label: 'Rejected',       color: 'bg-red-100 text-red-700' },
  }

  const status = statusStyles[org.verification_status] ?? statusStyles.pending

  const memberSince = new Date(org.created_at).toLocaleDateString('en-KE', {
    month: 'long', year: 'numeric'
  })

  return (
    <div className="hero-root hero-section space-y-8">

      {/* Header card */}
      <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center space-y-3">
        <div className="hero-title" style={{ fontSize: 'clamp(2rem, 4vw, 3.2rem)', marginBottom: '8px' }}>
          {org.org_name[0].toUpperCase()}
        </div>
        <h1 className="text-2xl font-bold text-gray-900">{org.org_name}</h1>
        <span className={`inline-block text-xs font-medium px-3 py-1 rounded-full ${status.color}`}>
          {status.label}
        </span>
        <p className="text-sm text-gray-400">Registered {memberSince}</p>
      </div>

      {/* Details card */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
          Organisation Details
        </h2>

        <div className="space-y-3">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">
              Contact Email
            </p>
            <p className="text-sm text-gray-800">{org.contact_email}</p>
          </div>

          {org.description && (
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">
                Description
              </p>
              <p className="text-sm text-gray-800 leading-relaxed">{org.description}</p>
            </div>
          )}
        </div>
      </div>

      {/* Pending notice */}
      {org.verification_status === 'pending' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800">
          <p className="font-medium">Awaiting admin approval</p>
          <p className="mt-1 text-yellow-700">
            Your organisation is under review. You will be notified by email once a decision has been made.
          </p>
        </div>
      )}
    </div>
  )
}