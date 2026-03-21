// app/api/challenges/join/route.ts
// User joins an active or upcoming challenge.
// Inserts a challenge_participants row and increments participant_count.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const JoinSchema = z.object({
    challenge_id: z.string().uuid(),
})

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient()
        const adminClient = createAdminClient()

        // ── Auth check ───────────────────────────────────────────
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // ── Role check — must be a user, not an org ──────────────
        const { data: profile } = await adminClient
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (profile?.role !== 'user') {
            return NextResponse.json({ error: 'Only users can join challenges' }, { status: 403 })
        }

        // ── Validate body ────────────────────────────────────────
        const body = await req.json()
        const parsed = JoinSchema.safeParse(body)

        if (!parsed.success) {
            return NextResponse.json(
                { error: 'Invalid input', details: parsed.error.flatten() },
                { status: 400 }
            )
        }

        const { challenge_id } = parsed.data

        // ── Fetch challenge ──────────────────────────────────────
        const { data: challenge } = await adminClient
            .from('community_challenges')
            .select('id, status, end_date')
            .eq('id', challenge_id)
            .single()

        if (!challenge) {
            return NextResponse.json({ error: 'Challenge not found' }, { status: 404 })
        }

        if (!['active', 'upcoming'].includes(challenge.status)) {
            return NextResponse.json(
                { error: 'Challenge is no longer open to join' },
                { status: 400 }
            )
        }

        if (new Date(challenge.end_date) < new Date()) {
            return NextResponse.json({ error: 'Challenge has expired' }, { status: 400 })
        }

        // ── Check not already joined ─────────────────────────────
        const { data: existing } = await adminClient
            .from('challenge_participants')
            .select('id')
            .eq('challenge_id', challenge_id)
            .eq('user_id', user.id)
            .single()

        if (existing) {
            return NextResponse.json({ error: 'Already joined this challenge' }, { status: 409 })
        }

        // ── Insert participant row ───────────────────────────────
        const { error: joinError } = await adminClient
            .from('challenge_participants')
            .insert({
                challenge_id,
                user_id: user.id,
            })

        if (joinError) {
            // Handle race condition — unique constraint violation means already joined
            if (joinError.code === '23505') {
                return NextResponse.json({ error: 'Already joined this challenge' }, { status: 409 })
            }
            console.error('Join error:', joinError)
            return NextResponse.json({ error: 'Failed to join challenge' }, { status: 500 })
        }

        // ── Increment participant_count ───────────────────────────
        try {
            await adminClient.rpc('increment_challenge_participants', {
                p_challenge_id: challenge_id,
            })
        } catch (error) {
            // Non-fatal — count is cosmetic, can be recalculated
            console.warn('Failed to increment participant_count')
        }

        return NextResponse.json({ success: true }, { status: 201 })

    } catch (err) {
        console.error('Unexpected error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}