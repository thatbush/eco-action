import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'

const CATEGORY_LABELS: Record<string, string> = {
  tree_planting:      '🌱 Tree Planting',
  waste_collection:   '🗑️ Waste Collection',
  recycling:          '♻️ Recycling',
  clean_energy:       '⚡ Clean Energy',
  water_conservation: '💧 Water Conservation',
  other:              '🌍 Other',
}

const PROOF_LABELS: Record<string, string> = {
  photo:       '📷 Photo',
  gps_checkin: '📍 GPS Check-in',
  qr_scan:     '🔲 QR Scan',
  receipt:     '🧾 Receipt',
}

export default async function TaskFeedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const adminClient = createAdminClient()

  const { data: userRow } = await adminClient
    .from('users')
    .select('tier_id, current_points')
    .eq('id', user.id)
    .single()

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
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="page-title">Eco Actions</h1>
        <p className="page-subtitle">Complete tasks or join community challenges to earn points</p>
      </div>

      {/* Tab bar — Tasks is active here, Challenges links out */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
        <span
          className="px-4 py-2 rounded-lg text-sm font-medium
                     bg-white text-green-700 shadow-sm"
        >
          Tasks
        </span>
        <Link
          href="/challenges"
          className="px-4 py-2 rounded-lg text-sm font-medium text-gray-500
                     hover:text-gray-700 transition-colors"
        >
          Challenges
        </Link>
      </div>

      {/* Task list */}
      {!tasks || tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <span className="text-5xl mb-4">🌿</span>
          <h2 className="text-lg font-semibold text-gray-700">No tasks available yet</h2>
          <p className="text-sm text-gray-400 mt-1">Check back soon — new tasks are added regularly.</p>
        </div>
      ) : (
        <div className="space-y-3">
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
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0">
                    <p className="text-xs text-gray-400 font-medium truncate">
                      {org?.org_name ?? 'Organization'}
                    </p>
                    <h2 className="font-semibold text-gray-900 mt-0.5 leading-snug">
                      {task.title}
                    </h2>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-bold text-green-600">+{task.reward_points}</p>
                    <p className="text-xs text-gray-400">pts</p>
                  </div>
                </div>

                <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                  {task.description}
                </p>

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
                      : 'bg-gray-100 text-gray-500'
                    }`}>
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