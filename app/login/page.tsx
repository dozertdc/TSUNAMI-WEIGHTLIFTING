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
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
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
        <LoginForm />
        <p className="px-8 text-center text-sm text-muted-foreground">
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

