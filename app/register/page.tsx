import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

import { RegisterForm } from '@/components/register-form'

export const metadata: Metadata = {
  title: 'Register | Tsunami Weightlifting System',
  description: 'Create your Tsunami Weightlifting System account',
}

export default function RegisterPage() {
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
            Create an account
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter your details to create your account
          </p>
        </div>
        <RegisterForm />
        <p className="px-8 text-center text-sm text-muted-foreground">
          <Link
            href="/login"
            className="hover:text-brand underline underline-offset-4"
          >
            Already have an account? Sign In
          </Link>
        </p>
      </div>
    </div>
  )
} 