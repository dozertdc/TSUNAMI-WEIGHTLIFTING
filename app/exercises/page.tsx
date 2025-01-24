'use client';

import { useState, useCallback } from 'react';
import { ExerciseList } from '@/components/ExerciseList';
import type { Exercise } from '@/components/ExerciseList';

export default function ExercisesPage() {
  const [exercises, setExercises] = useState<Exercise[]>([]);

  // Use useCallback to maintain reference stability
  const handleUpdateExercises = useCallback((updatedExercises: Exercise[]) => {
    console.log('Updating exercises:', updatedExercises);
    setExercises(updatedExercises);
  }, []);

  console.log('ExercisesPage rendering, exercises:', exercises);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Exercises</h1>
      <ExerciseList 
        exercises={exercises} 
        onUpdateExercises={handleUpdateExercises} 
      />
    </div>
  );
} 