import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { WalletCard } from '@/components/wallet/wallet-card'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const adminClient = createAdminClient()

  const { data: profile } = await adminClient
    .from('profiles')
    .select('role, display_name, created_at')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'user') redirect('/login')

  const { data: userRow } = await adminClient
    .from('users')
    .select('current_points, lifetime_points, current_streak, longest_streak, tier_id')
    .eq('id', user.id)
    .single()

  // Fetch task submission progress
  const { data: submissions } = await adminClient
    .from('task_submissions')
    .select('status')
    .eq('user_id', user.id)

  const totalSubmissions  = submissions?.length ?? 0
  const approvedCount     = submissions?.filter(s => s.status === 'approved').length ?? 0
  const pendingCount      = submissions?.filter(s => s.status === 'pending').length ?? 0
  const rejectedCount     = submissions?.filter(s => s.status === 'rejected').length ?? 0

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-KE', {
        month: 'long', year: 'numeric',
      })
    : '—'

  const tierLabels: Record<number, { label: string; color: string; icon: string }> = {
    1: { label: 'Seedling',  color: 'bg-green-100 text-green-700',     icon: '🌱' },
    2: { label: 'Sprout',    color: 'bg-lime-100 text-lime-700',       icon: '🌿' },
    3: { label: 'Guardian',  color: 'bg-yellow-100 text-yellow-700',   icon: '🌳' },
    4: { label: 'Champion',  color: 'bg-orange-100 text-orange-700',   icon: '🌍' },
    5: { label: 'EcoLegend', color: 'bg-emerald-100 text-emerald-700', icon: '🏆' },
  }

  const tier = tierLabels[userRow?.tier_id ?? 1]

  return (
    <div className="hero-section space-y-6">

      {/* Header */}
      <div>
        <div className="hero-title">
          {profile?.display_name?.[0]?.toUpperCase() ?? '?'}
        </div>
        <h1
          className="hero-title"
          style={{ fontSize: 'clamp(2rem, 4vw, 3.2rem)', marginBottom: '8px' }}
        >
          {profile?.display_name ?? 'User'}
        </h1>
        <span className={`inline-block text-xs font-medium px-3 py-1 rounded-full ${tier.color}`}>
          {tier.icon} {tier.label}
        </span>
        <p className="hero-subtitle">Member since {memberSince}</p>
      </div>

      {/* Wallet card — real-time */}
      <WalletCard userId={user.id} />

      {/* Streak cards */}
      <div className="hero-steps-row">
        <div className="hero-step-card-flat active">
          <p className="hero-step-number text-3xl font-bold text-orange-500">
            🔥 {userRow?.current_streak ?? 0}
          </p>
          <p className="text-sm text-gray-500 mt-1">Current Streak</p>
        </div>
        <div className="hero-step-card-flat active">
          <p className="hero-step-number text-3xl font-bold text-orange-400">
            ⚡ {userRow?.longest_streak ?? 0}
          </p>
          <p className="text-sm text-gray-500 mt-1">Longest Streak</p>
        </div>
      </div>

      {/* Task progress */}
      {totalSubmissions > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Task Progress
          </h2>

          {/* Progress bar */}
          <div>
            <div className="flex justify-between text-xs text-gray-400 mb-1.5">
              <span>{approvedCount} completed</span>
              <span>{totalSubmissions} total submitted</span>
            </div>
            <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all duration-500"
                style={{
                  width: `${totalSubmissions > 0
                    ? (approvedCount / totalSubmissions) * 100
                    : 0}%`
                }}
              />
            </div>
          </div>

          {/* Status breakdown */}
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-2 rounded-xl bg-green-50">
              <p className="text-lg font-bold text-green-600">{approvedCount}</p>
              <p className="text-xs text-gray-400 mt-0.5">Approved</p>
            </div>
            <div className="text-center p-2 rounded-xl bg-yellow-50">
              <p className="text-lg font-bold text-yellow-500">{pendingCount}</p>
              <p className="text-xs text-gray-400 mt-0.5">Pending</p>
            </div>
            <div className="text-center p-2 rounded-xl bg-red-50">
              <p className="text-lg font-bold text-red-400">{rejectedCount}</p>
              <p className="text-xs text-gray-400 mt-0.5">Rejected</p>
            </div>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="space-y-3">
        <Link
          href="/usertasks"
          className="flex items-center justify-between w-full px-5 py-4
                     rounded-2xl bg-green-600 text-white font-semibold
                     hover:bg-green-700 transition-colors shadow-sm"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">🌍</span>
            <div className="text-left">
              <p className="font-semibold">Explore Tasks</p>
              <p className="text-xs text-green-200 font-normal">
                Find eco tasks near you
              </p>
            </div>
          </div>
          <span className="text-green-200">→</span>
        </Link>

        
      </div>

    </div>
  )
}