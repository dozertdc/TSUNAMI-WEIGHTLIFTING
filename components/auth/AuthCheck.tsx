'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from "@/components/ui/use-toast";

export default function AuthCheck({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to access this page",
        variant: "destructive"
      });
      router.push('/login');
      return;
    }

    try {
      const userData = JSON.parse(user);
      // Check for required user data fields
      if (!userData.id || !userData.email) {
        throw new Error('Invalid user data');
      }
      setIsAuthenticated(true);
    } catch (error) {
      // Clear invalid user data
      localStorage.removeItem('user');
      toast({
        title: "Session Error",
        description: "Please log in again",
        variant: "destructive"
      });
      router.push('/login');
    }
  }, [router, toast]);

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
} 