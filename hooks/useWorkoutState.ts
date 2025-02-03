import { useState, useEffect } from 'react';
import { Exercise, Workouts, Set, MacroData, Maximums } from '../types/workout';

const getMaximums = async () => {
  try {
    const response = await fetch('http://localhost:3001/api/maximums');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching maximums:', error);
    return {};
  }
};

export const useWorkoutState = () => {
  const [workouts, setWorkouts] = useState<Workouts>({});

  const [currentDate, setCurrentDate] = useState(new Date());
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [newExercise, setNewExercise] = useState<Exercise>({
    id: '',
    name: '',
    sets: [],
  });
  const [showDayDetailView, setShowDayDetailView] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const [exerciseList, setExerciseList] = useState<string[]>([]);
  const [maximums, setMaximums] = useState<Maximums>(() => {
    const savedMaximums = localStorage.getItem('maximums');
    if (savedMaximums) {
      return JSON.parse(savedMaximums);
    }
    return getMaximums();
  });
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  useEffect(() => {
    const getExercises = async () => {
      try {
        const user = localStorage.getItem('user');
        const userId = user ? JSON.parse(user).id : null;
        
        if (!userId) {
          console.error('No user ID found');
          return;
        }
        const response = await fetch(`http://localhost:3001/api/exercises/user/${userId}`);
        const data = await response.json();
        const exerciseNames = data.map((exercise: any) => exercise.name);
        setExerciseList(exerciseNames);
        localStorage.setItem('exerciseList', JSON.stringify(data)); // Save actual exercise list
      } catch (error) {
        console.error('Error fetching exercises:', error);
      }
    };
    getExercises();
  }, []); // Only run on mount

  useEffect(() => {
    localStorage.setItem('maximums', JSON.stringify(maximums));
  }, [maximums]);

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      const userData = JSON.parse(user);
      setSelectedUserId(userData.id);
    }
  }, []);

  const addSet = () => {
    if (editingExercise) {
      setEditingExercise(prev => {
        if (!prev) return null;
        const newSet = {
          weight: 0,
          reps: 0,
          ...(prev.isComplex ? prev.complexParts?.reduce((acc, _, index) => ({
            ...acc,
            [`exercise${index}Reps`]: 0
          }), {}) : {})
        };
        return {
          ...prev,
          sets: [...prev.sets, newSet]
        };
      });
    } else {
      setNewExercise(prev => {
        const newSet = {
          weight: 0,
          reps: 0,
          ...(prev.isComplex ? prev.complexParts?.reduce((acc, _, index) => ({
            ...acc,
            [`exercise${index}Reps`]: 0
          }), {}) : {})
        };
        return {
          ...prev,
          sets: [...prev.sets, newSet]
        };
      });
    }
  };

  const updateSet = (index: number, field: keyof Set | string, value: string) => {
    const updateExercise = (exercise: Exercise): Exercise => ({
      ...exercise,
      sets: exercise.sets.map((set, i) => 
        i === index ? { 
          ...set, 
          [field]: field === 'weight' ? parseFloat(value) || 0 : 
                   field.endsWith('Reps') ? parseInt(value) || 0 : 
                   parseFloat(value) || 0 
        } : set
      )
    });

    if (editingExercise) {
      setEditingExercise(prev => {
        if (!prev) return null;
        const updated = updateExercise(prev);
        return updated;
      });
    } else {
      setNewExercise(prev => updateExercise(prev));
    }
  };

  const saveWorkout = async (workout) => {
    const response = await fetch(`${API_URL}/workouts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(workout),
    });
    return response.json();
  };

  const startEditingExercise = (exercise: Exercise, date: Date) => {
    // Create a deep copy of the exercise to avoid reference issues
    const exerciseCopy = {
      ...exercise,
      sets: exercise.sets.map(set => ({
        ...set,
        weight: set.weight || 0,
        reps: set.reps || 0,
        ...Object.keys(set)
          .filter(key => key.endsWith('Reps'))
          .reduce((acc, key) => ({
            ...acc,
            [key]: set[key] || 0
          }), {})
      })),
      complexParts: exercise.complexParts ? [...exercise.complexParts] : undefined
    };
    
    setSelectedDate(date);
    setEditingExercise(exerciseCopy);
    setShowExerciseModal(true);
  };

  const saveExercise = async () => {
    if (!selectedDate) return;

    try {
      const dateKey = selectedDate.toISOString().split('T')[0];
      const currentExercises = workouts[dateKey]?.exercises || [];
      
      if (editingExercise) {
        // Update existing exercise
        const updatedExercises = currentExercises.map(ex => 
          ex.id === editingExercise.id ? editingExercise : ex
        );
        await saveWorkoutToDb(selectedDate, updatedExercises);
      } else if (newExercise.name) {
        // Add new exercise with a temporary ID
        const updatedExercises = [...currentExercises, {
          ...newExercise,
          id: crypto.randomUUID(), // This ID will be replaced by the server
          sets: newExercise.sets.map(set => ({
            ...set,
            id: crypto.randomUUID() // Temporary ID for sets
          }))
        }];
        await saveWorkoutToDb(selectedDate, updatedExercises);
      }
    } catch (error) {
      console.error('Failed to save exercise:', error);
      // You might want to show a toast or error message to the user here
    }
  };

  const openDayDetailView = (date: Date) => {
    setSelectedDate(date);
    setShowDayDetailView(true);
  };

  const closeDayDetailView = () => {
    setShowDayDetailView(false);
    setSelectedDate(null);
  };

  const toggleReordering = () => {
    setIsReordering((prev) => !prev);
  };

  const reorderExercises = (date: Date, startIndex: number, endIndex: number) => {
    const dateKey = date.toISOString().split('T')[0];
    setWorkouts((prev) => {
      const updatedWorkouts = { ...prev };
      if (!updatedWorkouts[dateKey] || !updatedWorkouts[dateKey].exercises) {
        return updatedWorkouts;
      }
      const [reorderedItem] = updatedWorkouts[dateKey].exercises.splice(startIndex, 1);
      updatedWorkouts[dateKey].exercises.splice(endIndex, 0, reorderedItem);
      return updatedWorkouts;
    });
  };

  const saveMacros = (date: Date, macros: MacroData) => {
    const dateKey = date.toISOString().split('T')[0];
    setWorkouts(prev => ({
      ...prev,
      [dateKey]: {
        ...prev[dateKey],
        exercises: prev[dateKey]?.exercises || [],
        macros,
      },
    }));
  };

  const updateExercisesForDate = (date: Date, updatedExercises: Exercise[]) => {
    const dateKey = date.toISOString().split('T')[0];
    setWorkouts(prev => ({
      ...prev,
      [dateKey]: {
        ...prev[dateKey],
        exercises: updatedExercises,
      },
    }));
  };

  const addExerciseToList = (exercise: Exercise) => {
    setExerciseList(prev => [...prev, exercise]);
  };

  const removeExerciseFromList = (id: string) => {
    setExerciseList(prev => prev.filter(exercise => exercise.id !== id));
  };

  const deleteExercise = async (exerciseId: string, date: Date) => {
    const dateKey = date.toISOString().split('T')[0];
    const workout = workouts[dateKey];
    
    if (!workout || !workout.id) {
      console.error('No workout found for date:', dateKey);
      return;
    }

    if (!exerciseId) {
      console.error('Invalid exercise ID:', exerciseId);
      return;
    }

    try {
      // Delete from database
      const response = await fetch(
        `http://localhost:3001/api/workouts/${workout.id}/exercises/${exerciseId}`,
        {
          method: 'DELETE',
          credentials: 'include'
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete exercise');
      }

      const result = await response.json();

      // Update local state
      setWorkouts(prev => {
        const currentWorkout = prev[dateKey];
        if (!currentWorkout) return prev;

        if (result.workoutDeleted) {
          // If the workout was deleted, remove it from state
          const { [dateKey]: _, ...rest } = prev;
          return rest;
        }

        // Otherwise just remove the exercise
        return {
          ...prev,
          [dateKey]: {
            ...currentWorkout,
            exercises: currentWorkout.exercises.filter(ex => ex.id !== exerciseId)
          }
        };
      });
    } catch (error) {
      console.error('Failed to delete exercise:', error);
      throw error;
    }
  };

  const logout = () => {
    if (typeof window !== 'undefined') {
      // Clear localStorage
      localStorage.clear();
      
      // Clear cookies more reliably
      const cookies = document.cookie.split(';');
      for (const cookie of cookies) {
        const [name] = cookie.split('=');
        document.cookie = `${name.trim()}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname}`;
        // Also try without domain for cookies set without it
        document.cookie = `${name.trim()}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
      }
  
      // Clear session storage
      sessionStorage.clear();
      window.location.href = '/login';
    }
  };

  const getLocalDateString = (date: Date) => {
    return new Date(date.getTime() - (date.getTimezoneOffset() * 60000))
      .toISOString()
      .split('T')[0];
  };

  const saveWorkoutToDb = async (date: Date, exercises: Exercise[]) => {
    try {
      const dateKey = date.toISOString().split('T')[0];
      const today = new Date().toISOString().split('T')[0];
      
      // Set status based on date
      const status = dateKey > today ? 'planned' : 'completed';

      const workoutData = {
        userId: selectedUserId,
        date: dateKey,
        status,
        exercises: exercises.map(exercise => ({
          ...exercise,
          sets: exercise.sets.map(set => ({
            ...set
          }))
        }))
      };

      const existingWorkout = workouts[dateKey];
      const method = existingWorkout ? 'PUT' : 'POST';
      const url = existingWorkout 
        ? `http://localhost:3001/api/workouts/${existingWorkout.id}`
        : 'http://localhost:3001/api/workouts';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(workoutData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to save workout: ${errorText}`);
      }

      const result = await response.json();

      // Format the response data to match state structure
      if (result.workout) {
        const formattedWorkout = {
          id: result.workout.id,
          status: result.workout.status,
          exercises: Array.isArray(result.workout.exercises) ? result.workout.exercises.map((exercise: any) => ({
            id: exercise.id,
            name: exercise.name,
            isComplex: exercise.isComplex,
            complexParts: exercise.complexParts,
            sets: Array.isArray(exercise.sets) ? exercise.sets.map((set: any) => {
              if (exercise.isComplex && set.parts) {
                // Calculate total reps from parts for complex exercises
                const totalReps = set.parts.reduce((sum: number, part: any) => sum + (part.reps || 0), 0);
                
                // Create exercise0Reps, exercise1Reps etc. from parts
                const partReps = set.parts.reduce((acc: any, part: any, index: number) => ({
                  ...acc,
                  [`exercise${index}Reps`]: part.reps || 0
                }), {});

                return {
                  id: set.id,
                  weight: set.weight || 0,
                  reps: totalReps, // Use total reps for tonnage calculation
                  ...partReps     // Include individual part reps
                };
              } else {
                // Regular exercise set
                return {
                  id: set.id,
                  weight: set.weight || 0,
                  reps: set.reps || 0
                };
              }
            }) : []
          })) : []
        };

        setWorkouts(prev => ({
          ...prev,
          [dateKey]: formattedWorkout
        }));
      }

      return result;
    } catch (error) {
      console.error('Error saving workout:', error);
      throw error;
    }
  };

  const fetchWorkouts = async (userId: string, date: Date) => {
    if (!userId) {
      console.error('No userId provided to fetchWorkouts');
      return;
    }

    try {
      // Get first and last day shown on calendar
      const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const lastDayOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      // Adjust to include days from previous/next month shown on calendar
      const startDate = new Date(firstDayOfMonth);
      startDate.setDate(startDate.getDate() - firstDayOfMonth.getDay()); // Go back to Sunday
      
      const endDate = new Date(lastDayOfMonth);
      const daysToAdd = 6 - lastDayOfMonth.getDay();
      endDate.setDate(endDate.getDate() + daysToAdd); // Go forward to Saturday

      const response = await fetch(
        `http://localhost:3001/api/workouts?` + 
        `userId=${userId}&` +
        `startDate=${startDate.toISOString().split('T')[0]}&` +
        `endDate=${endDate.toISOString().split('T')[0]}`,
        {
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          // Handle unauthorized
          localStorage.removeItem('user');
          window.location.href = '/login';
          throw new Error('Authentication expired');
        }
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch workouts');
      }
      
      const workoutData = await response.json();
      
      // Transform the data to match your state structure
      const formattedWorkouts: Workouts = {};
      workoutData.forEach((workout: any) => {
        const dateKey = new Date(workout.date).toISOString().split('T')[0];
        
        formattedWorkouts[dateKey] = {
          id: workout.id,
          status: workout.status,
          exercises: Array.isArray(workout.exercises) ? workout.exercises.map((exercise: any) => ({
            id: exercise.id,
            name: exercise.name,
            isComplex: exercise.isComplex,
            complexParts: exercise.complexParts,
            sets: Array.isArray(exercise.sets) ? exercise.sets.map((set: any) => {
              if (exercise.isComplex && set.parts) {
                // Calculate total reps from parts for complex exercises
                const totalReps = set.parts.reduce((sum: number, part: any) => sum + (part.reps || 0), 0);
                
                // Create exercise0Reps, exercise1Reps etc. from parts
                const partReps = set.parts.reduce((acc: any, part: any, index: number) => ({
                  ...acc,
                  [`exercise${index}Reps`]: part.reps || 0
                }), {});

                return {
                  id: set.id,
                  weight: set.weight || 0,
                  reps: totalReps, // Use total reps for tonnage calculation
                  ...partReps     // Include individual part reps
                };
              } else {
                // Regular exercise set
                return {
                  id: set.id,
                  weight: set.weight || 0,
                  reps: set.reps || 0
                };
              }
            }) : []
          })) : []
        };
      });

      setWorkouts(formattedWorkouts);
    } catch (error) {
      console.error('Error fetching workouts:', error instanceof Error ? error.message : 'Unknown error');
      if (error instanceof Error && error.message === 'User not authenticated') {
        window.location.href = '/login';
      }
    }
  };

  useEffect(() => {
    if (selectedUserId) {
      fetchWorkouts(selectedUserId, currentDate);
    }
  }, [currentDate, selectedUserId]);

  const handleUserChange = async (userId: string) => {
    try {
      // First clear all state
      setWorkouts({});
      setEditingExercise(null);
      setNewExercise({ id: '', name: '', sets: [] });
      setShowExerciseModal(false);
      setSelectedDate(null);
      
      // Then update the selectedUserId
      setSelectedUserId(userId);

      // Finally fetch workouts for the new user
      if (userId) {
        await fetchWorkouts(userId, currentDate);
      }
    } catch (error) {
      console.error('Error changing selected user:', error);
      // Reset all state on error
      setWorkouts({});
      setSelectedUserId('');
      setEditingExercise(null);
      setNewExercise({ id: '', name: '', sets: [] });
      setShowExerciseModal(false);
      setSelectedDate(null);
    }
  };

  const removeSet = async (setIndex: number) => {
    if (editingExercise) {
      try {
        const setToRemove = editingExercise.sets[setIndex];
        if (!setToRemove.id) {
          console.error('Set has no ID');
          return;
        }

        if (!selectedDate) {
          console.error('No date selected');
          return;
        }

        const dateKey = selectedDate.toISOString().split('T')[0];
        const workout = workouts[dateKey];
        
        if (!workout?.id) {
          console.error('No workout found');
          return;
        }

        // Delete from database
        const response = await fetch(
          `http://localhost:3001/api/workouts/${workout.id}/exercises/${editingExercise.id}/sets/${setToRemove.id}`,
          {
            method: 'DELETE',
            credentials: 'include',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to delete set');
        }

        // Update local state
        const updatedExercise = {
          ...editingExercise,
          sets: editingExercise.sets.filter((_, index) => index !== setIndex)
        };

        setEditingExercise(updatedExercise);

        // Update workouts state
        setWorkouts(prev => ({
          ...prev,
          [dateKey]: {
            ...prev[dateKey],
            exercises: prev[dateKey].exercises.map(ex => 
              ex.id === editingExercise.id ? updatedExercise : ex
            )
          }
        }));

      } catch (error) {
        console.error('Failed to delete set:', error);
        throw error; // Re-throw to be caught by the UI
      }
    } else {
      // For new exercises, just update the state
      setNewExercise(prev => ({
        ...prev,
        sets: prev.sets.filter((_, index) => index !== setIndex)
      }));
    }
  };

  const updateWorkoutStatus = async (date: Date, status: 'planned' | 'completed') => {
    try {
      const dateKey = date.toISOString().split('T')[0];
      const workout = workouts[dateKey];
      
      if (!workout) return;

      const response = await fetch(`http://localhost:3001/api/workouts/${workout.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status })
      });

      if (!response.ok) throw new Error('Failed to update workout status');

      setWorkouts(prev => ({
        ...prev,
        [dateKey]: {
          ...prev[dateKey],
          status
        }
      }));
    } catch (error) {
      console.error('Error updating workout status:', error);
      throw error;
    }
  };

  return {
    workouts,
    currentDate,
    showExerciseModal,
    selectedDate,
    editingExercise,
    newExercise,
    showDayDetailView,
    isReordering,
    selectedUserId,
    setSelectedUserId: handleUserChange,
    setCurrentDate,
    setShowExerciseModal,
    setSelectedDate,
    setNewExercise,
    setEditingExercise,
    addSet,
    updateSet,
    saveExercise,
    startEditingExercise,
    openDayDetailView,
    closeDayDetailView,
    toggleReordering,
    reorderExercises,
    setShowDayDetailView,
    saveMacros,
    updateExercisesForDate,
    setWorkouts,
    exerciseList,
    addExerciseToList,
    removeExerciseFromList,
    maximums,
    setMaximums,
    deleteExercise,
    logout,
    removeSet,
    updateWorkoutStatus,
  };
};