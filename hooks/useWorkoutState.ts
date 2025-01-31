import { useState, useEffect } from 'react';
import { Exercise, Workouts, Set, MacroData, Maximums } from '../types/workout';
import { generateTestData, getExercises, getWorkouts, getMaximums } from '../utils/testData';
import { useRouter } from 'next/navigation'

export const useWorkoutState = () => {
  const getInitialWorkouts = () => {
    if (typeof window === 'undefined') return getWorkouts();
    const savedWorkouts = localStorage.getItem('workouts');
    return savedWorkouts ? JSON.parse(savedWorkouts) : getWorkouts();
  };

  const [workouts, setWorkouts] = useState<Workouts>(getInitialWorkouts);

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
  const [exerciseList, setExerciseList] = useState<{ id: string; name: string }[]>(() => {
    const savedExerciseList = localStorage.getItem('exerciseList');
    if (savedExerciseList) {
      return JSON.parse(savedExerciseList);
    }
    return getExercises();
  });
  const [maximums, setMaximums] = useState<Maximums>(() => {
    const savedMaximums = localStorage.getItem('maximums');
    if (savedMaximums) {
      return JSON.parse(savedMaximums);
    }
    return getMaximums();
  });

  useEffect(() => {
    localStorage.setItem('workouts', JSON.stringify(workouts));
  }, [workouts]);

  useEffect(() => {
    localStorage.setItem('exerciseList', JSON.stringify(exerciseList));
  }, [exerciseList]);

  useEffect(() => {
    localStorage.setItem('maximums', JSON.stringify(maximums));
  }, [maximums]);

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

  const startEditingExercise = (exercise: Exercise) => {
    // Create a deep copy of the exercise to avoid reference issues
    const exerciseCopy = {
      ...exercise,
      sets: exercise.sets.map(set => ({
        ...set,
        weight: set.weight || 0,
        reps: set.reps || 0,
        // Copy any complex exercise reps
        ...Object.keys(set)
          .filter(key => key.endsWith('Reps'))
          .reduce((acc, key) => ({
            ...acc,
            [key]: set[key] || 0
          }), {})
      })),
      complexParts: exercise.complexParts ? [...exercise.complexParts] : undefined
    };
    
    setEditingExercise(exerciseCopy);
    setShowExerciseModal(true);
  };

  const saveExercise = () => {
    if (!selectedDate) return;

    const dateKey = selectedDate.toISOString().split('T')[0];
    const exerciseToSave = editingExercise || {
      ...newExercise,
      id: Date.now().toString()
    };

    if (exerciseToSave.name && exerciseToSave.sets.length > 0) {
      setWorkouts(prev => {
        const existingWorkout = prev[dateKey] || { exercises: [] };
        
        if (editingExercise) {
          // Update existing exercise
          const updatedExercises = existingWorkout.exercises.map(ex => 
            ex.id === editingExercise.id ? exerciseToSave : ex
          );
          return {
            ...prev,
            [dateKey]: {
              ...existingWorkout,
              exercises: updatedExercises
            }
          };
        } else {
          // Add new exercise
          return {
            ...prev,
            [dateKey]: {
              ...existingWorkout,
              exercises: [...existingWorkout.exercises, exerciseToSave]
            }
          };
        }
      });
    }

    setEditingExercise(null);
    setNewExercise({ id: '', name: '', sets: [] });
    setShowExerciseModal(false);
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

  const deleteExercise = (date: Date, exerciseId: string) => {
    const dateKey = date.toISOString().split('T')[0];
    setWorkouts(prev => {
      const dayData = prev[dateKey];
      if (!dayData) return prev;

      const updatedExercises = dayData.exercises.filter(ex => ex.id !== exerciseId);
      return {
        ...prev,
        [dateKey]: {
          ...dayData,
          exercises: updatedExercises
        }
      };
    });
  };

  const logout = () => {
    console.log('Logging out');
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

  return {
    workouts,
    currentDate,
    showExerciseModal,
    selectedDate,
    editingExercise,
    newExercise,
    showDayDetailView,
    isReordering,
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
  };
};

