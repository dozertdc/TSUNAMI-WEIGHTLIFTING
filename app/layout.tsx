import '@/styles/globals.css'
import { Metadata } from 'next'

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
        <main>{children}</main>
      </body>
    </html>
  )
}



import './globals.css'