import React, { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Exercise, Set, Workouts, ComplexPart } from '../types/workout';
import { Checkbox } from '@/components/ui/checkbox';

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
  const [isComplex, setIsComplex] = useState(exercise.isComplex || false);
  const [complexParts, setComplexParts] = useState<ComplexPart[]>(
    exercise.complexParts || [{ name: '' }]
  );
  const [currentExercise, setCurrentExercise] = useState<Exercise>(exercise);

  useEffect(() => {
    setIsComplex(exercise.isComplex || false);
    setComplexParts(exercise.complexParts || [{ name: '' }]);
    setCurrentExercise(exercise);
  }, [exercise]);

  const handleComplexPartChange = (index: number, field: keyof ComplexPart, value: string) => {
    const newParts = [...complexParts];
    newParts[index] = {
      ...newParts[index],
      [field]: value
    };
    setComplexParts(newParts);
    
    const complexName = newParts
      .filter(part => part.name)
      .map(part => part.name)
      .join(' + ');
    
    const updatedExercise = {
      ...currentExercise,
      name: complexName,
      isComplex: true,
      complexParts: newParts
    };
    setCurrentExercise(updatedExercise);
    setExercise(updatedExercise);
  };

  const handleToggleComplex = () => {
    setIsComplex(!isComplex);
    if (!isComplex) {
      const newParts = [
        { name: currentExercise.name || '' },
        { name: '' }
      ];
      setComplexParts(newParts);
      const updatedExercise = {
        ...currentExercise,
        isComplex: true,
        complexParts: newParts
      };
      setCurrentExercise(updatedExercise);
      setExercise(updatedExercise);
    } else {
      const updatedExercise = {
        ...currentExercise,
        isComplex: false,
        complexParts: undefined,
        name: complexParts[0]?.name || ''
      };
      setComplexParts([]);
      setCurrentExercise(updatedExercise);
      setExercise(updatedExercise);
    }
  };

  const handleAddSet = () => {
    addSet();
    const newSet = { 
      weight: 0, 
      reps: 0,
      ...(isComplex ? complexParts.reduce((acc, _, index) => ({
        ...acc,
        [`exercise${index}Reps`]: 0
      }), {}) : {})
    };
    
    const updatedExercise = {
      ...currentExercise,
      sets: [...currentExercise.sets, newSet]
    };
    setCurrentExercise(updatedExercise);
    setExercise(updatedExercise);
  };

  const handleUpdateSet = (setIndex: number, field: keyof Set | string, value: string) => {
    updateSet(setIndex, field, value);
    
    // Also update local state
    const updatedExercise = {
      ...currentExercise,
      sets: currentExercise.sets.map((set, i) => 
        i === setIndex ? { 
          ...set, 
          [field]: field === 'weight' ? parseFloat(value) || 0 : 
                   field.endsWith('Reps') ? parseInt(value) || 0 : 
                   parseFloat(value) || 0 
        } : set
      )
    };
    setCurrentExercise(updatedExercise);
  };

  const handleExerciseSelect = (value: string) => {
    if (value === 'Clean and Jerk') {
      console.log('handleExerciseSelect');
      setIsComplex(true);
      const newParts = [
        { name: 'Clean' },
        { name: 'Jerk' }
      ];
      setComplexParts(newParts);
      const updatedExercise = {
        ...currentExercise,
        name: value,
        isComplex: true,
        complexParts: newParts
      };
      setCurrentExercise(updatedExercise);
      setExercise(updatedExercise);
    } else {
      const updatedExercise = { ...currentExercise, name: value };
      setCurrentExercise(updatedExercise);
      setExercise(updatedExercise);
    }
  };

  const handleSave = () => {
    if (currentExercise.name.trim() === '' || currentExercise.sets.length === 0) {
      console.error('Exercise name is required and at least one set must be added');
      return;
    }
    setExercise(currentExercise);
    saveExercise();
    setWorkouts(prev => ({ ...prev }));
    closeModal();
  };

  return (
    <Card className="w-full max-w-md overflow-visible relative z-50">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{isEditing ? 'Edit Exercise' : 'Add Exercise'}</CardTitle>
        <Button variant="ghost" size="icon" onClick={closeModal}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4 overflow-visible">
        <div className="space-y-4">
          {!isComplex && (
            <div>
              <Label>Exercise Name</Label>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <Select
                    value={currentExercise.name}
                    onValueChange={handleExerciseSelect}
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
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleToggleComplex}
                  className="flex-shrink-0"
                  title="Make Complex Exercise"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {isComplex && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Complex Exercise Parts</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleToggleComplex}
                  className="flex-shrink-0 bg-blue-100 text-blue-700"
                  title="Exit Complex Mode"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              {complexParts.map((part, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="flex-1">
                    <Select
                      value={part.name}
                      onValueChange={(value) => handleComplexPartChange(index, 'name', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select exercise" />
                      </SelectTrigger>
                      <SelectContent>
                        {exerciseList.map((ex) => (
                          <SelectItem key={ex.id} value={ex.name}>
                            {ex.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {index === complexParts.length - 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        const newPart = { name: '' };
                        setComplexParts([...complexParts, newPart]);
                        handleComplexPartChange(complexParts.length, 'name', newPart.name);
                      }}
                      className="flex-shrink-0"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="space-y-2">
            <Label>Sets</Label>
            {currentExercise.sets.map((set, setIndex) => (
              <div key={setIndex} className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Weight"
                  value={set.weight || ''}
                  onChange={(e) => handleUpdateSet(setIndex, 'weight', e.target.value)}
                />
                {isComplex ? (
                  <div className="space-y-2">
                    {complexParts.map((part, partIndex) => (
                      <div key={partIndex} className="flex gap-2 items-center">
                        <span className="text-sm text-gray-500 w-24 truncate">
                          {part.name}:
                        </span>
                        <Input
                          type="number"
                          placeholder="Reps"
                          value={set[`exercise${partIndex}Reps`] || ''}
                          onChange={(e) => handleUpdateSet(setIndex, `exercise${partIndex}Reps`, e.target.value)}
                          className="w-20"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <Input
                    type="number"
                    placeholder="Reps"
                    value={set.reps || ''}
                    onChange={(e) => handleUpdateSet(setIndex, 'reps', e.target.value)}
                  />
                )}
              </div>
            ))}
            <Button 
              onClick={handleAddSet} 
              variant="outline" 
              className="w-full"
            >
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

