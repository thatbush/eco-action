import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function OrgOverviewPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const adminClient = createAdminClient()

  const { data: org } = await adminClient
    .from('organizations')
    .select('id, org_name, contact_email, description, verification_status, created_at, points_balance, escrow_balance')
    .eq('profile_id', user.id)
    .single()

  if (!org) redirect('/login')

  // Fetch quick stats
  const { count: totalTasks } = await adminClient
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', org.id)
    .eq('status', 'active')

  const { count: pendingReviews } = await adminClient
    .from('task_submissions')
    .select('*, tasks!inner(org_id)', { count: 'exact', head: true })
    .eq('tasks.org_id', org.id)
    .eq('status', 'pending')

  const statusStyles: Record<string, { label: string; color: string }> = {
    pending:  { label: 'Pending Review', color: 'bg-yellow-100 text-yellow-700' },
    verified: { label: 'Verified',       color: 'bg-green-100 text-green-700' },
    rejected: { label: 'Rejected',       color: 'bg-red-100 text-red-700' },
  }

  const status = statusStyles[org.verification_status] ?? statusStyles.pending
  const isVerified = org.verification_status === 'verified'

  const memberSince = new Date(org.created_at).toLocaleDateString('en-KE', {
    month: 'long', year: 'numeric'
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">

        {/* Header card */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-green-600 flex items-center 
                            justify-center text-white text-2xl font-bold shrink-0">
              {org.org_name[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-gray-900 truncate">
                {org.org_name}
              </h1>
              <p className="text-xs text-gray-400 mt-0.5">Since {memberSince}</p>
            </div>
            <span className={`text-xs font-medium px-3 py-1 rounded-full shrink-0 ${status.color}`}>
              {status.label}
            </span>
          </div>

          {org.description && (
            <p className="text-sm text-gray-500 mt-4 leading-relaxed">
              {org.description}
            </p>
          )}
        </div>

        {/* Pending notice */}
        {org.verification_status === 'pending' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <p className="text-sm font-medium text-yellow-800">
              ⏳ Awaiting admin approval
            </p>
            <p className="text-xs text-yellow-700 mt-1">
              Your organisation is under review. You will be notified once approved.
            </p>
          </div>
        )}

        {/* Points summary — only if verified */}
        {isVerified && (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
              <p className="text-xs text-gray-400 mb-1">Available Points</p>
              <p className="text-2xl font-bold text-green-600">
                {org.points_balance.toLocaleString()}
              </p>
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
              <p className="text-xs text-gray-400 mb-1">In Escrow</p>
              <p className="text-2xl font-bold text-orange-500">
                {org.escrow_balance.toLocaleString()}
              </p>
            </div>
          </div>
        )}

        {/* Stats row — only if verified */}
        {isVerified && (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm 
                            flex items-center gap-3">
              <span className="text-2xl">📋</span>
              <div>
                <p className="text-xl font-bold text-gray-900">{totalTasks ?? 0}</p>
                <p className="text-xs text-gray-400">Active Tasks</p>
              </div>
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm 
                            flex items-center gap-3">
              <span className="text-2xl">⏳</span>
              <div>
                <p className="text-xl font-bold text-gray-900">{pendingReviews ?? 0}</p>
                <p className="text-xs text-gray-400">Pending Reviews</p>
              </div>
            </div>
          </div>
        )}

        {/* Action buttons — only if verified */}
        {isVerified && (
          <div className="space-y-3">
            <Link
              href="/tasks/new"
              className="flex items-center justify-between w-full px-5 py-4 
                         rounded-2xl bg-green-600 text-white font-semibold 
                         hover:bg-green-700 transition-colors shadow-sm"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">🌱</span>
                <div className="text-left">
                  <p className="font-semibold">Create New Task</p>
                  <p className="text-xs text-green-200 font-normal">
                    Post an eco task for users
                  </p>
                </div>
              </div>
              <span className="text-green-200">→</span>
            </Link>

            <Link
              href="/submissions"
              className="flex items-center justify-between w-full px-5 py-4 
                         rounded-2xl bg-white border border-gray-100 text-gray-900 
                         font-semibold hover:border-green-300 hover:bg-green-50 
                         transition-colors shadow-sm"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">📥</span>
                <div className="text-left">
                  <p className="font-semibold">Review Submissions</p>
                  <p className="text-xs text-gray-400 font-normal">
                    {pendingReviews
                      ? `${pendingReviews} awaiting your review`
                      : 'No pending reviews'}
                  </p>
                </div>
              </div>
              <span className="text-gray-300">→</span>
            </Link>
          </div>
        )}

        {/* Contact */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">
            Contact Email
          </p>
          <p className="text-sm text-gray-800">{org.contact_email}</p>
        </div>

      </div>
    </div>
  )
}