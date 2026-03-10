import { createBrowserClient } from '@supabase/ssr'

export async function uploadProof(
  file: File,
  userId: string,
  taskId: string
): Promise<{ url: string; error?: string }> {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const ext = file.name.split('.').pop()
  const filename = `${userId}/${taskId}/${Date.now()}.${ext}`

  const { error } = await supabase.storage
    .from('task-proofs')
    .upload(filename, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) return { url: '', error: error.message }

  const { data } = supabase.storage
    .from('task-proofs')
    .getPublicUrl(filename)

  return { url: data.publicUrl }
}