'use client';

import React, { useMemo, useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Plus, Edit, ChevronDown, ChevronUp, Trash, CheckCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useWorkoutState } from '../hooks/useWorkoutState';
import { ExerciseModal } from './ExerciseModal';
import { MacroCalculator } from './MacroCalculator';
import { formatDate, getDaysInMonth } from '../utils/dateUtils';
import { calculateTonnage, calculateWeeklyTonnage, calculateMonthlyTonnage, calculateAverageAbsoluteIntensity } from '../utils/tonnageUtils';
import { formatNumberWithCommas } from '../utils/numberFormat';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog"
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';
import { DragDropContextWrapper } from './DragDropContextWrapper';

const commonSelectTriggerStyles = "bg-black text-white hover:bg-gray-800 hover:text-white h-9 px-3 text-sm font-bold";
const commonSelectContentStyles = "bg-black text-white border border-gray-700";
const commonSelectItemStyles = "cursor-pointer font-bold hover:bg-gray-800 hover:text-white focus:bg-gray-800 focus:text-white";

const WorkoutTracker: React.FC = () => {
  const {
    workouts,
    currentDate,
    showExerciseModal,
    selectedDate,
    editingExercise,
    newExercise,
    setCurrentDate,
    setShowExerciseModal,
    setSelectedDate,
    setNewExercise,
    setEditingExercise,
    addSet,
    updateSet,
    saveExercise,
    startEditingExercise,
    saveMacros,
    setWorkouts,
    exerciseList,
    deleteExercise,
    removeSet,
    selectedUserId,
    setSelectedUserId,
    updateWorkoutStatus,
  } = useWorkoutState();

  const [showMacroCalculator, setShowMacroCalculator] = useState(false);
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [users, setUsers] = useState<Array<{ id: string; firstName: string; lastName: string }>>([]);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    exerciseId: string;
    workoutId: string;
  } | null>(null);
  const [isReordering, setIsReordering] = useState(false);
  const hasScrolledToToday = useRef(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const user = localStorage.getItem('user');
        if (!user) {
          console.error('No user found in localStorage');
          return;
        }
        const userId = JSON.parse(user).id;

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${userId}/user-and-athletes`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include'
        });
        
        if (!response.ok) throw new Error('Failed to fetch users');
        const data = await response.json();
        
        // Transform the data to match the expected format
        const formattedUsers = data.map((user: any) => ({
          id: user.id.toString(),
          firstName: user.first_name,
          lastName: user.last_name
        }));
        
        setUsers(formattedUsers);
        // Only set selected user if none is selected yet
        if (!selectedUserId && formattedUsers.length > 0) {
          setSelectedUserId(formattedUsers[0].id);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
  }, []);

  const getLocalDateString = (date: Date) => {
    return new Date(date.getTime() - (date.getTimezoneOffset() * 60000))
      .toISOString()
      .split('T')[0];
  };

  const scrollToToday = () => {
    const today = new Date();
    const todayStr = getLocalDateString(today);
    const element = document.getElementById(`day-${todayStr}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  useEffect(() => {
    if (workouts && !hasScrolledToToday.current) {
      const timer = setTimeout(() => {
        scrollToToday();
        hasScrolledToToday.current = true;  // Mark that we've scrolled
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [workouts]);

  const handleSaveMacros = (macros: MacroData) => {
    if (selectedDate) {
      saveMacros(selectedDate, macros);
      setShowMacroCalculator(false);
    }
  };

  const toggleDayExpanded = (dateKey: string) => {
    setExpandedDays(prev => {
      const newSet = new Set(prev);
      if (newSet.has(dateKey)) {
        newSet.delete(dateKey);
      } else {
        newSet.add(dateKey);
      }
      return newSet;
    });
  };

  const handleEditMacros = (date: Date) => {
    setSelectedDate(date);
    setShowMacroCalculator(true);
  };

  const handleMonthChange = (month: string) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(parseInt(month));
    setCurrentDate(newDate);
  };

  const handleYearChange = (year: string) => {
    const newDate = new Date(currentDate);
    newDate.setFullYear(parseInt(year));
    setCurrentDate(newDate);
  };

  const getMonthOptions = () => {
    const months = [];
    for (let month = 0; month < 12; month++) {
      const date = new Date(2000, month, 1);
      months.push({
        value: month.toString(),
        label: new Intl.DateTimeFormat('en-US', { month: 'long' }).format(date)
      });
    }
    return months;
  };

  const getYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = currentYear - 5; year <= currentYear + 5; year++) {
      years.push({
        value: year.toString(),
        label: year.toString()
      });
    }
    return years;
  };

  const handleUserChangeFromDropdown = (userId: string) => {
    setSelectedUserId(userId);
  };

  // Add these calculations near your other useMemo hooks
  const weeklyStats = useMemo(() => {
    const endDate = new Date();  // Today
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - 6);  // Previous 6 days
    
    let totalSets = 0;
    let totalReps = 0;
    let totalTonnage = 0;
    let exerciseCount = 0;

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateKey = d.toISOString().split('T')[0];
      const dayData = workouts[dateKey];

      if (dayData?.exercises) {
        dayData.exercises.forEach(exercise => {
          exerciseCount++;
          totalSets += exercise.sets.length;
          
          exercise.sets.forEach(set => {
            let setReps = 0;
            if (exercise.isComplex) {
              setReps = Object.keys(set)
                .filter(key => key.endsWith('Reps'))
                .reduce((sum, key) => sum + (Number(set[key]) || 0), 0);
            } else {
              setReps = set.reps || 0;
            }
            totalReps += setReps;
            totalTonnage += (set.weight || 0) * setReps;
          });
        });
      }
    }

    return {
      sets: totalSets,
      reps: totalReps,
      tonnage: totalTonnage,
      avgIntensity: totalReps > 0 ? totalTonnage / totalReps : 0
    };
  }, [workouts]);

  // Calculate Acute:Chronic Workload Ratio
  const acwr = useMemo(() => {
    const acute = weeklyStats.tonnage; // 7-day tonnage
    
    // Calculate 28-day average tonnage
    const fourWeeksAgo = new Date(currentDate);
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
    
    let chronicTonnage = 0;
    let daysWithWorkouts = 0;

    for (let i = 0; i < 28; i++) {
      const date = new Date(fourWeeksAgo);
      date.setDate(date.getDate() + i);
      const dateKey = date.toISOString().split('T')[0];
      const dayData = workouts[dateKey];

      if (dayData?.exercises && dayData.exercises.length > 0) {
        daysWithWorkouts++;
        dayData.exercises.forEach(exercise => {
          exercise.sets.forEach(set => {
            const reps = exercise.isComplex
              ? Object.keys(set)
                  .filter(key => key.endsWith('Reps'))
                  .reduce((sum, key) => sum + (Number(set[key]) || 0), 0)
              : set.reps || 0;
            
            chronicTonnage += (set.weight || 0) * reps;
          });
        });
      }
    }

    // Only calculate ACWR if we have enough data
    if (daysWithWorkouts < 7) {
      return 0; // Return 0 or null to indicate insufficient data
    }

    const chronicAverage = chronicTonnage / 4; // 28-day tonnage divided by 4 weeks
    return chronicAverage > 0 ? acute / chronicAverage : 0;
  }, [currentDate, workouts, weeklyStats.tonnage]);

  // Add this new useMemo calculation after weeklyStats
  const monthlyStats = useMemo(() => {
    const endDate = new Date();  // Today
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - 27);  // Previous 27 days
    
    let totalSets = 0;
    let totalReps = 0;
    let totalTonnage = 0;
    let exerciseCount = 0;

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateKey = d.toISOString().split('T')[0];
      const dayData = workouts[dateKey];

      if (dayData?.exercises) {
        dayData.exercises.forEach(exercise => {
          exerciseCount++;
          totalSets += exercise.sets.length;
          
          exercise.sets.forEach(set => {
            let setReps = 0;
            if (exercise.isComplex) {
              setReps = Object.keys(set)
                .filter(key => key.endsWith('Reps'))
                .reduce((sum, key) => sum + (Number(set[key]) || 0), 0);
            } else {
              setReps = set.reps || 0;
            }
            totalReps += setReps;
            totalTonnage += (set.weight || 0) * setReps;
          });
        });
      }
    }

    return {
      sets: totalSets,
      reps: totalReps,
      tonnage: totalTonnage,
      avgIntensity: totalReps > 0 ? totalTonnage / totalReps : 0
    };
  }, [workouts]);

  const getAvailableExercises = () => {
    try {
      const savedExercises = localStorage.getItem('exerciseList');
      if (!savedExercises) return [];
      
      const exercises = JSON.parse(savedExercises);
      return exercises.map((exercise: { name: string }) => exercise.name);
    } catch (error) {
      console.error('Error getting available exercises:', error);
      return [];
    }
  };

  const handleDeleteExercise = (exerciseId: string, workoutId: string) => {
    setDeleteConfirmation({ isOpen: true, exerciseId, workoutId });
  };

  const handleReorder = async (workoutId: string, result: any) => {
    if (!result.destination) return;

    const dateKey = result.draggableId.split('-').slice(0, 3).join('-');
    const workout = workouts[dateKey];
    
    if (!workout || !workout.exercises) {
      console.error('No workout found for date:', dateKey);
      return;
    }

    const items = Array.from(workout.exercises);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update local state immediately
    setWorkouts(prev => ({
      ...prev,
      [dateKey]: {
        ...prev[dateKey],
        exercises: items
      }
    }));

    // Update the database
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/workouts/${workout.id}/reorder`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          exerciseIds: items.map(exercise => exercise.id)
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update exercise order');
      }
    } catch (error) {
      console.error('Error updating exercise order:', error);
      // Revert the local state if the server update fails
      setWorkouts(prev => ({
        ...prev,
        [dateKey]: workout
      }));
    }
  };

  return (
    <div>
      <Card>
        <CardHeader className="sticky top-16 z-10 bg-white border-b">
          {/* User and Date Selection */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Select
                value={selectedUserId}
                onValueChange={handleUserChangeFromDropdown}
              >
                <SelectTrigger className={`${commonSelectTriggerStyles} w-[200px]`}>
                  <SelectValue placeholder="Select User">
                    {users.find(u => u.id === selectedUserId)
                      ? `${users.find(u => u.id === selectedUserId)?.firstName} ${users.find(u => u.id === selectedUserId)?.lastName}`
                      : 'Select User'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className={commonSelectContentStyles}>
                  {users.map(user => (
                    <SelectItem 
                      key={user.id} 
                      value={user.id}
                      className={commonSelectItemStyles}
                    >
                      {`${user.firstName} ${user.lastName}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2">
                <Select value={currentDate.getMonth().toString()} onValueChange={handleMonthChange}>
                  <SelectTrigger className={`${commonSelectTriggerStyles} w-[160px]`}>
                    <SelectValue>
                      {new Intl.DateTimeFormat('en-US', { month: 'long' }).format(currentDate)}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className={commonSelectContentStyles}>
                    {getMonthOptions().map(option => (
                      <SelectItem 
                        key={option.value} 
                        value={option.value}
                        className={commonSelectItemStyles}
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={currentDate.getFullYear().toString()} onValueChange={handleYearChange}>
                  <SelectTrigger className={`${commonSelectTriggerStyles} w-[100px]`}>
                    <SelectValue>
                      {currentDate.getFullYear()}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className={commonSelectContentStyles}>
                    {getYearOptions().map(option => (
                      <SelectItem 
                        key={option.value} 
                        value={option.value}
                        className={commonSelectItemStyles}
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Summary Statistics */}
          <div className="space-y-2">
            {/* Weekly Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 bg-gray-50 p-2 rounded-lg text-xs">
              <div className="bg-blue-50 p-2 rounded-lg">
                <p className="font-semibold text-blue-700">Weekly Sets</p>
                <p className="text-lg font-bold">{formatNumberWithCommas(weeklyStats.sets)}</p>
              </div>
              <div className="bg-green-50 p-2 rounded-lg">
                <p className="font-semibold text-green-700">Weekly Reps</p>
                <p className="text-lg font-bold">{formatNumberWithCommas(weeklyStats.reps)}</p>
              </div>
              <div className="bg-purple-50 p-2 rounded-lg">
                <p className="font-semibold text-purple-700">Weekly Tonnage</p>
                <p className="text-lg font-bold">{formatNumberWithCommas(Math.round(weeklyStats.tonnage))} kg</p>
              </div>
              <div className="bg-orange-50 p-2 rounded-lg">
                <p className="font-semibold text-orange-700">Weekly Intensity</p>
                <p className="text-lg font-bold">{formatNumberWithCommas(Math.round(weeklyStats.avgIntensity))} kg</p>
              </div>
              <div className="bg-indigo-50 p-2 rounded-lg">
                <p className="font-semibold text-indigo-700">ACWR</p>
                <p className="text-lg font-bold">{acwr.toFixed(2)}</p>
              </div>
            </div>

            {/* Monthly Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 bg-gray-50 p-2 rounded-lg text-xs">
              <div className="bg-blue-50 p-2 rounded-lg">
                <p className="font-semibold text-blue-700">Monthly Sets</p>
                <p className="text-lg font-bold">{formatNumberWithCommas(monthlyStats.sets)}</p>
              </div>
              <div className="bg-green-50 p-2 rounded-lg">
                <p className="font-semibold text-green-700">Monthly Reps</p>
                <p className="text-lg font-bold">{formatNumberWithCommas(monthlyStats.reps)}</p>
              </div>
              <div className="bg-purple-50 p-2 rounded-lg">
                <p className="font-semibold text-purple-700">Monthly Tonnage</p>
                <p className="text-lg font-bold">{formatNumberWithCommas(Math.round(monthlyStats.tonnage))} kg</p>
              </div>
              <div className="bg-orange-50 p-2 rounded-lg">
                <p className="font-semibold text-orange-700">Monthly Intensity</p>
                <p className="text-lg font-bold">{formatNumberWithCommas(Math.round(monthlyStats.avgIntensity))} kg</p>
              </div>
              <div className="bg-indigo-50 p-2 rounded-lg">
                <p className="font-semibold text-indigo-700">Monthly Avg/Day</p>
                <p className="text-lg font-bold">{formatNumberWithCommas(Math.round(monthlyStats.tonnage / 30))} kg</p>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-4 mt-4">
            {getDaysInMonth(currentDate).map((day, index) => {
              const dateKey = day.date.toISOString().split('T')[0];
              const dayData = workouts[dateKey];
              const hasWorkout = dayData?.exercises && dayData.exercises.length > 0;
              const isExpanded = expandedDays.has(dateKey);
              const tonnage = hasWorkout ? calculateTonnage(dayData.exercises).total : 0;
              const totalReps = hasWorkout ? dayData.exercises.reduce((total, exercise) => {
                if (exercise.isComplex) {
                  // For complex exercises, sum up all reps from all parts
                  return total + exercise.sets.reduce((setTotal, set) => {
                    return setTotal + Object.keys(set)
                      .filter(key => key.endsWith('Reps'))
                      .reduce((sum, key) => sum + (Number(set[key]) || 0), 0);
                  }, 0);
                } else {
                  // For regular exercises
                  return total + exercise.sets.reduce((setTotal, set) => 
                    setTotal + (set.reps || 0), 0
                  );
                }
              }, 0) : 0;
              const averageIntensity = hasWorkout ? calculateAverageAbsoluteIntensity(dayData.exercises) : 0;
              const totalSets = hasWorkout ? dayData.exercises.reduce((total, exercise) => 
                total + exercise.sets.length, 0
              ) : 0;
              
              return (
                <Card 
                  key={index}
                  id={`day-${dateKey}`}
                  className={`${
                    day.isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                  } ${hasWorkout ? 'border-blue-500' : 'border-gray-200'} 
                    transition-all hover:shadow-md ${
                    dateKey === getLocalDateString(new Date()) ? 'border-2 border-primary' : ''
                  }`}
                >
                  <CardHeader className="flex flex-row items-center justify-between py-2">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-semibold">{formatDate(day.date)}</span>
                        {dayData?.status === 'planned' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateWorkoutStatus(day.date, 'completed')}
                            className="flex items-center gap-1 h-5 px-2 text-xs font-semibold leading-none bg-yellow-100 text-yellow-800">
                            <CheckCircle className="h-3 w-3" />
                            Mark as Complete
                          </Button>
                        )}
                        {dayData?.status === 'completed' && (
                          <Badge variant="outline" className="bg-green-100 text-green-800">
                            Completed
                          </Badge>
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day.date.getDay()]}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {hasWorkout && (
                        <span className="text-sm font-medium text-blue-600">
                          {dayData.exercises.length} exercise{dayData.exercises.length !== 1 ? 's' : ''}
                        </span>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleDayExpanded(dateKey)}
                      >
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </div>
                  </CardHeader>
                  {hasWorkout && (
                    <div className="px-6 pb-4">
                      <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                        <div className="grid grid-cols-4 gap-4 w-full text-sm">
                          <div className="bg-blue-50 p-2 rounded-md">
                            <p className="font-semibold text-blue-700">Sets</p>
                            <p className="text-2xl font-bold">{formatNumberWithCommas(totalSets)}</p>
                          </div>
                          <div className="bg-green-50 p-2 rounded-md">
                            <p className="font-semibold text-green-700">Reps</p>
                            <p className="text-2xl font-bold">{formatNumberWithCommas(totalReps)}</p>
                          </div>
                          <div className="bg-purple-50 p-2 rounded-md">
                            <p className="font-semibold text-purple-700">Tonnage</p>
                            <p className="text-2xl font-bold">{formatNumberWithCommas(Math.round(tonnage))} kg</p>
                          </div>
                          <div className="bg-orange-50 p-2 rounded-md">
                            <p className="font-semibold text-orange-700">Avg Intensity</p>
                            <p className="text-2xl font-bold">{formatNumberWithCommas(Math.round(averageIntensity))} kg</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {isExpanded && (
                    <CardContent>
                      {(hasWorkout || (dayData && dayData.macros)) ? (
                        <>
                          {dayData && dayData.macros ? (
                            <div className="mb-4 p-4 bg-yellow-50 rounded-lg flex justify-between items-center">
                              <div>
                                <p className="font-semibold text-yellow-700">Macros</p>
                                <p className="text-sm">
                                  P: <span className="font-bold">{formatNumberWithCommas(dayData.macros.protein)}</span>g | 
                                  C: <span className="font-bold">{formatNumberWithCommas(dayData.macros.carbs)}</span>g | 
                                  F: <span className="font-bold">{formatNumberWithCommas(dayData.macros.fat)}</span>g
                                </p>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditMacros(day.date);
                                }}
                              >
                                Edit Macros
                              </Button>
                            </div>
                          ) : null}
                          {hasWorkout && (
                            <DragDropContextWrapper onDragEnd={(result) => handleReorder(dayData.id, result)}>
                              <Droppable droppableId={`workout-${dateKey}`} isDropDisabled={false}>
                                {(provided) => (
                                  <div
                                    {...provided.droppableProps}
                                    ref={provided.innerRef}
                                    className="space-y-4"
                                  >
                                    {dayData.exercises.map((exercise, index) => (
                                      <Draggable
                                        key={exercise.id}
                                        draggableId={`${dateKey}-${exercise.id}`}
                                        index={index}
                                        isDragDisabled={false}
                                      >
                                        {(provided) => (
                                          <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            {...provided.dragHandleProps}
                                            className="mb-4"
                                          >
                                            <Card>
                                              <CardHeader className="flex flex-row items-center justify-between py-2">
                                                <div className="flex items-center gap-2">
                                                  <CardTitle className="text-lg">{exercise.name}</CardTitle>
                                                </div>
                                                <div className="flex gap-2">
                                                  <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    onClick={() => startEditingExercise(exercise, day.date)}
                                                  >
                                                    <Edit className="h-4 w-4" />
                                                  </Button>
                                                  <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDeleteExercise(exercise.id, dateKey)}
                                                    className="text-red-600 hover:text-red-700"
                                                  >
                                                    <Trash className="h-4 w-4" />
                                                  </Button>
                                                </div>
                                              </CardHeader>
                                              <CardContent>
                                                <table className="w-full">
                                                  <thead>
                                                    <tr>
                                                      <th className="text-left">Set</th>
                                                      <th className="text-left">Weight (kg)</th>
                                                      <th className="text-left">Reps</th>
                                                      <th className="text-left">Tonnage (kg)</th>
                                                    </tr>
                                                  </thead>
                                                  <tbody>
                                                    {exercise.sets.map((set, setIndex) => {
                                                      // Calculate total reps for complex exercises
                                                      const totalReps = exercise.isComplex
                                                        ? Object.keys(set)
                                                            .filter(key => key.endsWith('Reps'))
                                                            .reduce((sum, key) => sum + (Number(set[key]) || 0), 0)
                                                        : set.reps || 0;

                                                      // Calculate tonnage for this set
                                                      const setTonnage = (set.weight || 0) * totalReps;

                                                      return (
                                                        <tr key={`${dateKey}-exercise-${index}-set-${setIndex}`}>
                                                          <td>{setIndex + 1}</td>
                                                          <td>{set.weight}</td>
                                                          <td>
                                                            {exercise.isComplex ? (
                                                              <div>
                                                                <div>{totalReps}</div>
                                                                <div className="text-sm text-gray-500">
                                                                  ({exercise.complexParts?.map((part, i) => (
                                                                    <span key={i}>
                                                                      {i > 0 && ' + '}
                                                                      {set[`exercise${i}Reps`] || 0}
                                                                    </span>
                                                                  ))})
                                                                </div>
                                                              </div>
                                                            ) : (
                                                              set.reps
                                                            )}
                                                          </td>
                                                          <td>{formatNumberWithCommas(setTonnage)}</td>
                                                        </tr>
                                                      );
                                                    })}
                                                    <tr className="border-t font-semibold">
                                                      <td>{exercise.sets.length}</td>
                                                      <td>{formatNumberWithCommas(Math.round(
                                                        exercise.sets.reduce((sum, set) => sum + (set.weight || 0), 0) / exercise.sets.length
                                                      ))}</td>
                                                      <td>
                                                        {exercise.isComplex ? (
                                                          <>
                                                            <div>{formatNumberWithCommas(
                                                              exercise.sets.reduce((total, set) => 
                                                                total + Object.keys(set)
                                                                  .filter(key => key.endsWith('Reps'))
                                                                  .reduce((sum, key) => sum + (Number(set[key]) || 0), 0)
                                                              , 0)
                                                            )}</div>
                                                            <div className="text-sm text-gray-500">
                                                              ({exercise.complexParts?.map((part, i) => (
                                                                <span key={i}>
                                                                  {i > 0 && ' + '}
                                                                  {formatNumberWithCommas(
                                                                    exercise.sets.reduce((sum, set) => sum + (Number(set[`exercise${i}Reps`]) || 0), 0)
                                                                  )}
                                                                </span>
                                                              ))})
                                                            </div>
                                                          </>
                                                        ) : (
                                                          formatNumberWithCommas(
                                                            exercise.sets.reduce((sum, set) => sum + (set.reps || 0), 0)
                                                          )
                                                        )}
                                                      </td>
                                                      <td>{formatNumberWithCommas(Math.round(
                                                        exercise.sets.reduce((sum, set) => {
                                                          const totalReps = exercise.isComplex
                                                            ? Object.keys(set)
                                                                .filter(key => key.endsWith('Reps'))
                                                                .reduce((sum, key) => sum + (Number(set[key]) || 0), 0)
                                                            : set.reps || 0;
                                                          return sum + (set.weight || 0) * totalReps;
                                                        }, 0)
                                                      ))}</td>
                                                    </tr>
                                                  </tbody>
                                                </table>
                                              </CardContent>
                                            </Card>
                                          </div>
                                        )}
                                      </Draggable>
                                    ))}
                                    {provided.placeholder}
                                  </div>
                                )}
                              </Droppable>
                            </DragDropContextWrapper>
                          )}
                        </>
                      ) : (
                        <p className="text-center text-muted-foreground">No workout or macros recorded for this day.</p>
                      )}
                      <div className="flex justify-between mt-4 space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDate(day.date);
                            setShowExerciseModal(true);
                          }}
                        >
                          <Plus className="h-4 w-4 mr-2" /> Add Exercise
                        </Button>
                        {(!dayData || !dayData.macros) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditMacros(day.date);
                            }}
                          >
                            <Plus className="h-4 w-4 mr-2" /> Add Macros
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {showExerciseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 modal-overlay">
          <div className="modal-content">
            <ExerciseModal
              exercise={editingExercise || newExercise}
              setExercise={editingExercise ? setEditingExercise : setNewExercise}
              addSet={addSet}
              updateSet={updateSet}
              saveExercise={() => {
                saveExercise();
                if (selectedDate) {
                  const dateKey = selectedDate.toISOString().split('T')[0];
                  setWorkouts(prev => ({ ...prev }));
                }
                setShowExerciseModal(false);
              }}
              closeModal={() => {
                setShowExerciseModal(false);
                setEditingExercise(null);
                setNewExercise({ id: '', name: '', sets: [] });
              }}
              isEditing={!!editingExercise}
              setWorkouts={setWorkouts}
              exerciseList={exerciseList}
              removeSet={removeSet}
              selectedDate={selectedDate}
              getAvailableExercises={getAvailableExercises}
            />
          </div>
        </div>
      )}

      {showMacroCalculator && selectedDate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[70]">
          <MacroCalculator
            initialMacros={workouts[selectedDate.toISOString().split('T')[0]]?.macros}
            onSave={handleSaveMacros}
          />
        </div>
      )}

      <AlertDialog 
        open={deleteConfirmation?.isOpen} 
        onOpenChange={(isOpen) => {
          if (!isOpen) setDeleteConfirmation(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Exercise</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this exercise? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteConfirmation) {
                  const date = new Date(deleteConfirmation.workoutId);
                  deleteExercise(deleteConfirmation.exerciseId, date);
                  setDeleteConfirmation(null);
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default WorkoutTracker;

