'use client';

import { useWorkoutState } from '@/hooks/useWorkoutState';
import { Analyzer } from '@/components/Analyzer';

export default function AnalyzerPage() {
  const { workouts } = useWorkoutState();
  
  return (
    <div className="container mx-auto p-4">
      <Analyzer workouts={workouts} />
    </div>
  );
} 