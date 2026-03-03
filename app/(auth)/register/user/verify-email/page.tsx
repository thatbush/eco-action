import Link from 'next/link'

export default function VerifyEmailPage() {
  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow p-8 text-center space-y-4">
      <div className="text-4xl">📧</div>
      <h1 className="text-2xl font-bold text-gray-900">Check your email</h1>
      <p className="text-sm text-gray-500">
        We sent a confirmation link to your email. Click it to activate your
        account.
      </p>
      <Link
        href="/login"
        className="inline-block mt-4 text-sm text-green-600 hover:underline"
      >
        Back to sign in
      </Link>
    </div>
  )
}