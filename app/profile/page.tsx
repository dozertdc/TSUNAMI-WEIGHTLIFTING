'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from "@/components/ui/use-toast";
import { Edit, Save, X } from 'lucide-react';
import AuthCheck from '@/components/auth/AuthCheck';

interface Coach {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface Profile {
  email: string;
  first_name: string;
  last_name: string;
  birthdate: string;
  is_coach: boolean;
  is_athlete: boolean;
  coached_by?: string;
}

export default function ProfilePage() {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<Profile>({
    email: '',
    first_name: '',
    last_name: '',
    birthdate: '',
    is_coach: false,
    is_athlete: true,
    coached_by: undefined
  });
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Move fetchProfile outside useEffect
  const fetchProfile = async () => {
    try {
      const user = localStorage.getItem('user');
      if (!user) return;

      const userId = JSON.parse(user).id;
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${userId}/profile`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }

      const data = await response.json();
      setProfile({
        email: data.email,
        first_name: data.first_name,
        last_name: data.last_name,
        birthdate: data.birthdate || '',
        is_coach: data.is_coach || false,
        is_athlete: data.is_athlete || false,
        coached_by: data.coached_by
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Failed to load profile data');
    }
  };

  useEffect(() => {
    const fetchCoaches = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/coaches`, {
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch coaches');
        }
        
        const data = await response.json();
        setCoaches(data);
      } catch (error) {
        console.error('Error fetching coaches:', error);
        setError('Failed to load coaches');
      }
    };

    fetchProfile();
    fetchCoaches();
  }, []);

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent form submission
    setIsEditing(true);
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsEditing(false);
    fetchProfile(); // Now this will work
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const user = localStorage.getItem('user');
      if (!user) {
        setError('Not logged in');
        return;
      }

      const userId = JSON.parse(user).id;
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(profile)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }

      const updatedUser = await response.json();
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      setIsEditing(false);
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setError(error.message || 'Failed to update profile');
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message || "Failed to update profile",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Add this function to get coach name
  const getSelectedCoachName = () => {
    if (!profile.coached_by) return '';
    const coach = coaches.find(c => c.id === profile.coached_by);
    return coach ? `${coach.first_name} ${coach.last_name} - ${coach.email}` : '';
  };

  const handleCoachSelect = (value: string) => {
    const newCoachedBy = value === "none" ? undefined : value;
    
    setProfile(prev => ({ 
      ...prev, 
      coached_by: newCoachedBy
    }));
  };

  return (
    <AuthCheck>
      <div className="container mx-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle>Profile Settings</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="text-red-500 mb-4">{error}</div>
            )}
            <form className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name</Label>
                  <Input
                    id="first_name"
                    value={profile.first_name}
                    onChange={(e) => setProfile(prev => ({ ...prev, first_name: e.target.value }))}
                    disabled={!isEditing}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    value={profile.last_name}
                    onChange={(e) => setProfile(prev => ({ ...prev, last_name: e.target.value }))}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                  disabled={!isEditing}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="birthdate">Birthdate</Label>
                <Input
                  id="birthdate"
                  type="date"
                  value={profile.birthdate}
                  onChange={(e) => setProfile(prev => ({ ...prev, birthdate: e.target.value }))}
                  disabled={!isEditing}
                />
              </div>

              <div className="flex space-x-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_coach"
                    checked={profile.is_coach}
                    onCheckedChange={(checked) => 
                      setProfile(prev => ({ ...prev, is_coach: checked as boolean }))
                    }
                    disabled={!isEditing}
                  />
                  <Label htmlFor="is_coach">Coach</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_athlete"
                    checked={profile.is_athlete}
                    onCheckedChange={(checked) => 
                      setProfile(prev => ({ ...prev, is_athlete: checked as boolean }))
                    }
                    disabled={!isEditing}
                  />
                  <Label htmlFor="is_athlete">Athlete</Label>
                </div>
              </div>

              {profile.is_athlete && (
                <div className="space-y-2">
                  <Label 
                    htmlFor="coach" 
                    className={coaches.length === 0 ? "text-gray-400" : ""}
                  >
                    Coach {coaches.length === 0 && "(No coaches available)"}
                  </Label>
                  <Select
                    value={profile.coached_by || "none"}
                    onValueChange={handleCoachSelect}
                    disabled={!isEditing || coaches.length === 0}
                  >
                    <SelectTrigger className={coaches.length === 0 ? "bg-gray-100" : ""}>
                      <SelectValue 
                        defaultValue="none"
                        placeholder={
                          coaches.length === 0 
                            ? "No coaches available" 
                            : getSelectedCoachName() || "Select a coach"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Select a coach</SelectItem>
                      {coaches.map((coach) => (
                        <SelectItem key={coach.id} value={coach.id}>
                          {coach.first_name} {coach.last_name} - {coach.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {coaches.length === 0 && (
                    <p className="text-sm text-gray-500 mt-1">
                      No coaches are currently registered in the system
                    </p>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-6">
                {!isEditing ? (
                  <Button 
                    type="button"
                    onClick={handleEdit} 
                    variant="outline"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                ) : (
                  <>
                    <Button 
                      type="button"
                      onClick={handleCancel} 
                      variant="outline"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      onClick={handleSubmit} 
                      disabled={isLoading}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {isLoading ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AuthCheck>
  );
} 