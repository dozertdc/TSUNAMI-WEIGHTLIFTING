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
      setEditingExercise(prev => ({
        ...prev!,
        sets: [...prev!.sets, { weight: 0, reps: 0, cleans: 0, jerks: 0 }]
      }));
    } else {
      setNewExercise(prev => ({
        ...prev,
        sets: [...prev.sets, { weight: 0, reps: 0, cleans: 0, jerks: 0 }]
      }));
    }
  };

  const updateSet = (index: number, field: keyof Set, value: string) => {
    const updateExercise = (exercise: Exercise): Exercise => ({
      ...exercise,
      sets: exercise.sets.map((set, i) => 
        i === index ? { ...set, [field]: parseFloat(value) || 0 } : set
      )
    });

    if (editingExercise) {
      setEditingExercise(prev => updateExercise(prev!));
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

  const saveExercise = () => {
    if (!selectedDate) return;
    
    const dateKey = selectedDate.toISOString().split('T')[0];
    const exerciseToSave = editingExercise || newExercise;

    if (exerciseToSave.name && exerciseToSave.sets.length > 0) {
      setWorkouts(prev => {
        const updatedWorkouts = { ...prev };
        if (!updatedWorkouts[dateKey]) {
          updatedWorkouts[dateKey] = { exercises: [] };
        }
        if (!updatedWorkouts[dateKey].exercises) {
          updatedWorkouts[dateKey].exercises = [];
        }
        if (editingExercise) {
          updatedWorkouts[dateKey].exercises = updatedWorkouts[dateKey].exercises.map(ex => 
            ex.id === editingExercise.id ? { ...exerciseToSave, id: ex.id } : ex
          );
        } else {
          const newId = Date.now().toString();
          updatedWorkouts[dateKey].exercises.push({ ...exerciseToSave, id: newId });
        }
        return updatedWorkouts;
      });
    }
    
    setNewExercise({ id: '', name: '', sets: [] });
    setEditingExercise(null);
    setShowExerciseModal(false);
  };

  const startEditingExercise = (exercise: Exercise) => {
    setEditingExercise({ ...exercise });
    setShowExerciseModal(true);
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
    logout,
  };
};

