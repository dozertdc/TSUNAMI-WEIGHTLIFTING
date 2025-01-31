'use client'

import WorkoutTracker from '@/components/workout-tracker'
import AuthCheck from '@/components/auth/AuthCheck';

export default function DashboardPage() {
  return (<AuthCheck><WorkoutTracker /></AuthCheck>)
}