import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Get org for this user
    const adminClient = createAdminClient()
    const { data: org } = await adminClient
      .from('organizations')
      .select('id, points_balance, verification_status')
      .eq('profile_id', user.id)
      .single()

    if (!org) return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    if (org.verification_status !== 'verified') {
      return NextResponse.json({ error: 'Organization not verified' }, { status: 403 })
    }

    const body = await req.json()
    const {
      title, description, category, proof_type,
      location_name, location_lat, location_lng, location_radius_km,
      reward_points, max_participants, min_tier_id, deadline
    } = body

    // Calculate escrow amount
    const escrow_amount = max_participants
      ? reward_points * max_participants
      : reward_points

    if (org.points_balance < escrow_amount) {
      return NextResponse.json({
        error: `Insufficient points. Need ${escrow_amount} pts, have ${org.points_balance} pts.`
      }, { status: 400 })
    }

    // Build location geography string if coordinates provided
    const locationValue = location_lat && location_lng
      ? `POINT(${location_lng} ${location_lat})`
      : null

    // Insert task as draft first
    const { data: task, error: taskError } = await adminClient
      .from('tasks')
      .insert({
        org_id: org.id,
        title,
        description,
        category,
        proof_type,
        location_name,
        location: locationValue,
        location_radius_km,
        reward_points,
        max_participants: max_participants || null,
        min_tier_id: min_tier_id || null,
        deadline,
        status: 'draft',
      })
      .select()
      .single()

    if (taskError) {
      console.error('Task insert error:', taskError)
      return NextResponse.json({ error: taskError.message }, { status: 500 })
    }

    // Lock points in escrow
    const { error: escrowError } = await adminClient.rpc('escrow_points', {
      p_org_id: org.id,
      p_task_id: task.id,
      p_amount: escrow_amount,
    })

    if (escrowError) {
      // Rollback — delete the task we just created
      await adminClient.from('tasks').delete().eq('id', task.id)
      console.error('Escrow error:', escrowError)
      return NextResponse.json({ error: 'Failed to lock escrow' }, { status: 500 })
    }

    // Activate the task
    await adminClient
      .from('tasks')
      .update({ status: 'active' })
      .eq('id', task.id)

    return NextResponse.json({ ok: true, task_id: task.id })
  } catch (err) {
    console.error('create task error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}