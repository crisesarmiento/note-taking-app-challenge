'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

import { getAccessToken } from '@/lib/auth'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    router.replace(getAccessToken() ? '/notes' : '/auth/signup')
  }, [router])

  return <main className="min-h-screen bg-page" />
}
