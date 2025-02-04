'use client';

import '@/styles/globals.css'
import { Header } from '@/components/Header'
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  const router = useRouter();

  useEffect(() => {
    const handleStorageCheck = () => {
      const user = localStorage.getItem('user');
      const isAuth = localStorage.getItem('isAuthenticated');
      
      if (!user || !isAuth) {
        if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
          router.push('/login');
        }
      }
    };

    // Check on mount
    handleStorageCheck();

    // Check when app comes back to focus
    window.addEventListener('focus', handleStorageCheck);
    
    return () => window.removeEventListener('focus', handleStorageCheck);
  }, [router]);

  return (
    <html lang="en">
      <body>
        <Header />
        <main className="pt-16">
          {children}
        </main>
      </body>
    </html>
  )
}



import './globals.css'