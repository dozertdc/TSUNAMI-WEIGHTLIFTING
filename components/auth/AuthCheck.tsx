'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from "@/components/ui/use-toast";

export default function AuthCheck({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = () => {
      const user = localStorage.getItem('user');
      const isAuth = localStorage.getItem('isAuthenticated');
      
      if (!user || !isAuth) {
        localStorage.clear(); // Clear any partial data
        router.push('/login');
        return;
      }
      
      try {
        // Validate user object
        const userData = JSON.parse(user);
        if (!userData.id) {
          throw new Error('Invalid user data');
        }
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Auth check error:', error);
        localStorage.clear();
        router.push('/login');
      }
    };

    checkAuth();

    // Add storage event listener for cross-tab synchronization
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'isAuthenticated' || e.key === 'user') {
        checkAuth();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [router]);

  if (isAuthenticated === null) {
    return null; // or loading spinner
  }

  return isAuthenticated ? children : null;
} 