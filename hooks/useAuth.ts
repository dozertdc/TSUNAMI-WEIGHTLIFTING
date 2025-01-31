import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from "@/components/ui/use-toast";

export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        if (parsed.id && parsed.email) {
          setUser(parsed);
        } else {
          throw new Error('Invalid user data');
        }
      } catch (error) {
        localStorage.removeItem('user');
        toast({
          title: "Session Error",
          description: "Please log in again",
          variant: "destructive"
        });
        router.push('/login');
      }
    }
    setIsLoading(false);
  }, [router, toast]);

  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
    router.push('/login');
  };

  return { user, isLoading, logout };
} 