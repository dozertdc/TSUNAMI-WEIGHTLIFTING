import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Maximums } from '../types/workout';
import { useWorkoutState } from '../hooks/useWorkoutState';

interface MaximumsPageProps {
  maximums: Maximums;
  updateMaximums: (newMaximums: Maximums) => void;
}

export const MaximumsPage: React.FC<MaximumsPageProps> = ({ maximums, updateMaximums }) => {
  const { exerciseList } = useWorkoutState();
  const [localMaximums, setLocalMaximums] = useState<Maximums>(maximums);

  useEffect(() => {
    setLocalMaximums(maximums);
  }, [maximums]);

  const handleInputChange = (exerciseName: string, reps: number, value: string) => {
    const numValue = parseFloat(value);
    setLocalMaximums(prev => ({
      ...prev,
      [exerciseName]: {
        ...prev[exerciseName],
        [reps]: isNaN(numValue) ? 0 : numValue
      }
    }));
  };

  const saveMaximums = () => {
    updateMaximums(localMaximums);
  };

  return (
    <Card className="w-full overflow-x-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Rep Maximums</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-[auto_repeat(10,1fr)] gap-2 min-w-[1000px]">
          <div className="font-bold">Exercise</div>
          {[...Array(10)].map((_, i) => (
            <div key={i} className="font-bold text-center">{i + 1}</div>
          ))}
          
          {exerciseList.map((exercise) => (
            <React.Fragment key={exercise.id}>
              <div className="font-medium">{exercise.name}</div>
              {[...Array(10)].map((_, i) => (
                <Input
                  key={i}
                  type="number"
                  value={localMaximums[exercise.name]?.[i + 1] || ''}
                  onChange={(e) => handleInputChange(exercise.name, i + 1, e.target.value)}
                  className="w-full text-center"
                  placeholder="-"
                />
              ))}
            </React.Fragment>
          ))}
        </div>
        <Button onClick={saveMaximums} className="mt-4">Save Maximums</Button>
      </CardContent>
    </Card>
  );
};

