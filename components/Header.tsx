'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  Menu, 
  X, 
  Calendar, 
  BarChart2, 
  Dumbbell, 
  List, 
  User, 
  LogOut,
  Utensils
} from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";

export function Header() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { toast } = useToast();

  const handleLogout = () => {
    // Clear all auth-related data
    localStorage.removeItem('user');
    
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out",
    });
    
    router.push('/login');
  };

  const menuItems = [
    { label: 'Dashboard', href: '/dashboard', icon: Calendar },
    { label: 'Analyzer', href: '/analyzer', icon: BarChart2 },
    { label: 'Maximums', href: '/maximums', icon: Dumbbell },
    { label: 'Nutrition', href: '/nutrition', icon: Utensils },
    { label: 'Exercise List', href: '/exercises', icon: List },
    { label: 'Profile', href: '/profile', icon: User },
  ];

  return (
    <nav className="bg-white shadow-sm fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and brand */}
          <div className="flex items-center">
            <div 
              className="flex-shrink-0 flex items-center cursor-pointer" 
              onClick={() => router.push('/')}
            >
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/wave-McwTzchM8YQSVkpgAADjaegFbYZ1oP.png"
                alt="Tsunami Logo"
                width={32}
                height={32}
                className="dark:invert"
              />
              <span className="ml-2 text-xl font-bold">Tsunami</span>
            </div>
          </div>

          {/* Desktop menu */}
          <div className="hidden sm:flex sm:items-center">
            {menuItems.map((item) => (
              <Button
                key={item.href}
                variant="ghost"
                onClick={() => router.push(item.href)}
                className="ml-4 flex items-center gap-2"
              >
                {item.icon && <item.icon className="h-4 w-4" />}
                {item.label}
              </Button>
            ))}
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="ml-4 flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center sm:hidden">
            <Button
              variant="ghost"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="sm:hidden bg-white">
          <div className="pt-2 pb-3 space-y-1">
            {menuItems.map((item) => (
              <Button
                key={item.href}
                variant="ghost"
                onClick={() => {
                  router.push(item.href);
                  setIsMenuOpen(false);
                }}
                className="w-full justify-start px-4 flex items-center gap-2"
              >
                {item.icon && <item.icon className="h-4 w-4" />}
                {item.label}
              </Button>
            ))}
            <Button
              variant="ghost"
              onClick={() => {
                handleLogout();
                setIsMenuOpen(false);
              }}
              className="w-full justify-start px-4 flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
}