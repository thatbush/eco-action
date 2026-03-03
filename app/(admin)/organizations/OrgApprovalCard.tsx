'use client'

import { useState } from 'react'
import { approveOrganization, rejectOrganization } from './actions'

type Org = {
    id: string
    org_name: string
    contact_email: string
    kra_pin: string
    description: string | null
    verification_status: 'pending' | 'verified' | 'rejected'
    created_at: string
}

export default function OrgApprovalCard({ org }: { org: Org }) {
    const [loading, setLoading] = useState<'approve' | 'reject' | null>(null)
    const [done, setDone] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const statusColors = {
        pending: 'bg-yellow-100 text-yellow-700',
        verified: 'bg-green-100 text-green-700',
        rejected: 'bg-red-100 text-red-700',
    }

    async function handleApprove() {
        setLoading('approve')
        setError(null)
        const result = await approveOrganization(org.id)
        if (result.error) setError(result.error)
        else setDone(true)
        setLoading(null)
    }

    async function handleReject() {
        setLoading('reject')
        setError(null)
        const result = await rejectOrganization(org.id)
        if (result.error) setError(result.error)
        else setDone(true)
        setLoading(null)
    }

    if (done) return null

    return (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-start justify-between gap-4">

                {/* Org info */}
                <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-gray-900">{org.org_name}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium
                             ${statusColors[org.verification_status]}`}>
                            {org.verification_status}
                        </span>
                    </div>
                    <p className="text-sm text-gray-500">{org.contact_email}</p>
                    <p className="text-sm text-gray-500">KRA PIN: <span className="font-mono">{org.kra_pin}</span></p>
                    {org.description && (
                        <p className="text-sm text-gray-600 mt-2">{org.description}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-2">
                        Registered {new Date(org.created_at).toLocaleDateString('en-KE', {
                            day: 'numeric', month: 'short', year: 'numeric'
                        })}
                    </p>
                </div>

                {/* Actions — only show for pending */}
                {org.verification_status === 'pending' && (
                    <div className="flex gap-2 shrink-0">
                        <button
                            onClick={handleReject}
                            disabled={!!loading}
                            className="px-4 py-2 text-sm font-medium text-red-600 border border-red-200
                         rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
                        >
                            {loading === 'reject' ? 'Rejecting...' : 'Reject'}
                        </button>
                        <button
                            onClick={handleApprove}
                            disabled={!!loading}
                            className="px-4 py-2 text-sm font-medium text-white bg-green-600
                         rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                        >
                            {loading === 'approve' ? 'Approving...' : 'Approve'}
                        </button>
                    </div>
                )}
            </div>

            {error && (
                <p className="mt-3 text-xs text-red-500">{error}</p>
            )}
        </div>
    )
}