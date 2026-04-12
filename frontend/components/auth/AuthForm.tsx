'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import { PasswordInput } from '@/components/auth/PasswordInput'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { login, register } from '@/lib/api'

type AuthFormProps = {
  mode: 'login' | 'signup'
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      if (mode === 'signup') {
        await register(email, password)
      } else {
        await login(email, password)
      }
      router.replace('/notes')
    } catch {
      setError(mode === 'signup' ? 'Could not create your cozy account. Try another email.' : 'Invalid email or password.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2 text-left">
        <Label className="sr-only" htmlFor="email">
          Email address
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="Email address"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </div>
      <div className="space-y-2 text-left">
        <Label className="sr-only" htmlFor="password">
          Password
        </Label>
        <PasswordInput
          id="password"
          placeholder="Password"
          autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </div>
      {error ? <p className="rounded-2xl border border-borderTan bg-[#fff7e8] px-4 py-3 text-left text-sm text-textMeta">{error}</p> : null}
      <Button className="h-11 w-full" type="submit" disabled={!isHydrated || isSubmitting}>
        {isSubmitting ? 'One moment...' : mode === 'signup' ? 'Sign Up' : 'Login'}
      </Button>
    </form>
  )
}
