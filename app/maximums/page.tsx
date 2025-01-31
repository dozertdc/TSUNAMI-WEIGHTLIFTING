'use client';

import { useWorkoutState } from '@/hooks/useWorkoutState';
import { MaximumsPage } from '@/components/MaximumsPage';

export default function MaximumsRoute() {
  const { maximums, setMaximums } = useWorkoutState();
  
  return (
    <div className="container mx-auto p-4">
      <MaximumsPage 
        maximums={maximums} 
        updateMaximums={setMaximums} 
      />
    </div>
  );
} 