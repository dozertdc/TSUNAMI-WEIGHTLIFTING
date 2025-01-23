import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Exercise {
  id: string;
  name: string;
}

interface ExerciseListProps {
  exercises: Exercise[];
  addExercise: (exercise: Exercise) => void;
  removeExercise: (id: string) => void;
}

export const ExerciseList: React.FC<ExerciseListProps> = ({
  exercises,
  addExercise,
  removeExercise,
}) => {
  const [newExerciseName, setNewExerciseName] = useState('');

  const handleAddExercise = () => {
    if (newExerciseName.trim()) {
      // Generate a unique ID using a combination of timestamp and random string
      const uniqueId = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      addExercise({
        id: uniqueId,
        name: newExerciseName.trim(),
      });
      setNewExerciseName('');
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Exercise List</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="exerciseName">Exercise Name</Label>
              <Input
                type="text"
                id="exerciseName"
                value={newExerciseName}
                onChange={(e) => setNewExerciseName(e.target.value)}
                placeholder="Enter exercise name"
              />
            </div>
            <Button onClick={handleAddExercise} className="mt-auto">
              <Plus className="mr-2 h-4 w-4" /> Add
            </Button>
          </div>
          <div className="space-y-2">
            {exercises.map((exercise) => (
              <div key={exercise.id} className="flex items-center justify-between p-2 bg-gray-100 rounded">
                <span>{exercise.name}</span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => removeExercise(exercise.id)}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

