import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { userId, display_name } = body

        if (!userId || !display_name) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const adminClient = createAdminClient()

        // 1. Handle profile — create or fix if exists with wrong role
        const { data: existing } = await adminClient
            .from('profiles')
            .select('id, role')
            .eq('id', userId)
            .single()

        if (!existing) {
            const { error: profileError } = await adminClient
                .from('profiles')
                .insert({ id: userId, role: 'user', display_name })

            if (profileError) {
                console.error('❌ profile insert failed:', profileError.message)
                return NextResponse.json({ error: profileError.message }, { status: 500 })
            }
            console.log('✅ profile created with role: user')
        } else if (existing.role !== 'user') {
            const { error: updateError } = await adminClient
                .from('profiles')
                .update({ role: 'user', display_name })
                .eq('id', userId)

            if (updateError) {
                console.error('❌ profile role update failed:', updateError.message)
                return NextResponse.json({ error: updateError.message }, { status: 500 })
            }
            console.log('✅ profile role corrected to: user')
        }

        // 2. Handle users row — idempotent
        const { data: existingUser } = await adminClient
            .from('users')
            .select('id')
            .eq('id', userId)
            .single()

        if (!existingUser) {
            const { error: userRowError } = await adminClient
                .from('users')
                .insert({ id: userId })

            if (userRowError) {
                console.error('❌ users row insert failed:', userRowError.message)
                return NextResponse.json({ error: userRowError.message }, { status: 500 })
            }
            console.log('✅ users row created')
        }

        return NextResponse.json({ ok: true })
    } catch (err) {
        console.error('register-user error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}