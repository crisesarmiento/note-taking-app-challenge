'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import { getAccessToken } from '@/lib/auth'

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (!getAccessToken()) {
      router.replace('/auth/signup')
      return
    }
    setIsReady(true)
  }, [router])

  if (!isReady) {
    return <main className="min-h-screen bg-page" />
  }

  return <>{children}</>
}
