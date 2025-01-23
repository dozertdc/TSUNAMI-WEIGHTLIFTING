'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import WorkoutTracker from '@/components/workout-tracker'

export default function DashboardPage() {
  const router = useRouter()

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('isAuthenticated')
    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [router])

  return <WorkoutTracker />
}

