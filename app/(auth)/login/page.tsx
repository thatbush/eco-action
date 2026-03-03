'use client'

import { useActionState } from 'react'
import { login, type LoginState } from './action'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

const initialState: LoginState = {}

function LoginForm() {
  const [state, formAction, pending] = useActionState(login, initialState)
  const searchParams = useSearchParams()
  const message = searchParams.get('message')

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
          <p className="text-sm text-gray-500 mt-1">
            Sign in to your EcoTrack account
          </p>
        </div>

        {/* Success message e.g. after org registration */}
        {message && (
          <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200">
            <p className="text-sm text-green-700">{message}</p>
          </div>
        )}

        {/* General error */}
        {state.errors?.general && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200">
            <p className="text-sm text-red-600">{state.errors.general[0]}</p>
          </div>
        )}

        <form action={formAction} className="space-y-5">

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="jane@example.com"
              autoComplete="email"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm
                         focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            {state.errors?.email && (
              <p className="mt-1 text-xs text-red-500">{state.errors.email[0]}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Your password"
              autoComplete="current-password"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm
                         focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            {state.errors?.password && (
              <p className="mt-1 text-xs text-red-500">{state.errors.password[0]}</p>
            )}
            <div className="mt-1 text-right">
              <Link
                href="/forgot-password"
                className="text-xs text-green-600 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={pending}
            className="w-full py-2.5 px-4 bg-green-600 hover:bg-green-700 disabled:bg-green-400
                       text-white text-sm font-semibold rounded-lg transition-colors"
          >
            {pending ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 space-y-2 text-center text-sm text-gray-500">
          <p>
            Don't have an account?{' '}
            <Link href="/register" className="text-green-600 font-medium hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

// useSearchParams requires Suspense boundary
export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}