'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useWorkoutState } from '@/hooks/useWorkoutState';
import { Analyzer } from '@/components/Analyzer';
import AuthCheck from '@/components/auth/AuthCheck';

const commonSelectTriggerStyles = "bg-black text-white hover:bg-gray-800 hover:text-white h-9 px-3 text-sm font-bold";
const commonSelectContentStyles = "bg-black text-white border border-gray-700";
const commonSelectItemStyles = "cursor-pointer font-bold hover:bg-gray-800 hover:text-white focus:bg-gray-800 focus:text-white";

export default function AnalyzerPage() {
  const { workouts, selectedUserId, setSelectedUserId } = useWorkoutState();
  const [users, setUsers] = useState<Array<{ id: string; firstName: string; lastName: string }>>([]);

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const user = localStorage.getItem('user');
        if (!user) {
          console.error('No user found in localStorage');
          return;
        }
        const userId = JSON.parse(user).id;

        const response = await fetch(`http://localhost:3001/api/users/${userId}/user-and-athletes`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include'
        });
        
        if (!response.ok) throw new Error('Failed to fetch users');
        const data = await response.json();
        
        const formattedUsers = data.map((user: any) => ({
          id: user.id.toString(),
          firstName: user.first_name,
          lastName: user.last_name
        }));
        
        setUsers(formattedUsers);
        // Only set selected user if none is selected yet
        if (!selectedUserId && formattedUsers.length > 0) {
          setSelectedUserId(formattedUsers[0].id);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
  }, []);

  const handleUserChange = (userId: string) => {
    console.log('Changing user to:', userId);
    setSelectedUserId(userId);
  };

  return (
    <AuthCheck>
      <div className="container mx-auto p-4 space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Training Analysis</CardTitle>
            <Select
              value={selectedUserId}
              onValueChange={handleUserChange}
            >
              <SelectTrigger className={`${commonSelectTriggerStyles} w-[200px]`}>
                <SelectValue placeholder="Select user" />
              </SelectTrigger>
              <SelectContent className={commonSelectContentStyles}>
                {users.map((user) => (
                  <SelectItem 
                    key={user.id} 
                    value={user.id}
                    className={commonSelectItemStyles}
                  >
                    {user.firstName} {user.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            <Analyzer workouts={workouts} />
          </CardContent>
        </Card>
      </div>
    </AuthCheck>
  );
} 