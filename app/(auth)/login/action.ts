'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export type LoginState = {
  errors?: {
    email?: string[]
    password?: string[]
    general?: string[]
  }
}

export async function login(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  // 1. Validate inputs
  const validated = LoginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const { email, password } = validated.data
  const supabase = await createClient()

  // 2. Sign in
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { errors: { general: [error.message] } }
  }

  if (!data.user) {
    return { errors: { general: ['Login failed. Please try again.'] } }
  }

  // 3. Fetch role to redirect to correct dashboard
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .single()

  const role = profile?.role ?? 'user'

  const ROLE_DASHBOARDS = {
    user: '/user/dashboard',
    org: '/org/overview',
    admin: '/admin/dashboard',
  }

  redirect(ROLE_DASHBOARDS[role])
}