'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Menu, X, LayoutDashboard, LineChart, Dumbbell, Apple, List, UserCircle, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();

  const handleLogout = () => {
    localStorage.clear();
    router.push('/login');
  };

  const menuItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/analyzer', label: 'Analyzer', icon: LineChart },
    { href: '/maximums', label: 'Maximums', icon: Dumbbell },
    { href: '/nutrition', label: 'Nutrition', icon: Apple },
    { href: '/exercises', label: 'Exercises', icon: List },
    { href: '/profile', label: 'Profile', icon: UserCircle },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo Section */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <div className="relative w-8 h-8">
                <Image 
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/wave-McwTzchM8YQSVkpgAADjaegFbYZ1oP.png"
                  alt="Tsunami Logo"
                  width={32}
                  height={32}
                  className="object-contain"
                  priority
                />
              </div>
              <span className="ml-2 text-xl font-bold">Tsunami</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-4">
            {menuItems.map((item) => (
              <Button
                key={item.href}
                variant="ghost"
                onClick={() => router.push(item.href)}
                className="flex items-center gap-2"
              >
                {item.icon && <item.icon className="h-4 w-4" />}
                <span className="hidden lg:inline">{item.label}</span>
              </Button>
            ))}
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden lg:inline">Logout</span>
            </Button>
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={`${isMenuOpen ? 'block' : 'hidden'} md:hidden border-t`}>
          <div className="py-2 space-y-1">
            {menuItems.map((item) => (
              <Button
                key={item.href}
                variant="ghost"
                onClick={() => {
                  router.push(item.href);
                  setIsMenuOpen(false);
                }}
                className="w-full justify-start gap-2"
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
              className="w-full justify-start gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}