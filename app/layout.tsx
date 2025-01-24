import '@/styles/globals.css'
import { Metadata } from 'next'
import { Header } from '@/components/Header'

export const metadata: Metadata = {
  title: 'Tsunami Weightlifting System',
  description: 'Track your weightlifting progress with precision',
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
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