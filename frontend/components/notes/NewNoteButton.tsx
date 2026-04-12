'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import type { Note } from '@/lib/types'

export function NewNoteButton() {
  const router = useRouter()
  const [isCreating, setIsCreating] = useState(false)

  async function handleCreateNote() {
    if (isCreating) return
    setIsCreating(true)
    try {
      const response = await api.post<Note>('/notes/', { title: '', content: '' })
      router.push(`/notes/${response.data.id}`)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Button onClick={handleCreateNote} disabled={isCreating} className="gap-2 px-5">
      <Plus className="h-4 w-4" />
      {isCreating ? 'Creating...' : 'New Note'}
    </Button>
  )
}
