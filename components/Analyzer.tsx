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

const calculateDailyStats = (exercises: Exercise[]) => {
  let totalTonnage = 0;
  let totalReps = 0;

  exercises.forEach(exercise => {
    exercise.sets.forEach(set => {
      // Handle both complex and regular exercises
      const reps = exercise.isComplex
        ? Object.keys(set)
            .filter(key => key.endsWith('Reps'))
            .reduce((sum, key) => sum + (Number(set[key]) || 0), 0)
        : set.reps || 0;

      totalReps += reps;
      totalTonnage += (set.weight || 0) * reps;
    });
  });

  const avgIntensity = totalReps > 0 ? totalTonnage / totalReps : 0;

  return {
    tonnage: totalTonnage,
    avgIntensity
  };
};

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

  const dailyData = useMemo(() => {
    return Object.entries(workouts).map(([date, workout]) => {
      const { tonnage, avgIntensity } = calculateDailyStats(workout.exercises || []);
      
      return {
        date: new Date(date),
        tonnage,
        avgIntensity,
        exercises: workout.exercises?.length || 0,
        sets: workout.exercises?.reduce((total, ex) => total + ex.sets.length, 0) || 0,
        reps: workout.exercises?.reduce((total, ex) => {
          return total + ex.sets.reduce((setTotal, set) => {
            const reps = ex.isComplex
              ? Object.keys(set)
                  .filter(key => key.endsWith('Reps'))
                  .reduce((sum, key) => sum + (Number(set[key]) || 0), 0)
              : set.reps || 0;
            return setTotal + reps;
          }, 0);
        }, 0) || 0
      };
    }).sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [workouts]);

  const analyzedData = useMemo(() => {
    if (!startDate || !endDate || selectedExercises.length === 0) return null;

    let totalTonnage = 0;
    let totalReps = 0;
    let totalDays = 0;
    const exercisesInRange: Exercise[] = [];
    const exerciseStats: { 
      [key: string]: { 
        tonnage: number; 
        reps: number; 
        averageAbsoluteIntensity: number; 
        sets: number;
      } 
    } = {};

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Initialize exercise stats
    selectedExercises.forEach(name => {
      exerciseStats[name] = {
        tonnage: 0,
        reps: 0,
        averageAbsoluteIntensity: 0,
        sets: 0
      };
    });

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateKey = d.toISOString().split('T')[0];
      const dailyData = workouts[dateKey];
      
      if (dailyData?.exercises) {
        totalDays++;
        const filteredExercises = dailyData.exercises.filter(ex =>
          selectedExercises.includes(ex.name)
        );

        filteredExercises.forEach(exercise => {
          const stats = exerciseStats[exercise.name];
          stats.sets += exercise.sets.length;

          exercise.sets.forEach(set => {
            // Calculate reps based on whether it's a complex exercise
            const reps = exercise.isComplex
              ? Object.keys(set)
                  .filter(key => key.endsWith('Reps'))
                  .reduce((sum, key) => sum + (Number(set[key]) || 0), 0)
              : set.reps || 0;

            const weight = set.weight || 0;
            const setTonnage = weight * reps;

            stats.tonnage += setTonnage;
            stats.reps += reps;
            totalTonnage += setTonnage;
            totalReps += reps;
          });

          // Calculate average intensity after all sets are processed
          stats.averageAbsoluteIntensity = stats.reps > 0 
            ? stats.tonnage / stats.reps 
            : 0;
        });
      }
    }

    // Calculate overall average intensity
    const averageAbsoluteIntensity = totalReps > 0 ? totalTonnage / totalReps : 0;

    return {
      totalDays,
      totalTonnage,
      totalReps,
      averageAbsoluteIntensity,
      exerciseStats,
    };
  }, [workouts, startDate, endDate, selectedExercises]);

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
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

