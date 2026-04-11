'use client'

import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

import { Input, type InputProps } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export function PasswordInput({ className, ...props }: InputProps) {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="relative">
      <Input
        type={showPassword ? 'text' : 'password'}
        className={cn('pr-12', className)}
        autoComplete="current-password"
        {...props}
      />
      <button
        type="button"
        aria-label={showPassword ? 'Hide password' : 'Show password'}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-textMuted transition-colors hover:text-textMeta"
        onClick={() => setShowPassword((value) => !value)}
      >
        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  )
}
