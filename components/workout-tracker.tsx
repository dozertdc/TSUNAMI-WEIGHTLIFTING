import React, { useMemo, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Edit, ChevronDown, ChevronUp, GripVertical } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useWorkoutState } from '../hooks/useWorkoutState';
import { ExerciseModal } from './ExerciseModal';
import { Analyzer } from './Analyzer';
import { MaximumsPage } from './MaximumsPage';
import { MacroCalculator } from './MacroCalculator';
import { ExerciseList } from './ExerciseList';
import { formatDate, getDaysInMonth } from '../utils/dateUtils';
import { calculateTonnage, calculateWeeklyTonnage, calculateMonthlyTonnage, calculateAverageAbsoluteIntensity } from '../utils/tonnageUtils';
import { Maximums, MacroData, Exercise } from '../types/workout';
import { formatNumberWithCommas } from '../utils/numberFormat';
import { useRouter } from 'next/navigation'
import Image from 'next/image';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const commonSelectTriggerStyles = "bg-black text-white hover:bg-gray-800 hover:text-white h-9 px-3 text-sm font-bold";
const commonSelectContentStyles = "bg-black text-white border border-gray-700";
const commonSelectItemStyles = "cursor-pointer font-bold hover:bg-gray-800 hover:text-white focus:bg-gray-800 focus:text-white";

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
    maximums,
    setMaximums,
    logout,
  } = useWorkoutState();

  const [showAnalyzer, setShowAnalyzer] = useState(false);
  const [showMaximums, setShowMaximums] = useState(false);
  const [showExerciseList, setShowExerciseList] = useState(false);
  const [showMacroCalculator, setShowMacroCalculator] = useState(false);
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [users, setUsers] = useState<Array<{ id: string; firstName: string; lastName: string }>>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('isAuthenticated')
    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [router])

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/users/users', {
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
  }, []); // Remove selectedUserId from dependency array to prevent loops

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

  const handleLogout = () => {
    console.log('Logging out');
    logout();
    router.push('/login')
  };

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

  const handleUserChange = (userId: string) => {
    setSelectedUserId(userId);
    // Here you could fetch the selected user's workouts
  };

  const handlePlanWorkout = (date: Date) => {
    // Implementation of handlePlanWorkout
  };

  const handleCompleteWorkout = (date: Date) => {
    // Implementation of handleCompleteWorkout
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
          <Button onClick={handleLogout}>Logout</Button>
        </div>
      </div>

      {showMaximums ? (
        <MaximumsPage maximums={maximums} updateMaximums={setMaximums} />
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
            <div className="flex items-center space-x-4">
              <Select
                value={selectedUserId}
                onValueChange={handleUserChange}
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

              <CardTitle className="text-2xl font-bold flex space-x-4">
                <Select
                  value={currentDate.getMonth().toString()}
                  onValueChange={handleMonthChange}
                >
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

                <Select
                  value={currentDate.getFullYear().toString()}
                  onValueChange={handleYearChange}
                >
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
              </CardTitle>
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
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-semibold">{formatDate(day.date)}</span>
                          {dayData?.status === 'planned' && (
                            <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                              Planned
                            </Badge>
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

