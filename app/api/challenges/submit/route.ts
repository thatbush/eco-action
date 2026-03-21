// app/api/challenges/submit/route.ts
// User submits proof for a challenge they have joined.
// Uploads proof image to Supabase Storage, inserts challenge_submissions row.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const SubmitSchema = z.object({
  challenge_id: z.string().uuid(),
  contribution: z.number().positive(), // amount contributed toward target
  proof_metadata: z.object({           // client-collected metadata
    lat:          z.number().optional(),
    lng:          z.number().optional(),
    captured_at:  z.string().optional(),
    notes:        z.string().max(500).optional(),
  }).optional(),
})

export async function POST(req: NextRequest) {
  try {
    const supabase    = await createClient()
    const adminClient = createAdminClient()

    // ── Auth check ───────────────────────────────────────────
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ── Parse multipart form (proof image + JSON fields) ─────
    const formData     = await req.formData()
    const file         = formData.get('proof') as File | null
    const jsonStr      = formData.get('data') as string | null

    if (!file) {
      return NextResponse.json({ error: 'Proof image is required' }, { status: 400 })
    }

    if (!jsonStr) {
      return NextResponse.json({ error: 'Submission data is required' }, { status: 400 })
    }

    // ── Validate JSON fields ─────────────────────────────────
    let parsedData: z.infer<typeof SubmitSchema>
    try {
      parsedData = SubmitSchema.parse(JSON.parse(jsonStr))
    } catch {
      return NextResponse.json({ error: 'Invalid submission data' }, { status: 400 })
    }

    const { challenge_id, contribution, proof_metadata } = parsedData

    // ── Verify challenge is active ───────────────────────────
    const { data: challenge } = await adminClient
      .from('community_challenges')
      .select('id, status, end_date, target_unit')
      .eq('id', challenge_id)
      .single()

    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 })
    }

    if (challenge.status !== 'active') {
      return NextResponse.json({ error: 'Challenge is not active' }, { status: 400 })
    }

    if (new Date(challenge.end_date) < new Date()) {
      return NextResponse.json({ error: 'Challenge has expired' }, { status: 400 })
    }

    // ── Verify user has joined this challenge ────────────────
    const { data: participant } = await adminClient
      .from('challenge_participants')
      .select('id')
      .eq('challenge_id', challenge_id)
      .eq('user_id', user.id)
      .single()

    if (!participant) {
      return NextResponse.json(
        { error: 'You must join the challenge before submitting' },
        { status: 403 }
      )
    }

    // ── Upload proof image to Supabase Storage ───────────────
    const fileExt     = file.name.split('.').pop() ?? 'jpg'
    const fileName    = `${challenge_id}/${user.id}/${Date.now()}.${fileExt}`
    const arrayBuffer = await file.arrayBuffer()

    const { error: uploadError } = await adminClient
      .storage
      .from('challenge-proofs')
      .upload(fileName, arrayBuffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to upload proof image' }, { status: 500 })
    }

    // ── Get public URL ───────────────────────────────────────
    const { data: { publicUrl } } = adminClient
      .storage
      .from('challenge-proofs')
      .getPublicUrl(fileName)

    // ── Insert submission row ────────────────────────────────
    const { data: submission, error: insertError } = await adminClient
      .from('challenge_submissions')
      .insert({
        challenge_id,
        user_id:        user.id,
        proof_url:      publicUrl,
        proof_metadata: proof_metadata ?? {},
        contribution,
        status:         'pending',
      })
      .select()
      .single()

    if (insertError) {
      console.error('Submission insert error:', insertError)
      return NextResponse.json({ error: 'Failed to record submission' }, { status: 500 })
    }

    return NextResponse.json({ success: true, submission }, { status: 201 })

  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}