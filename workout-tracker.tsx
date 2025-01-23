import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Edit, ChevronDown, ChevronUp, GripVertical } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useWorkoutState } from './hooks/useWorkoutState';
import { ExerciseModal } from './components/ExerciseModal';
import { DayDetailView } from './components/DayDetailView';
import { Analyzer } from './components/Analyzer';
import { MaximumsPage } from './components/MaximumsPage';
import { MacroCalculator } from './components/MacroCalculator';
import { ExerciseList } from './components/ExerciseList';
import { formatDate, getDaysInMonth } from './utils/dateUtils';
import { calculateTonnage, calculateWeeklyTonnage, calculateMonthlyTonnage, calculateAverageAbsoluteIntensity } from './utils/tonnageUtils';
import { Maximums, MacroData, Exercise } from './types/workout';
import { formatNumberWithCommas } from './utils/numberFormat';
import { useRouter } from 'next/navigation'
import Image from 'next/image';

const WorkoutTracker: React.FC = () => {
  const router = useRouter();
  const {
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
    logout,
  } = useWorkoutState();

  const [showAnalyzer, setShowAnalyzer] = useState(false);
  const [showMaximums, setShowMaximums] = useState(false);
  const [showExerciseList, setShowExerciseList] = useState(false);
  const [maximums, setMaximums] = useState<Maximums>({});
  const [showMacroCalculator, setShowMacroCalculator] = useState(false);
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());

  const weeklyTonnage = useMemo(() => calculateWeeklyTonnage(currentDate, workouts), [currentDate, workouts]);
  const monthlyTonnage = useMemo(() => calculateMonthlyTonnage(currentDate, workouts), [currentDate, workouts]);

  const updateMaximums = (newMaximums: Maximums) => {
    setMaximums(newMaximums);
  };

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

  const handleDragEnd = (result: any, date: Date) => {
    if (!result.destination) return;
    reorderExercises(date, result.source.index, result.destination.index);
  };

  const user = true; // Replace with actual user authentication check

  if (!user) {
    router.push('/login');
    return null;
  }

  const calculateExerciseTonnage = (exercise: Exercise) => {
    return calculateTonnage([exercise]);
  };

  const calculateExerciseReps = (exercise: Exercise) => {
    if (exercise.name === 'Clean and Jerk') {
      const cleanReps = exercise.sets.reduce((total, set) => total + (set.cleans || 0), 0);
      const jerkReps = exercise.sets.reduce((total, set) => total + (set.jerks || 0), 0);
      return { total: cleanReps + jerkReps, clean: cleanReps, jerk: jerkReps };
    }
    return { total: exercise.sets.reduce((total, set) => total + set.reps, 0) };
  };

  return (
    <div className="p-4 w-full max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/wave-McwTzchM8YQSVkpgAADjaegFbYZ1oP.png"
            alt="Tsunami Logo"
            width={40}
            height={40}
            className="dark:invert"
          />
          <h1 className="text-3xl font-bold">Tsunami</h1>
        </div>
        <div className="space-x-2">
          <Button onClick={() => {
            setShowAnalyzer(false);
            setShowMaximums(false);
            setShowExerciseList(false);
          }}>
            Calendar
          </Button>
          <Button onClick={() => {
            setShowAnalyzer(true);
            setShowMaximums(false);
            setShowExerciseList(false);
          }}>
            Analyzer
          </Button>
          <Button onClick={() => {
            setShowAnalyzer(false);
            setShowMaximums(true);
            setShowExerciseList(false);
          }}>
            Maximums
          </Button>
          <Button onClick={() => {
            setShowAnalyzer(false);
            setShowMaximums(false);
            setShowExerciseList(true);
          }}>
            Exercise List
          </Button>
          <Button onClick={logout()}>Logout</Button>
        </div>
      </div>

      {showMaximums ? (
        <MaximumsPage maximums={maximums} updateMaximums={updateMaximums} />
      ) : showAnalyzer ? (
        <Analyzer workouts={workouts} />
      ) : showExerciseList ? (
        <ExerciseList
          exercises={exerciseList}
          addExercise={addExerciseToList}
          removeExercise={removeExerciseFromList}
        />
      ) : (
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-2xl font-bold">
              {new Intl.DateTimeFormat('en-US', { 
                month: 'long', 
                year: 'numeric' 
              }).format(currentDate)}
            </CardTitle>
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
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {getDaysInMonth(currentDate).map((day, index) => {
                const dateKey = day.date.toISOString().split('T')[0];
                const dayData = workouts[dateKey];
                const hasWorkout = dayData?.exercises && dayData.exercises.length > 0;
                const isExpanded = expandedDays.has(dateKey);
                const tonnage = hasWorkout ? calculateTonnage(dayData.exercises).total : 0;
                const totalReps = hasWorkout ? dayData.exercises.reduce((total, exercise) => 
                  total + calculateExerciseReps(exercise).total, 0) : 0;
                const averageIntensity = hasWorkout ? calculateAverageAbsoluteIntensity(dayData.exercises) : 0;
                
                return (
                  <Card 
                    key={index}
                    className={`${
                      day.isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                    } ${hasWorkout ? 'border-blue-500' : 'border-gray-200'} transition-all hover:shadow-md`}
                  >
                    <CardHeader className="flex flex-row items-center justify-between py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-lg">
                          {formatDate(day.date)}
                        </span>
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
                    {isExpanded && (
                      <CardContent>
                        {(hasWorkout || (dayData && dayData.macros)) ? (
                          <>
                            <div className="mb-6 p-4 bg-gray-100 rounded-lg">
                              <h3 className="text-lg font-semibold mb-3">Day Summary</h3>
                              <div className="grid grid-cols-3 gap-4 text-sm">
                                <div className="bg-blue-50 p-2 rounded-md">
                                  <p className="font-semibold text-blue-700">Total Reps</p>
                                  <p className="text-2xl font-bold">{formatNumberWithCommas(totalReps)}</p>
                                </div>
                                <div className="bg-green-50 p-2 rounded-md">
                                  <p className="font-semibold text-green-700">Avg Intensity</p>
                                  <p className="text-2xl font-bold">{formatNumberWithCommas(Math.round(averageIntensity))} kg</p>
                                </div>
                                <div className="bg-purple-50 p-2 rounded-md">
                                  <p className="font-semibold text-purple-700">Total Tonnage</p>
                                  <p className="text-2xl font-bold">{formatNumberWithCommas(Math.round(tonnage))} kg</p>
                                </div>
                              </div>
                            </div>
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
                            {dayData.exercises.map((exercise: Exercise, index: number) => (
                              <Card key={exercise.id} className="mb-4">
                                <CardHeader className="flex flex-row items-center justify-between py-2">
                                  <CardTitle className="text-lg">{exercise.name}</CardTitle>
                                  <Button variant="ghost" size="sm" onClick={() => startEditingExercise(exercise)}>
                                    Edit
                                  </Button>
                                </CardHeader>
                                <CardContent>
                                  <table className="w-full">
                                    <thead>
                                      <tr>
                                        <th className="text-left">Set</th>
                                        <th className="text-left">Weight (kg)</th>
                                        {exercise.name === 'Clean and Jerk' ? (
                                          <>
                                            <th className="text-left">Cleans</th>
                                            <th className="text-left">Jerks</th>
                                          </>
                                        ) : (
                                          <th className="text-left">Reps</th>
                                        )}
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {exercise.sets.map((set, index) => (
                                        <tr key={index}>
                                          <td>{index + 1}</td>
                                          <td>{set.weight}</td>
                                          {exercise.name === 'Clean and Jerk' ? (
                                            <>
                                              <td>{set.cleans}</td>
                                              <td>{set.jerks}</td>
                                            </>
                                          ) : (
                                            <td>{set.reps}</td>
                                          )}
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                  <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                                    <div className="bg-blue-50 p-2 rounded-md">
                                      <p className="font-semibold text-blue-700">Total Reps</p>
                                      <p className="text-2xl font-bold">
                                        {formatNumberWithCommas(calculateExerciseReps(exercise).total)}
                                        {exercise.name === 'Clean and Jerk' && (
                                          <span className="text-sm font-normal">
                                            <br />({calculateExerciseReps(exercise).clean} cleans, {calculateExerciseReps(exercise).jerk} jerks)
                                          </span>
                                        )}
                                      </p>
                                    </div>
                                    <div className="bg-green-50 p-2 rounded-md">
                                      <p className="font-semibold text-green-700">Avg Intensity</p>
                                      <p className="text-2xl font-bold">{formatNumberWithCommas(Math.round(calculateAverageAbsoluteIntensity([exercise])))} kg</p>
                                    </div>
                                    <div className="bg-purple-50 p-2 rounded-md">
                                      <p className="font-semibold text-purple-700">Tonnage</p>
                                      <p className="text-2xl font-bold">
                                        {formatNumberWithCommas(Math.round(calculateExerciseTonnage(exercise).total))} kg
                                        {exercise.name === 'Clean and Jerk' && (
                                          <span className="text-sm font-normal">
                                            <br />({formatNumberWithCommas(Math.round(calculateExerciseTonnage(exercise)['Clean and Jerk']))} kg)
                                          </span>
                                        )}
                                      </p>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
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
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Card>
                <CardContent className="py-4">
                  <div className="text-lg font-medium">Weekly Tonnage: {formatNumberWithCommas(Math.round(weeklyTonnage))} kg</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-4">
                  <div className="text-lg font-medium">Monthly Tonnage: {formatNumberWithCommas(Math.round(monthlyTonnage))} kg</div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      )}

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
                  // Force a re-render by updating the state
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
    </div>
  );
};

export default WorkoutTracker;

