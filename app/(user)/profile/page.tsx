import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'

export default async function ProfilePage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const adminClient = createAdminClient()

    const { data: profile } = await adminClient
        .from('profiles')
        .select('display_name, created_at')
        .eq('id', user.id)
        .single()

    const { data: userRow } = await adminClient
        .from('users')
        .select('current_points, lifetime_points, current_streak, longest_streak, tier_id')
        .eq('id', user.id)
        .single()

    const memberSince = profile?.created_at
        ? new Date(profile.created_at).toLocaleDateString('en-KE', {
            month: 'long', year: 'numeric'
        })
        : '—'

    const tierLabels: Record<number, { label: string; color: string; icon: string }> = {
  1: { label: 'Seedling',    color: 'bg-green-100 text-green-700',   icon: '🌱' },
  2: { label: 'Sprout',      color: 'bg-lime-100 text-lime-700',     icon: '🌿' },
  3: { label: 'Grower',      color: 'bg-yellow-100 text-yellow-700', icon: '🌳' },
  4: { label: 'Sustainer',   color: 'bg-orange-100 text-orange-700', icon: '🌍' },
  5: { label: 'EcoChampion', color: 'bg-emerald-100 text-emerald-700', icon: '🏆' },
}

    const tier = tierLabels[userRow?.tier_id ?? 1]

    return (
        <div className="hero-section">
            {/* Header card */}
            <div >
                <div className="hero-title">
                    {profile?.display_name?.[0]?.toUpperCase() ?? '?'}
                </div>
                <h1 className="hero-title" style={{ fontSize: 'clamp(2rem, 4vw, 3.2rem)', marginBottom: '8px' }}>
            
                    {profile?.display_name ?? 'User'}
                </h1>
                <span className={`inline-block text-xs font-medium px-3 py-1 translate-x-15 rounded-full ${tier.color}`}>
                    {tier.label}
                </span>
                <p className="hero-subtitle">Member since {memberSince}</p>
            </div>

            {/* Stats grid */}
            <div className="hero-steps-row translate-x-15" style={{ marginTop: '2rem' }}>
                <div className="hero-step-card-flat active">
                    <p className="hero-step-number text-3xl font-bold text-green-600">
                        {userRow?.current_points ?? 0}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">Current Points</p>
                </div>
                <div className="hero-step-card-flat active">
                    <p className="hero-step-number text-3xl font-bold text-green-600">
                        {userRow?.lifetime_points ?? 0}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">Lifetime Points</p>
                </div>
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
            </div>
    )
}