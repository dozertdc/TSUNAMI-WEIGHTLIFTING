export interface Exercise {
  id: string;
  name: string;
  sets: Set[];
}

export interface Set {
  weight: number;
  reps: number;
  cleans?: number;
  jerks?: number;
}

export interface Workouts {
  [date: string]: DayData;
}

export interface RepMax {
  weight: number;
  reps: number;
  date: string;
}

export interface Maximums {
  [exerciseName: string]: RepMax[];
}

export interface MacroData {
  protein: number;
  carbs: number;
  fat: number;
}

export interface DayData {
  exercises: Exercise[];
  macros?: MacroData;
}

