import * as React from 'react'

import { cn } from '@/lib/utils'

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        'flex h-11 w-full rounded-2xl border-[1.5px] border-borderTan bg-page px-4 py-2 text-sm text-primaryText shadow-none transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-textMuted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-borderTan focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      ref={ref}
      {...props}
    />
  )
})
Input.displayName = 'Input'

export { Input }
