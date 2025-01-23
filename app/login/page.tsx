import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

import { LoginForm } from '@/components/login-form'

export const metadata: Metadata = {
  title: 'Login | Tsunami Weightlifting System',
  description: 'Login to your Tsunami Weightlifting System account',
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white rounded-lg shadow-md p-8 w-full max-w-md">
        <div className="flex flex-col space-y-2 text-center">
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/wave-McwTzchM8YQSVkpgAADjaegFbYZ1oP.png"
            alt="Tsunami Logo"
            width={60}
            height={60}
            className="mx-auto dark:invert"
          />
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome to Tsunami Weightlifting
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter your email to sign in to your account
          </p>
        </div>
        <div className="mt-6">
          <LoginForm />
        </div>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link
            href="/register"
            className="hover:text-brand underline underline-offset-4"
          >
            Don&apos;t have an account? Sign Up
          </Link>
        </p>
      </div>
    </div>
  )
}

