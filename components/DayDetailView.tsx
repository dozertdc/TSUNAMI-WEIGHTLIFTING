import React from 'react';
import { X, Plus, GripVertical } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Exercise, MacroData } from '../types/workout';
import { formatDate } from '../utils/dateUtils';
import { calculateTonnage, calculateAverageAbsoluteIntensity } from '../utils/tonnageUtils';
import { formatNumberWithCommas } from '../utils/numberFormat';

interface DayDetailViewProps {
  date: Date;
  exercises: Exercise[];
  macros?: MacroData;
  onClose: () => void;
  onAddExercise: () => void;
  onEditExercise: (exercise: Exercise) => void;
  onEditMacros: (date: Date) => void;
  isReordering: boolean;
  toggleReordering: () => void;
  reorderExercises: (startIndex: number, endIndex: number) => void;
}

export const DayDetailView: React.FC<DayDetailViewProps> = ({
  date,
  exercises,
  macros,
  onClose,
  onAddExercise,
  onEditExercise,
  onEditMacros,
  isReordering,
  toggleReordering,
  reorderExercises,
}) => {
  const handleDragEnd = (result: any) => {
    if (!result.destination) return;
    reorderExercises(result.source.index, result.destination.index);
  };

  const totalDayReps = exercises.reduce((total, exercise) => 
    total + exercise.sets.reduce((exerciseTotal, set) => exerciseTotal + set.reps, 0), 0);
  const totalDayTonnage = Math.round(calculateTonnage(exercises).total);
  const averageDayIntensity = Math.round(calculateAverageAbsoluteIntensity(exercises));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between sticky top-0 bg-background z-10">
          <CardTitle>{formatDate(date)}</CardTitle>
          <div className="flex items-center space-x-2">
            {exercises.length > 0 && (
              <Button variant="outline" size="sm" onClick={toggleReordering}>
                {isReordering ? 'Done' : 'Reorder'}
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6 p-4 bg-gray-100 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">Day Summary</h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="bg-blue-50 p-2 rounded-md">
                <p className="font-semibold text-blue-700">Total Reps</p>
                <p className="text-2xl font-bold">{formatNumberWithCommas(totalDayReps)}</p>
              </div>
              <div className="bg-green-50 p-2 rounded-md">
                <p className="font-semibold text-green-700">Avg Intensity</p>
                <p className="text-2xl font-bold">{formatNumberWithCommas(averageDayIntensity)} kg</p>
              </div>
              <div className="bg-purple-50 p-2 rounded-md">
                <p className="font-semibold text-purple-700">Total Tonnage</p>
                <p className="text-2xl font-bold">{formatNumberWithCommas(totalDayTonnage)} kg</p>
              </div>
            </div>
          </div>

          {exercises.length === 0 ? (
            <p className="text-center text-muted-foreground">No exercises for this day.</p>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="exercises">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef}>
                    {exercises.map((exercise, index) => (
                      <Draggable key={exercise.id} draggableId={exercise.id} index={index} isDragDisabled={!isReordering}>
                        {(provided) => (
                          <Card
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className="mb-4"
                          >
                            <CardHeader className="flex flex-row items-center justify-between py-2">
                              <div className="flex items-center">
                                {isReordering && (
                                  <div {...provided.dragHandleProps} className="mr-2">
                                    <GripVertical className="h-5 w-5 text-gray-400" />
                                  </div>
                                )}
                                <CardTitle className="text-lg">{exercise.name}</CardTitle>
                              </div>
                              <Button variant="ghost" size="sm" onClick={() => onEditExercise(exercise)}>
                                Edit
                              </Button>
                            </CardHeader>
                            <CardContent>
                              <table className="w-full">
                                <thead>
                                  <tr>
                                    <th className="text-left">Set</th>
                                    <th className="text-left">Weight (kg)</th>
                                    <th className="text-left">Reps</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {exercise.sets.map((set, index) => (
                                    <tr key={index}>
                                      <td>{index + 1}</td>
                                      <td>{set.weight}</td>
                                      <td>{set.reps}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                              <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                                <div className="bg-blue-50 p-2 rounded-md">
                                  <p className="font-semibold text-blue-700">Total Reps</p>
                                  <p className="text-2xl font-bold">{formatNumberWithCommas(exercise.sets.reduce((total, set) => total + set.reps, 0))}</p>
                                </div>
                                <div className="bg-green-50 p-2 rounded-md">
                                  <p className="font-semibold text-green-700">Avg Intensity</p>
                                  <p className="text-2xl font-bold">{formatNumberWithCommas(Math.round(calculateAverageAbsoluteIntensity([exercise])))} kg</p>
                                </div>
                                <div className="bg-purple-50 p-2 rounded-md">
                                  <p className="font-semibold text-purple-700">Tonnage</p>
                                  <p className="text-2xl font-bold">{formatNumberWithCommas(Math.round(calculateTonnage([exercise]).total))} kg</p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}
          <Button onClick={onAddExercise} className="w-full mt-4">
            <Plus className="mr-2 h-4 w-4" /> Add Exercise
          </Button>
          <div className="mt-4">
            <h3 className="text-lg font-semibold mb-2">Macros</h3>
            {macros ? (
              <div className="bg-blue-50 p-4 rounded-md">
                <p>Protein: <span className="font-bold">{formatNumberWithCommas(macros.protein)}</span>g</p>
                <p>Carbs: <span className="font-bold">{formatNumberWithCommas(macros.carbs)}</span>g</p>
                <p>Fat: <span className="font-bold">{formatNumberWithCommas(macros.fat)}</span>g</p>
                <p className="font-medium">
                  Total Calories: <span className="font-bold">{formatNumberWithCommas(Math.round(macros.protein * 4 + macros.carbs * 4 + macros.fat * 9))}</span>
                </p>
                <Button variant="outline" size="sm" onClick={() => onEditMacros(date)}>
                  {macros ? 'Edit' : 'Add'} Macros
                </Button>
              </div>
            ) : (
              <Button variant="outline" onClick={() => onEditMacros(date)}>Add Macros</Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

