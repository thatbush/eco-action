import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { task_id, proof_url, proof_metadata } = await req.json()

    if (!task_id || !proof_url) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const adminClient = createAdminClient()

    // Verify task exists and is active
    const { data: task } = await adminClient
      .from('tasks')
      .select('id, status, min_tier_id, deadline, org_id')
      .eq('id', task_id)
      .eq('status', 'active')
      .single()

    if (!task) {
      return NextResponse.json({ error: 'Task not found or no longer active' }, { status: 404 })
    }

    // Check deadline hasn't passed
    if (new Date(task.deadline) < new Date()) {
      return NextResponse.json({ error: 'Task deadline has passed' }, { status: 400 })
    }

    // Check user meets tier requirement
    if (task.min_tier_id) {
      const { data: userRow } = await adminClient
        .from('users')
        .select('tier_id')
        .eq('id', user.id)
        .single()

      if (!userRow || userRow.tier_id < task.min_tier_id) {
        return NextResponse.json({
          error: 'You do not meet the tier requirement for this task'
        }, { status: 403 })
      }
    }

    // Check for duplicate submission
    const { data: existing } = await adminClient
      .from('task_submissions')
      .select('id')
      .eq('task_id', task_id)
      .eq('user_id', user.id)
      .single()

    if (existing) {
      return NextResponse.json({
        error: 'You have already submitted proof for this task'
      }, { status: 409 })
    }

    // Insert submission
    const { error: insertError } = await adminClient
      .from('task_submissions')
      .insert({
        task_id,
        user_id: user.id,
        proof_url,
        proof_metadata,
        status: 'pending',
      })

    if (insertError) {
      console.error('Submission insert error:', insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('submit proof error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}