import React from 'react';
import { X } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Exercise, Set, Workouts } from '../types/workout';

interface ExerciseModalProps {
  exercise: Exercise;
  setExercise: React.Dispatch<React.SetStateAction<Exercise>>;
  addSet: () => void;
  updateSet: (index: number, field: keyof Set, value: string) => void;
  saveExercise: () => void;
  closeModal: () => void;
  isEditing: boolean;
  setWorkouts: React.Dispatch<React.SetStateAction<Workouts>>;
  exerciseList: { id: string; name: string }[];
}

export const ExerciseModal: React.FC<ExerciseModalProps> = ({
  exercise,
  setExercise,
  addSet,
  updateSet,
  saveExercise,
  closeModal,
  isEditing,
  setWorkouts,
  exerciseList,
}) => {
  const handleSave = () => {
    if (exercise.name.trim() === '' || exercise.sets.length === 0) {
      console.error('Exercise name is required and at least one set must be added');
      return;
    }
    saveExercise();
    setWorkouts(prev => ({ ...prev })); // Force a re-render
    closeModal();
  };

  const handleAddSet = () => {
    addSet();
  };

  const isCleanAndJerk = exercise.name === 'Clean and Jerk';

  return (
    <Card className="w-full max-w-md overflow-visible relative z-50">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{isEditing ? 'Edit Exercise' : 'Add Exercise'}</CardTitle>
        <Button
          variant="ghost"
          size="icon"
          onClick={closeModal}
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4 overflow-visible">
        <div className="space-y-4">
          <div>
            <Label>Exercise Name</Label>
            <Select
              value={exercise.name}
              onValueChange={(value) => setExercise(prev => ({ ...prev, name: value }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select an exercise" />
              </SelectTrigger>
              <SelectContent className="z-[200]">
                {exerciseList.map((ex) => (
                  <SelectItem key={ex.id} value={ex.name}>
                    {ex.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Sets</Label>
            {exercise.sets.map((set, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Weight (kg)"
                  value={set.weight || ''}
                  onChange={(e) => updateSet(index, 'weight', e.target.value)}
                />
                <Input
                  type="number"
                  placeholder="Reps"
                  value={set.reps || ''}
                  onChange={(e) => updateSet(index, 'reps', e.target.value)}
                />
              </div>
            ))}
            <Button onClick={handleAddSet} variant="outline">
              Add Set
            </Button>
          </div>

          <Button onClick={handleSave} className="w-full">
            Save Exercise
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

