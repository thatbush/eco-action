'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const RegisterUserSchema = z.object({
  display_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export type RegisterUserState = {
  errors?: {
    display_name?: string[]
    email?: string[]
    password?: string[]
    general?: string[]
  }
  success?: boolean
}

export async function registerUser(
  _prevState: RegisterUserState,
  formData: FormData
): Promise<RegisterUserState> {
  const validated = RegisterUserSchema.safeParse({
    display_name: formData.get('display_name'),
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const { display_name, email, password } = validated.data
  const adminClient = createAdminClient()

  // 1. Create auth user synchronously via admin
  const { data: authData, error: authError } =
    await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: false, // sends confirmation email
      user_metadata: { display_name },
    })

  if (authError) {
    if (authError.message.includes('already registered')) {
      return { errors: { email: ['This email is already registered'] } }
    }
    return { errors: { general: [authError.message] } }
  }

  if (!authData.user) {
    return { errors: { general: ['Failed to create account. Please try again.'] } }
  }

  const userId = authData.user.id

  // 2. Upsert profiles row — auth user is fully committed so FK passes
  const { error: profileError } = await adminClient
    .from('profiles')
    .upsert(
      { id: userId, role: 'user' as const, display_name },
      { onConflict: 'id' }
    )

  if (profileError) {
    await adminClient.auth.admin.deleteUser(userId)
    return { errors: { general: [profileError.message] } }
  }

  // 3. Create users row
  const { error: userRowError } = await adminClient
    .from('users')
    .insert({ id: userId })

  if (userRowError) {
    await adminClient.auth.admin.deleteUser(userId)
    return { errors: { general: [userRowError.message] } }
  }

  redirect('/register/user/verify-email')
}