'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  submissionId: string
}

export function ChallengeReviewButton({ submissionId }: Props) {
  const router = useRouter()

  const [pending,          setPending]          = useState(false)
  const [showRejectInput,  setShowRejectInput]  = useState(false)
  const [rejectionReason,  setRejectionReason]  = useState('')
  const [error,            setError]            = useState('')
  const [targetMet,        setTargetMet]        = useState(false)

  async function submit(decision: 'approved' | 'rejected') {
    if (decision === 'rejected' && !showRejectInput) {
      setShowRejectInput(true)
      return
    }

    setPending(true)
    setError('')

    const res  = await fetch('/api/challenges/review', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        submission_id:    submissionId,
        decision,
        rejection_reason: decision === 'rejected' ? rejectionReason : undefined,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Something went wrong')
      setPending(false)
      return
    }

    if (data.target_met) {
      setTargetMet(true)
      setTimeout(() => router.refresh(), 2000)
    } else {
      router.refresh()
    }
  }

  if (targetMet) {
    return (
      <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
        <p className="text-sm font-semibold text-emerald-700">
          🎉 Challenge target reached! Rewards are being distributed.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}

      {showRejectInput && (
        <div className="space-y-2">
          <textarea
            className="input h-20 resize-none text-sm"
            placeholder="Reason for rejection (optional but helpful for the participant)..."
            value={rejectionReason}
            onChange={e => setRejectionReason(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowRejectInput(false)}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            Cancel rejection
          </button>
        </div>
      )}

      <div className="flex gap-2">
        {/* Approve */}
        {!showRejectInput && (
          <button
            type="button"
            onClick={() => submit('approved')}
            disabled={pending}
            className="flex-1 py-2 rounded-xl bg-green-600 text-white text-sm
                       font-semibold hover:bg-green-700 transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {pending ? '...' : '✓ Approve'}
          </button>
        )}

        {/* Reject */}
        <button
          type="button"
          onClick={() => submit('rejected')}
          disabled={pending}
          className={`py-2 rounded-xl text-sm font-semibold transition-colors
                      disabled:opacity-50 disabled:cursor-not-allowed
                      ${showRejectInput
                        ? 'flex-1 bg-red-600 text-white hover:bg-red-700'
                        : 'px-4 border border-red-200 text-red-600 hover:bg-red-50'}`}
        >
          {pending && showRejectInput ? '...' : showRejectInput ? 'Confirm Reject' : 'Reject'}
        </button>
      </div>
    </div>
  )
}