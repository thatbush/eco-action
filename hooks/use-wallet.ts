'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface WalletData {
  current_points: number
  lifetime_points: number
  tier_id: number
  tier_name: string
  tier_color: string
  bonus_percent: number
}

export function useWallet(userId: string) {
  const [wallet, setWallet] = useState<WalletData | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  // Initial fetch
  useEffect(() => {
    if (!userId) return

    async function fetchWallet() {
      const { data, error } = await supabase
        .from('users')
        .select(`
          current_points,
          lifetime_points,
          tier_id,
          tiers (
            name,
            badge_color,
            point_bonus_percent
          )
        `)
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Wallet fetch error:', error)
        return
      }

      if (data) {
        setWallet({
          current_points: data.current_points,
          lifetime_points: data.lifetime_points,
          tier_id: data.tier_id,
          tier_name: (data.tiers as any).name,
          tier_color: (data.tiers as any).badge_color,
          bonus_percent: (data.tiers as any).point_bonus_percent,
        })
      }
      setLoading(false)
    }

    fetchWallet()

    // Real-time subscription — fires whenever the user's row changes
    const channel = supabase
      .channel(`wallet:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${userId}`,
        },
        async (payload) => {
          // Re-fetch to get updated tier info via join
          fetchWallet()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  return { wallet, loading }
}