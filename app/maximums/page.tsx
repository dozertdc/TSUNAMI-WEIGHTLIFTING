'use client';

import { useWorkoutState } from '@/hooks/useWorkoutState';
import { MaximumsPage } from '@/components/MaximumsPage';
import AuthCheck from '@/components/auth/AuthCheck';

export default function MaximumsRoute() {
  const { maximums, setMaximums } = useWorkoutState();
  
  return (
    <AuthCheck>
      <div className="container mx-auto p-4">
        <MaximumsPage 
          maximums={maximums} 
          updateMaximums={setMaximums} 
        />
      </div>
    </AuthCheck>
  );
} 