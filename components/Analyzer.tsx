import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Exercise, Workouts, MacroData } from '../types/workout';
import { calculateTonnage, calculateAverageAbsoluteIntensity } from '../utils/tonnageUtils';
import { formatNumberWithCommas } from '../utils/numberFormat';
import { generateWorkoutPDF } from '../utils/pdfGenerator';
import { FileDown } from 'lucide-react';

interface AnalyzerProps {
  workouts: Workouts;
}

export const Analyzer: React.FC<AnalyzerProps> = ({ workouts }) => {
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const allExercises = useMemo(() => {
    const exercises = new Set<string>();
    Object.values(workouts).forEach(dayData => {
      dayData.exercises.forEach(exercise => exercises.add(exercise.name));
    });
    return Array.from(exercises);
  }, [workouts]);

  const analyzedData = useMemo(() => {
    if (!startDate || !endDate || selectedExercises.length === 0) return null;

    let totalTonnage = 0;
    let totalReps = 0;
    let totalDays = 0;
    const exercisesInRange: Exercise[] = [];
    const exerciseStats: { [key: string]: { tonnage: number; reps: number; averageAbsoluteIntensity: number; clean?: { tonnage: number; reps: number }; jerk?: { tonnage: number; reps: number } } } = {};
    let totalMacros: MacroData = { protein: 0, carbs: 0, fat: 0 };
    let daysWithMacros = 0;
    const start = new Date(startDate);
    const end = new Date(endDate);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateKey = d.toISOString().split('T')[0];
      const dailyData = workouts[dateKey];
      if (dailyData) {
        totalDays++;
        const filteredExercises = dailyData.exercises.filter(ex =>
          selectedExercises.includes(ex.name)
        );
        exercisesInRange.push(...filteredExercises);

        filteredExercises.forEach(exercise => {
          if (exercise.name === 'Clean and Jerk') {
            if (!exerciseStats['Clean and Jerk']) {
              exerciseStats['Clean and Jerk'] = {
                clean: { tonnage: 0, reps: 0 },
                jerk: { tonnage: 0, reps: 0 },
                averageAbsoluteIntensity: 0
              };
            }
            exercise.sets.forEach(set => {
              const cleanReps = set.cleans || 0;
              const jerkReps = set.jerks || 0;
              const cleanTonnage = set.weight * cleanReps;
              const jerkTonnage = set.weight * jerkReps;

              exerciseStats['Clean and Jerk'].clean.tonnage += cleanTonnage;
              exerciseStats['Clean and Jerk'].clean.reps += cleanReps;
              exerciseStats['Clean and Jerk'].jerk.tonnage += jerkTonnage;
              exerciseStats['Clean and Jerk'].jerk.reps += jerkReps;

              totalTonnage += cleanTonnage + jerkTonnage;
              totalReps += cleanReps + jerkReps;
            });
          } else {
            if (!exerciseStats[exercise.name]) {
              exerciseStats[exercise.name] = { tonnage: 0, reps: 0, averageAbsoluteIntensity: 0 };
            }
            const exerciseTonnage = calculateTonnage([exercise])[exercise.name];
            exerciseStats[exercise.name].tonnage += exerciseTonnage;
            totalTonnage += exerciseTonnage;
            exercise.sets.forEach(set => {
              exerciseStats[exercise.name].reps += set.reps;
              totalReps += set.reps;
            });
          }
        });

        if (dailyData.macros) {
          totalMacros.protein += dailyData.macros.protein;
          totalMacros.carbs += dailyData.macros.carbs;
          totalMacros.fat += dailyData.macros.fat;
          daysWithMacros++;
        }
      }
    }

    // Calculate average absolute intensity for each exercise and overall
    const averageAbsoluteIntensity = calculateAverageAbsoluteIntensity(exercisesInRange);
    Object.keys(exerciseStats).forEach(exerciseName => {
      if (exerciseName === 'Clean and Jerk') {
        exerciseStats['Clean and Jerk'].averageAbsoluteIntensity = (exerciseStats['Clean and Jerk'].clean.tonnage + exerciseStats['Clean and Jerk'].jerk.tonnage) / (exerciseStats['Clean and Jerk'].clean.reps + exerciseStats['Clean and Jerk'].jerk.reps);
      } else {
        exerciseStats[exerciseName].averageAbsoluteIntensity = exerciseStats[exerciseName].tonnage / exerciseStats[exerciseName].reps;
      }
    });


    const averageMacros = daysWithMacros > 0 ? {
      protein: totalMacros.protein / daysWithMacros,
      carbs: totalMacros.carbs / daysWithMacros,
      fat: totalMacros.fat / daysWithMacros
    } : null;

    return {
      totalTonnage,
      totalReps,
      averageAbsoluteIntensity,
      exerciseStats,
      averageMacros,
      totalDays
    };
  }, [workouts, selectedExercises, startDate, endDate]);

  const handleExport = () => {
    if (!startDate || !endDate) {
      alert('Please select a date range first');
      return;
    }
    generateWorkoutPDF(workouts, new Date(startDate), new Date(endDate));
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-2xl font-bold">Workout Analyzer</CardTitle>
          <Button 
            onClick={handleExport}
            className="flex items-center gap-2"
          >
            <FileDown className="h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium mb-2">Select Exercises</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {allExercises.map(exercise => (
                <div key={exercise} className="flex items-center space-x-2">
                  <Checkbox
                    id={`exercise-${exercise}`}
                    checked={selectedExercises.includes(exercise)}
                    onCheckedChange={(checked) => {
                      setSelectedExercises(prev =>
                        checked
                          ? [...prev, exercise]
                          : prev.filter(e => e !== exercise)
                      );
                    }}
                  />
                  <Label htmlFor={`exercise-${exercise}`}>{exercise}</Label>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
          {analyzedData && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Overall Statistics</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-3">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm font-semibold text-blue-700">Total Tonnage</p>
                    <p className="text-2xl font-bold">{formatNumberWithCommas(Math.round(analyzedData.totalTonnage))} kg</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm font-semibold text-green-700">Total Reps</p>
                    <p className="text-2xl font-bold">{formatNumberWithCommas(analyzedData.totalReps)}</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <p className="text-sm font-semibold text-purple-700">Avg Absolute Intensity</p>
                    <p className="text-2xl font-bold">{formatNumberWithCommas(Math.round(analyzedData.averageAbsoluteIntensity))} kg</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Exercise Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {Object.entries(analyzedData.exerciseStats).map(([exercise, stats]) => (
                      <Card key={exercise} className="overflow-hidden">
                        <CardHeader className="bg-gray-100 p-4">
                          <CardTitle className="text-lg">{exercise}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4">
                          {exercise === 'Clean and Jerk' ? (
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <h4 className="font-semibold">Clean</h4>
                                <div className="flex justify-between items-center">
                                  <span className="text-sm font-medium text-gray-500">Tonnage</span>
                                  <span className="text-lg font-bold text-blue-600">{formatNumberWithCommas(Math.round(stats.clean.tonnage))} kg</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-sm font-medium text-gray-500">Reps</span>
                                  <span className="text-lg font-bold text-green-600">{formatNumberWithCommas(stats.clean.reps)}</span>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <h4 className="font-semibold">Jerk</h4>
                                <div className="flex justify-between items-center">
                                  <span className="text-sm font-medium text-gray-500">Tonnage</span>
                                  <span className="text-lg font-bold text-blue-600">{formatNumberWithCommas(Math.round(stats.jerk.tonnage))} kg</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-sm font-medium text-gray-500">Reps</span>
                                  <span className="text-lg font-bold text-green-600">{formatNumberWithCommas(stats.jerk.reps)}</span>
                                </div>
                              </div>
                              <div className="space-y-2 pt-2 border-t">
                                <h4 className="font-semibold">Total</h4>
                                <div className="flex justify-between items-center">
                                  <span className="text-sm font-medium text-gray-500">Tonnage</span>
                                  <span className="text-lg font-bold text-blue-600">
                                    {formatNumberWithCommas(Math.round(stats.clean.tonnage + stats.jerk.tonnage))} kg
                                  </span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-sm font-medium text-gray-500">Reps</span>
                                  <span className="text-lg font-bold text-green-600">
                                    {formatNumberWithCommas(stats.clean.reps + stats.jerk.reps)}
                                  </span>
                                </div>
                              </div>
                              <div className="flex justify-between items-center pt-2 border-t">
                                <span className="text-sm font-medium text-gray-500">Avg Intensity</span>
                                <span className="text-lg font-bold text-purple-600">
                                  {formatNumberWithCommas(Math.round((stats.clean.tonnage + stats.jerk.tonnage) / (stats.clean.reps + stats.jerk.reps)))} kg
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-500">Tonnage</span>
                                <span className="text-lg font-bold text-blue-600">{formatNumberWithCommas(Math.round(stats.tonnage))} kg</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-500">Reps</span>
                                <span className="text-lg font-bold text-green-600">{formatNumberWithCommas(stats.reps)}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-500">Avg Intensity</span>
                                <span className="text-lg font-bold text-purple-600">{formatNumberWithCommas(Math.round(stats.averageAbsoluteIntensity))} kg</span>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
              {analyzedData.averageMacros && (
                <Card>
                  <CardHeader>
                    <CardTitle>Average Macros (over {analyzedData.totalDays} days)</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-3">
                    <div className="bg-red-50 p-4 rounded-lg">
                      <p className="text-sm font-semibold text-red-700">Protein</p>
                      <p className="text-2xl font-bold">{formatNumberWithCommas(Math.round(analyzedData.averageMacros.protein))} g</p>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <p className="text-sm font-semibold text-yellow-700">Carbs</p>
                      <p className="text-2xl font-bold">{formatNumberWithCommas(Math.round(analyzedData.averageMacros.carbs))} g</p>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <p className="text-sm font-semibold text-orange-700">Fat</p>
                      <p className="text-2xl font-bold">{formatNumberWithCommas(Math.round(analyzedData.averageMacros.fat))} g</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

