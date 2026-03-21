'use client'

import { useWallet } from '@/hooks/use-wallet'
import { TrendingUp } from 'lucide-react'

interface WalletCardProps {
  userId: string
}

const TIER_THRESHOLDS: Record<number, number> = {
  1: 1000,
  2: 5000,
  3: 15000,
  4: 40000,
  5: 40000,
}

export function WalletCard({ userId }: WalletCardProps) {
  const { wallet, loading } = useWallet(userId)

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-4 w-24 bg-gray-200 rounded" />
        <div className="h-8 w-32 bg-gray-200 rounded" />
        <div className="h-3 w-full bg-gray-200 rounded" />
      </div>
    )
  }

  if (!wallet) return null

  const nextThreshold  = TIER_THRESHOLDS[wallet.tier_id] ?? 40000
  const prevThreshold  = [0, 0, 1000, 5000, 15000, 40000][wallet.tier_id] ?? 0
  const progressPercent = wallet.tier_id === 5 ? 100 : Math.min(
    ((wallet.lifetime_points - prevThreshold) / (nextThreshold - prevThreshold)) * 100,
    100
  )

  return (
    <div className="space-y-4">

      {/* Current points */}
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">
          Available Points
        </p>
        <p className="text-3xl font-bold text-gray-900">
          {wallet.current_points.toLocaleString()}
        </p>
        {wallet.bonus_percent > 0 && (
          <p className="text-xs text-green-600 font-medium mt-0.5">
            +{wallet.bonus_percent}% point bonus active
          </p>
        )}
      </div>

      {/* Lifetime + tier progress */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>{wallet.lifetime_points.toLocaleString()} lifetime pts</span>
          </div>
          {wallet.tier_id < 5 && (
            <span>{nextThreshold.toLocaleString()} for next tier</span>
          )}
        </div>

        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${progressPercent}%`, backgroundColor: wallet.tier_color }}
          />
        </div>

        {wallet.tier_id === 5 && (
          <p className="text-xs text-center font-medium" style={{ color: wallet.tier_color }}>
            Maximum tier reached 🎉
          </p>
        )}
      </div>

    </div>
  )
}