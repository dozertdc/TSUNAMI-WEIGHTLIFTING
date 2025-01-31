'use client'

import WorkoutTracker from '@/components/workout-tracker'
import AuthCheck from '@/components/auth/AuthCheck';

export default function DashboardPage() {
  return (
    <AuthCheck>
      <div className="container mx-auto p-4">
        <WorkoutTracker />
      </div>
    </AuthCheck>
  )
}