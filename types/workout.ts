export interface ComplexPart {
  name: string;
  reps: number;
}

export interface Exercise {
  id: string;
  name: string;
  sets: Set[];
  isComplex?: boolean;
  complexParts?: ComplexPart[];
}

export interface Set {
  weight: number;
  reps?: number;
  [key: string]: number | undefined; // This allows for dynamic rep fields like 'exercise0Reps', 'exercise1Reps', etc.
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

