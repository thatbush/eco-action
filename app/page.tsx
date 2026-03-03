'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <Image
        src="/nobglogo1.png"
        alt="GreenSteps.logo"
        width={200}
        height={200}
      />
      <h1 className="page-title">Welcoma to GreenSteps</h1>
      <p className="page-subtitle">
        Complete eco-concious task and earn rewards✨💰
      </p>

      <div
        className="mt-6">
        <button
          onClick={() => router.push('/register')}
          className="btn btn-outline mt-6">
          Register Now
        </button>
      </div>

    </main>
  );
}
