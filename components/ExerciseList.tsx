'use client';

import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface Exercise {
  id: number;
  name: string;
  one_rep_max?: number;
  updated_at?: string;
}

interface ExerciseListProps {
  exercises: Exercise[];
  onUpdateExercises: (exercises: Exercise[]) => void;
}

export function ExerciseList({ exercises, onUpdateExercises }: ExerciseListProps) {
  console.log('ExerciseList component rendering', { 
    exercises, 
    hasCallback: !!onUpdateExercises,
    callbackType: typeof onUpdateExercises
  });
  
  const [editingId, setEditingId] = useState<number | null>(null);
  const [tempOneRM, setTempOneRM] = useState<string>('');

  useEffect(() => {
    console.log('useEffect running, onUpdateExercises:', typeof onUpdateExercises);
    
    if (typeof onUpdateExercises !== 'function') {
      console.error('onUpdateExercises is not a function:', onUpdateExercises);
      return;
    }

    const fetchExercises = async () => {
      try {
        const user = localStorage.getItem('user');
        const userId = user ? JSON.parse(user).id : null;
        console.log('Attempting to fetch exercises. UserId:', userId);
        if (!userId) {
          console.log('No userId found in localStorage');
          return;
        }

        const response = await fetch(`http://localhost:3001/api/exercises/user/${userId}`, {
          credentials: 'include',
        });
        
        console.log('Fetch response:', response.status, response.statusText);
        
        if (!response.ok) throw new Error('Failed to fetch exercises');
        
        const data = await response.json();
        console.log('Fetched exercises:', data);
        onUpdateExercises(data);
      } catch (error) {
        console.error('Error in fetchExercises:', error);
      }
    };

    fetchExercises();
  }, [onUpdateExercises]);

  useEffect(() => {
    const checkPersistence = () => {
      const user = localStorage.getItem('user');
      const userId = user ? JSON.parse(user).id : null;
      const isAuthenticated = localStorage.getItem('isAuthenticated');
      console.log('Storage state:', { userId, user, isAuthenticated });
    };

    // Check on mount
    checkPersistence();

    // Check every 5 seconds for debugging
    const interval = setInterval(checkPersistence, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleEdit = (exercise: Exercise) => {
    setEditingId(exercise.id);
    setTempOneRM(exercise.one_rep_max?.toString() || '');
  };

  const handleSave = async (exercise: Exercise) => {
    try {
      const user = localStorage.getItem('user');
      const userId = user ? JSON.parse(user).id : null;
      if (!userId) {
        console.error('No user ID found');
        return;
      }

      const updatedExercise = {
        ...exercise,
        one_rep_max: tempOneRM ? parseFloat(tempOneRM) : undefined
      };

      console.log('Saving exercise:', {
        userId,
        exerciseId: exercise.id,
        one_rep_max: updatedExercise.one_rep_max
      });

      const response = await fetch(`http://localhost:3001/api/exercises/user/${userId}/${exercise.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ one_rep_max: updatedExercise.one_rep_max })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update exercise');
      }

      const updatedExercises = exercises.map(e => 
        e.id === exercise.id ? updatedExercise : e
      );
      onUpdateExercises(updatedExercises);
      setEditingId(null);
    } catch (error) {
      console.error('Error updating exercise:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Exercise List</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {exercises.map((exercise) => (
            <div key={exercise.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex-1">
                <h3 className="font-medium">{exercise.name}</h3>
                {editingId === exercise.id ? (
                  <div className="flex items-center gap-2 mt-2">
                    <Label htmlFor={`1rm-${exercise.id}`}>1RM (kg):</Label>
                    <Input
                      id={`1rm-${exercise.id}`}
                      type="number"
                      value={tempOneRM}
                      onChange={(e) => setTempOneRM(e.target.value)}
                      className="w-24"
                      min="0"
                      step="0.5"
                    />
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    1RM: {exercise.one_rep_max ? `${exercise.one_rep_max} kg` : 'Not set'}
                    {exercise.updated_at && (
                      <span className="ml-2 text-xs">
                        (Updated: {new Date(exercise.updated_at).toLocaleDateString()})
                      </span>
                    )}
                  </p>
                )}
              </div>
              <div>
                {editingId === exercise.id ? (
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setEditingId(null)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      size="sm"
                      onClick={() => handleSave(exercise)}
                    >
                      Save
                    </Button>
                  </div>
                ) : (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleEdit(exercise)}
                  >
                    Edit 1RM
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

