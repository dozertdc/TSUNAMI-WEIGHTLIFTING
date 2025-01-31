'use client';

import { useWorkoutState } from '@/hooks/useWorkoutState';
import { Analyzer } from '@/components/Analyzer';
import AuthCheck from '@/components/auth/AuthCheck';

export default function AnalyzerPage() {
  const { workouts } = useWorkoutState();
  
  return (
    <AuthCheck>
      <div className="container mx-auto p-4">
        <Analyzer workouts={workouts} />
      </div>
    </AuthCheck>
  );
} 