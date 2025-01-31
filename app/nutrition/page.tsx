'use client';

import { useState, useEffect } from 'react';
import { useWorkoutState } from '@/hooks/useWorkoutState';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Save, Edit } from 'lucide-react';
import { formatDate, getDaysInMonth } from '@/utils/dateUtils';
import { Label } from '@/components/ui/label';
import { useToast } from "@/components/ui/use-toast";

interface DayNutrition {
  protein: number;
  carbs: number;
  fat: number;
  steps: number;
  sleep: number;
  bodyweight: number;
}

const commonSelectTriggerStyles = "bg-black text-white hover:bg-gray-800 hover:text-white h-9 px-3 text-sm font-bold";
const commonSelectContentStyles = "bg-black text-white border border-gray-700";
const commonSelectItemStyles = "cursor-pointer font-bold hover:bg-gray-800 hover:text-white focus:bg-gray-800 focus:text-white";

export default function NutritionPage() {
  const { workouts, saveMacros } = useWorkoutState();
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [users, setUsers] = useState<Array<{ id: string; firstName: string; lastName: string }>>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [nutritionData, setNutritionData] = useState<Record<string, DayNutrition>>({});
  const [editingDays, setEditingDays] = useState<Set<string>>(new Set());
  const [unsavedChanges, setUnsavedChanges] = useState<Record<string, DayNutrition>>({});
  
  const calculateCalories = (protein: number, carbs: number, fat: number) => {
    return (protein * 4) + (carbs * 4) + (fat * 9);
  };

  const getSleepOptions = () => {
    const options = [];
    for (let i = 0; i <= 24; i += 0.5) {
      options.push(i.toString());
    }
    return options;
  };

  const fetchNutritionData = async (userId: string, startDate: string, endDate: string) => {
    try {
      if (!userId || userId === '') {
        console.error('Invalid userId:', userId);
        return;
      }

      console.log('Fetching nutrition data:', { userId, startDate, endDate });

      const response = await fetch(
        `http://localhost:3001/api/nutrition/user/${userId}?startDate=${startDate}&endDate=${endDate}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include'
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server response:', errorText);
        throw new Error('Failed to fetch nutrition data');
      }

      const data = await response.json();
      console.log('Raw nutrition data:', data);

      const formattedData = data.reduce((acc: Record<string, DayNutrition>, item: any) => {
        // Convert the date to YYYY-MM-DD format if it isn't already
        const dateKey = new Date(item.date).toISOString().split('T')[0];
        
        console.log('Processing date:', dateKey, item);
        
        acc[dateKey] = {
          protein: Number(item.protein_grams) || 0,
          carbs: Number(item.carbs_grams) || 0,
          fat: Number(item.fat_grams) || 0,
          steps: Number(item.steps) || 0,
          sleep: Number(item.sleep_hours) || 0,
          bodyweight: Number(item.bodyweight_kg) || 0
        };
        return acc;
      }, {});

      console.log('Formatted nutrition data:', formattedData);
      setNutritionData(formattedData);
    } catch (error: any) {
      console.error('Error fetching nutrition:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch nutrition data",
        variant: "destructive"
      });
    }
  };

  const handleValueChange = (date: string, field: keyof DayNutrition, value: string) => {
    const numValue = parseFloat(value) || 0;
    const currentData = unsavedChanges[date] || nutritionData[date] || {
      protein: 0,
      carbs: 0,
      fat: 0,
      steps: 0,
      sleep: 0,
      bodyweight: 0
    };

    const updatedData = {
      ...currentData,
      [field]: numValue
    };

    setUnsavedChanges(prev => ({
      ...prev,
      [date]: updatedData
    }));
  };

  const handleSave = async (dateKey: string) => {
    if (!unsavedChanges[dateKey]) {
      stopEditing(dateKey);
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/api/nutrition/user/${selectedUserId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          date: dateKey,
          protein_grams: unsavedChanges[dateKey].protein,
          carbs_grams: unsavedChanges[dateKey].carbs,
          fat_grams: unsavedChanges[dateKey].fat,
          steps: unsavedChanges[dateKey].steps,
          sleep_hours: unsavedChanges[dateKey].sleep,
          bodyweight_kg: unsavedChanges[dateKey].bodyweight
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to save nutrition data');
      }

      const savedData = await response.json();
      console.log('Saved nutrition data:', savedData);

      setNutritionData(prev => ({
        ...prev,
        [dateKey]: unsavedChanges[dateKey]
      }));

      setUnsavedChanges(prev => {
        const next = { ...prev };
        delete next[dateKey];
        return next;
      });

      stopEditing(dateKey);
      
      toast({
        title: "Success",
        description: "Nutrition data saved successfully",
      });
    } catch (error: any) {
      console.error('Error saving nutrition:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save nutrition data",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const user = localStorage.getItem('user');
        if (!user) {
          console.error('No user found in localStorage');
          return;
        }

        const userId = JSON.parse(user).id;
        console.log('Current user ID:', userId);
        
        const response = await fetch(`http://localhost:3001/api/users/${userId}/user-and-athletes`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }

        const data = await response.json();
        console.log('Fetched users:', data);
        
        const formattedUsers = data.map((user: any) => ({
          id: user.id.toString(),
          firstName: user.first_name,
          lastName: user.last_name
        }));
        
        console.log('Formatted users:', formattedUsers);
        setUsers(formattedUsers);

        if (formattedUsers.length > 0) {
          const firstUserId = formattedUsers[0].id;
          console.log('Setting initial user ID:', firstUserId);
          setSelectedUserId(firstUserId);
        }
      } catch (error: any) {
        console.error('Error in fetchUsers:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to fetch users",
          variant: "destructive"
        });
      }
    };

    fetchUsers();
  }, [toast]);

  useEffect(() => {
    if (!selectedUserId) {
      console.log('No user selected, skipping fetch');
      return;
    }

    // Get all dates shown in the calendar
    const calendarDates = getDaysInMonth(currentDate);
    
    // Use the first and last dates from the calendar view
    const startDate = calendarDates[0].date;
    const endDate = calendarDates[calendarDates.length - 1].date;

    console.log('Fetching nutrition with:', {
      selectedUserId,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    });

    fetchNutritionData(
      selectedUserId,
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    );
  }, [selectedUserId, currentDate]);

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

  const startEditing = (dateKey: string) => {
    setEditingDays(prev => new Set([...prev, dateKey]));
  };

  const stopEditing = (dateKey: string) => {
    setEditingDays(prev => {
      const next = new Set(prev);
      next.delete(dateKey);
      return next;
    });
  };

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center space-x-4">
            <Select
              value={selectedUserId}
              onValueChange={(value) => {
                console.log('Selected user changed to:', value);
                setSelectedUserId(value);
              }}
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
                  <SelectValue>{currentDate.getFullYear()}</SelectValue>
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
              console.log('Rendering date:', dateKey, nutritionData[dateKey]);
              
              const dayData = nutritionData[dateKey] || {
                protein: 0,
                carbs: 0,
                fat: 0,
                steps: 0,
                sleep: 0,
                bodyweight: 0
              };
              
              const calories = calculateCalories(dayData.protein, dayData.carbs, dayData.fat);

              return (
                <Card 
                  key={index}
                  className={`${
                    day.isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                  } transition-all hover:shadow-md`}
                >
                  <CardHeader 
                    className="flex flex-row items-center justify-between py-2"
                  >
                    <div className="flex flex-col">
                      <span className="text-lg font-semibold">{formatDate(day.date)}</span>
                      <span className="text-sm text-muted-foreground">
                        {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day.date.getDay()]}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      {(dayData.protein || dayData.carbs || dayData.fat) && (
                        <div className="text-sm">
                          <span className="font-medium">{calories} kcal</span>
                        </div>
                      )}
                      {editingDays.has(dateKey) ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSave(dateKey)}
                          className="flex items-center gap-2"
                        >
                          <Save className="h-4 w-4" />
                          Save
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startEditing(dateKey)}
                          className="flex items-center gap-2"
                        >
                          <Edit className="h-4 w-4" />
                          Edit
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="grid grid-cols-3 md:grid-cols-6 gap-2 pt-0">
                    <div className="space-y-1">
                      <Label className="text-xs">Protein (g)</Label>
                      <Input
                        type="number"
                        value={unsavedChanges[dateKey]?.protein ?? dayData.protein || ''}
                        onChange={(e) => handleValueChange(dateKey, 'protein', e.target.value)}
                        className="h-8"
                        disabled={!editingDays.has(dateKey)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Carbs (g)</Label>
                      <Input
                        type="number"
                        value={unsavedChanges[dateKey]?.carbs ?? dayData.carbs || ''}
                        onChange={(e) => handleValueChange(dateKey, 'carbs', e.target.value)}
                        className="h-8"
                        disabled={!editingDays.has(dateKey)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Fat (g)</Label>
                      <Input
                        type="number"
                        value={unsavedChanges[dateKey]?.fat ?? dayData.fat || ''}
                        onChange={(e) => handleValueChange(dateKey, 'fat', e.target.value)}
                        className="h-8"
                        disabled={!editingDays.has(dateKey)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Steps</Label>
                      <Input
                        type="number"
                        value={unsavedChanges[dateKey]?.steps ?? dayData.steps || ''}
                        onChange={(e) => handleValueChange(dateKey, 'steps', e.target.value)}
                        className="h-8"
                        disabled={!editingDays.has(dateKey)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Sleep (hrs)</Label>
                      <Select
                        value={unsavedChanges[dateKey]?.sleep?.toString() || dayData.sleep?.toString() || ''}
                        onValueChange={(value) => handleValueChange(dateKey, 'sleep', value)}
                        disabled={!editingDays.has(dateKey)}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {getSleepOptions().map(hours => (
                            <SelectItem key={hours} value={hours}>
                              {hours}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Weight (kg)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={unsavedChanges[dateKey]?.bodyweight ?? dayData.bodyweight || ''}
                        onChange={(e) => handleValueChange(dateKey, 'bodyweight', e.target.value)}
                        className="h-8"
                        disabled={!editingDays.has(dateKey)}
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 