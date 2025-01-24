import { Exercise, Workouts } from '../types/workout';

export const calculateTonnage = (exercises: Exercise[]): { total: number } => {
  if (!exercises || exercises.length === 0) return { total: 0 };

  const total = exercises.reduce((acc, exercise) => {
    if (!exercise.sets) return acc;
    
    return acc + exercise.sets.reduce((setAcc, set) => {
      const weight = set.weight || 0;
      if (exercise.name === 'Clean and Jerk') {
        const totalMovements = (set.cleans || 0) + (set.jerks || 0);
        return setAcc + (weight * totalMovements);
      }
      const reps = set.reps || 0;
      return setAcc + (weight * reps);
    }, 0);
  }, 0);

  return { total };
};

export const calculateWeeklyTonnage = (date: Date, workouts: Workouts): number => {
  const endDate = new Date(date);
  endDate.setHours(23, 59, 59, 999); // Set to end of the day

  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - 6); // 6 days before the end date
  startDate.setHours(0, 0, 0, 0); // Set to start of the day

  let weeklyTonnage = 0;

  for (let currentDate = new Date(startDate); currentDate <= endDate; currentDate.setDate(currentDate.getDate() + 1)) {
    const dateKey = currentDate.toISOString().split('T')[0];
    if (workouts[dateKey] && workouts[dateKey].exercises) {
      weeklyTonnage += calculateTonnage(workouts[dateKey].exercises).total;
    }
  }

  return weeklyTonnage;
};

export const calculateMonthlyTonnage = (date: Date, workouts: Workouts): number => {
  const year = date.getFullYear();
  const month = date.getMonth();
  let monthlyTotal = 0;

  // Get all dates in the current month
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  for (let day = 1; day <= daysInMonth; day++) {
    const currentDate = new Date(year, month, day);
    const dateKey = currentDate.toISOString().split('T')[0];
    
    if (workouts[dateKey] && workouts[dateKey].exercises) {
      const dayTonnage = calculateTonnage(workouts[dateKey].exercises);
      monthlyTotal += dayTonnage.total || 0;  // Add null check here
    }
  }

  return monthlyTotal;
};

export const calculateAverageAbsoluteIntensity = (exercises: Exercise[]): number => {
  let totalWeight = 0;
  let totalReps = 0;

  exercises.forEach(exercise => {
    if (exercise.name === 'Clean and Jerk') {
      exercise.sets.forEach(set => {
        totalWeight += set.weight * ((set.cleans || 0) + (set.jerks || 0));
        totalReps += (set.cleans || 0) + (set.jerks || 0);
      });
    } else {
      exercise.sets.forEach(set => {
        totalWeight += set.weight * set.reps;
        totalReps += set.reps;
      });
    }
  });

  return totalReps > 0 ? totalWeight / totalReps : 0;
};

