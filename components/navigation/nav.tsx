'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export function Nav() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem('user');
    setIsAuthenticated(!!user);
  }, []);

  return (
    <nav>
      <Link href="/">Home</Link>
      {isAuthenticated ? (
        <>
          <Link href="/analyzer">Analyzer</Link>
          <Link href="/maximums">Maximums</Link>
          <Link href="/nutrition">Nutrition</Link>
          <Link href="/exercises">Exercises</Link>
          <Link href="/profile">Profile</Link>
          <Link href="/settings">Settings</Link>
        </>
      ) : (
        <>
          <Link href="/login">Login</Link>
          <Link href="/register">Register</Link>
        </>
      )}
    </nav>
  );
} 