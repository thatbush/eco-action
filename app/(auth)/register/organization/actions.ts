'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const RegisterOrgSchema = z.object({
  org_name: z.string().min(2, 'Organisation name is required'),
  contact_email: z.string().email('Invalid email address'),
  kra_pin: z.string().min(11, 'Enter a valid KRA PIN').max(11),
  description: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export type RegisterOrgState = {
  errors?: {
    org_name?: string[]
    contact_email?: string[]
    kra_pin?: string[]
    description?: string[]
    password?: string[]
    general?: string[]
  }
  success?: boolean
}

export async function registerOrganization(
  _prevState: RegisterOrgState,
  formData: FormData
): Promise<RegisterOrgState> {
  const validated = RegisterOrgSchema.safeParse({
    org_name: formData.get('org_name'),
    contact_email: formData.get('contact_email'),
    kra_pin: formData.get('kra_pin'),
    description: formData.get('description'),
    password: formData.get('password'),
  })

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const { org_name, contact_email, kra_pin, description, password } =
    validated.data

  const adminClient = createAdminClient()

  // 1. Create auth user via admin — fully synchronous, no timing issues
  const { data: authData, error: authError } =
    await adminClient.auth.admin.createUser({
      email: contact_email,
      password,
      email_confirm: true, // skip email confirmation for orgs
      user_metadata: { display_name: org_name },
    })

  if (authError) {
    if (authError.message.includes('already registered')) {
      return { errors: { contact_email: ['This email is already registered'] } }
    }
    return { errors: { general: [authError.message] } }
  }

  if (!authData.user) {
    return { errors: { general: ['Failed to create account. Please try again.'] } }
  }

  const userId = authData.user.id

  // 2. Upsert profiles row with role = 'org'
  // auth user is fully committed so FK constraint will pass
  const { error: profileError } = await adminClient
    .from('profiles')
    .upsert(
      {
        id: userId,
        role: 'org' as const,
        display_name: org_name,
      },
      { onConflict: 'id' }
    )

  if (profileError) {
    // Clean up auth user if profile fails
    await adminClient.auth.admin.deleteUser(userId)
    return { errors: { general: [profileError.message] } }
  }

  // 3. Insert organizations row
  const { error: orgError } = await adminClient
    .from('organizations')
    .insert({
      profile_id: userId,
      org_name,
      contact_email,
      kra_pin,
      description: description ?? null,
    })

  if (orgError) {
    // Clean up both rows if org insert fails
    await adminClient.auth.admin.deleteUser(userId)
    if (orgError.code === '23505') {
      return { errors: { kra_pin: ['This KRA PIN is already registered'] } }
    }
    return { errors: { general: [orgError.message] } }
  }

  redirect('/login?message=Registration submitted. Await admin approval.')
}