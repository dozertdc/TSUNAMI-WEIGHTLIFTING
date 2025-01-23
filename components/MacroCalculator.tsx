import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { MacroData } from '../types/workout';

interface MacroCalculatorProps {
  initialMacros?: MacroData;
  onSave: (macros: MacroData) => void;
}

export const MacroCalculator: React.FC<MacroCalculatorProps> = ({ initialMacros, onSave }) => {
  const [protein, setProtein] = useState(initialMacros?.protein?.toString() || '');
  const [carbs, setCarbs] = useState(initialMacros?.carbs?.toString() || '');
  const [fat, setFat] = useState(initialMacros?.fat?.toString() || '');

  const calculateCalories = () => {
    const proteinCalories = parseFloat(protein) * 4;
    const carbCalories = parseFloat(carbs) * 4;
    const fatCalories = parseFloat(fat) * 9;
    return proteinCalories + carbCalories + fatCalories;
  };

  const handleSave = () => {
    onSave({
      protein: parseFloat(protein) || 0,
      carbs: parseFloat(carbs) || 0,
      fat: parseFloat(fat) || 0,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Macro Calculator</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label htmlFor="protein">Protein (g)</Label>
            <Input
              id="protein"
              type="number"
              value={protein}
              onChange={(e) => setProtein(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="carbs">Carbs (g)</Label>
            <Input
              id="carbs"
              type="number"
              value={carbs}
              onChange={(e) => setCarbs(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="fat">Fat (g)</Label>
            <Input
              id="fat"
              type="number"
              value={fat}
              onChange={(e) => setFat(e.target.value)}
            />
          </div>
          <div className="text-lg font-semibold">
            Total Calories: {calculateCalories()}
          </div>
          <Button onClick={handleSave}>Save Macros</Button>
        </div>
      </CardContent>
    </Card>
  );
};

