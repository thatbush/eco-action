import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'

const CATEGORY_LABELS: Record<string, string> = {
  tree_planting:      '🌳 Tree Planting',
  waste_collection:   '🗑️ Waste Collection',
  recycling:          '♻️ Recycling',
  clean_energy:       '⚡ Clean Energy',
  water_conservation: '💧 Water Conservation',
  other:              '🌿 Other',
}

const PROOF_LABELS: Record<string, string> = {
  photo:       '📷 Photo',
  gps_checkin: '📍 GPS',
  qr_scan:     '🔲 QR Scan',
  receipt:     '🧾 Receipt',
}

export default async function TaskFeedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const adminClient = createAdminClient()

  // Get user's tier
  const { data: userRow } = await adminClient
    .from('users')
    .select('tier_id, current_points')
    .eq('id', user.id)
    .single()

  // Fetch active tasks — filter by tier eligibility
  const { data: tasks } = await adminClient
    .from('tasks')
    .select(`
      id, title, description, category, reward_points,
      proof_type, min_tier_id, max_participants, deadline,
      location_name, created_at,
      organizations (org_name)
    `)
    .eq('status', 'active')
    .or(`min_tier_id.is.null,min_tier_id.lte.${userRow?.tier_id ?? 1}`)
    .gt('deadline', new Date().toISOString())
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Available Tasks</h1>
        <p className="text-sm text-gray-500 mt-1">
          Complete tasks to earn points and make an impact
        </p>
      </div>

      {/* Task list */}
      {!tasks || tasks.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">🌱</p>
          <p className="font-medium">No tasks available yet</p>
          <p className="text-sm mt-1">Check back soon</p>
        </div>
      ) : (
        <div className="space-y-4">
          {tasks.map(task => {
            const deadline = new Date(task.deadline)
            const daysLeft = Math.ceil(
              (deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
            )
            const org = task.organizations as any

            return (
              <Link
                key={task.id}
                href={`/usertasks/${task.id}`}
                className="block rounded-2xl border border-gray-100 bg-white p-5 
                           shadow-sm hover:shadow-md hover:border-green-200 
                           transition-all duration-200"
              >
                {/* Top row */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <span className="text-xs text-gray-400 font-medium">
                      {org?.org_name ?? 'Organization'}
                    </span>
                    <h2 className="font-semibold text-gray-900 mt-0.5 leading-snug">
                      {task.title}
                    </h2>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-bold text-green-600">
                      +{task.reward_points}
                    </p>
                    <p className="text-xs text-gray-400">pts</p>
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-gray-500 line-clamp-2 mb-4">
                  {task.description}
                </p>

                {/* Tags row */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs px-2 py-1 rounded-full bg-green-50 text-green-700">
                    {CATEGORY_LABELS[task.category] ?? task.category}
                  </span>
                  <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                    {PROOF_LABELS[task.proof_type] ?? task.proof_type}
                  </span>
                  {task.location_name && (
                    <span className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-600">
                      📍 {task.location_name}
                    </span>
                  )}
                  {task.max_participants && (
                    <span className="text-xs px-2 py-1 rounded-full bg-orange-50 text-orange-600">
                      👥 {task.max_participants} spots
                    </span>
                  )}
                  <span className={`text-xs px-2 py-1 rounded-full ml-auto font-medium
                    ${daysLeft <= 2
                      ? 'bg-red-50 text-red-600'
                      : daysLeft <= 7
                      ? 'bg-yellow-50 text-yellow-600'
                      : 'bg-gray-100 text-gray-500'}`}>
                    ⏰ {daysLeft}d left
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}