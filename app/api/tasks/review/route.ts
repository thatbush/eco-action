import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { submission_id, action, org_id, rejection_reason } = await req.json()

    if (!submission_id || !action || !org_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const adminClient = createAdminClient()

    // Verify org belongs to this user
    const { data: org } = await adminClient
      .from('organizations')
      .select('id')
      .eq('id', org_id)
      .eq('profile_id', user.id)
      .single()

    if (!org) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    // Get the submission + task details
    const { data: submission } = await adminClient
      .from('task_submissions')
      .select(`
        id, status, user_id,
        tasks!inner (id, org_id, reward_points)
      `)
      .eq('id', submission_id)
      .eq('status', 'pending')
      .single()

    if (!submission) {
      return NextResponse.json({
        error: 'Submission not found or already reviewed'
      }, { status: 404 })
    }

    const task = submission.tasks as any

    // Verify task belongs to this org
    if (task.org_id !== org_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    if (action === 'approve') {
      // Release escrow → credit user points
      const { error: releaseError } = await adminClient.rpc('release_escrow', {
        p_task_id: task.id,
        p_org_id: org_id,
        p_user_id: submission.user_id,
        p_amount: task.reward_points,
      })

      if (releaseError) {
        console.error('Release escrow error:', releaseError)
        return NextResponse.json({ error: 'Failed to release points' }, { status: 500 })
      }

      // Update submission status
      await adminClient
        .from('task_submissions')
        .update({
          status: 'approved',
          reviewed_by: org_id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', submission_id)

    } else if (action === 'reject') {
      await adminClient
        .from('task_submissions')
        .update({
          status: 'rejected',
          rejection_reason: rejection_reason ?? null,
          reviewed_by: org_id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', submission_id)
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('review error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}