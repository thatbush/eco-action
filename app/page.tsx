'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { Navbar } from '@/components/navbar'


export default function Home() {
  const router = useRouter()
  const [activeStep, setActiveStep] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep(prev => (prev + 1) % 3)
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div >
      <Navbar />

      {/* Hero section */}
      <section className="w-full hero-root hero-section">

        <h1 className="hero-title">
          Every step you take<br />
          <em>heals the planet.</em>
        </h1>

        <p className="hero-subtitle">
          Complete eco-conscious tasks, earn rewards, and join a community of
          changemakers making a real difference.
        </p>


        {/* CTA */}
        <div className="hero-cta-row">
          <button
            className="hero-btn-primary"
            onClick={() => router.push('/register')}
          >
            Start Your Journey
          </button>
  
        </div>

      </section>
    </div>
  )
}