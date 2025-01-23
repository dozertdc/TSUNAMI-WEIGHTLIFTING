import { Exercise, Workouts } from '../types/workout';

export const calculateTonnage = (exercises: Exercise[]): { [key: string]: number } => {
  return exercises.reduce((total, exercise) => {
    let exerciseTonnage = 0;
    if (exercise.name === 'Clean and Jerk') {
      exerciseTonnage = exercise.sets.reduce((setTotal, set) => {
        return setTotal + (set.weight * ((set.cleans || 0) + (set.jerks || 0)));
      }, 0);
    } else {
      exerciseTonnage = exercise.sets.reduce((setTotal, set) => {
        return setTotal + (set.weight * set.reps);
      }, 0);
    }
    return {
      ...total,
      [exercise.name]: (total[exercise.name] || 0) + exerciseTonnage,
      total: (total.total || 0) + exerciseTonnage,
    };
  }, {} as { [key: string]: number });
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
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  let monthlyTonnage = 0;

  for (let i = 1; i <= daysInMonth; i++) {
    const currentDate = new Date(year, month, i);
    const dateKey = currentDate.toISOString().split('T')[0];
    if (workouts[dateKey] && workouts[dateKey].exercises) {
      monthlyTonnage += calculateTonnage(workouts[dateKey].exercises).total;
    }
  }

  return monthlyTonnage;
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

