import exercisesData from '../data/exercises.json';
import workoutsData from '../data/workouts.json';
import maximumsData from '../data/maximums.json';
import { Exercise, Workouts, Maximums } from '../types/workout';

export const getExercises = (): Exercise[] => {
  return exercisesData;
};

export const getWorkouts = (): Workouts => {
  return workoutsData;
};

export const getMaximums = (): Maximums => {
  return maximumsData;
};

export const generateTestData = (): Workouts => {
  // This function is now just returning the imported workouts data
  return getWorkouts();
};

