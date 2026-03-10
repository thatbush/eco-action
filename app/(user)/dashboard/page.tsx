import { WalletCard } from '@/components/wallet/wallet-card'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function UserDashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in')

  // Check role before rendering wallet
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'user') {
    redirect('/sign-in') // or redirect to their correct dashboard
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Wallet</h1>
      <WalletCard userId={user.id} />
    </div>
  )
}