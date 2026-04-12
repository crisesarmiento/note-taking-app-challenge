'use client'

import { useEffect, useMemo, useState } from 'react'
import { LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { CategorySidebar } from '@/components/notes/CategorySidebar'
import { EmptyState } from '@/components/notes/EmptyState'
import { NewNoteButton } from '@/components/notes/NewNoteButton'
import { NoteCard } from '@/components/notes/NoteCard'
import { Button } from '@/components/ui/button'
import { api, logout } from '@/lib/api'
import type { Category, Note } from '@/lib/types'

export function NotesPageClient() {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true
    async function loadData() {
      setIsLoading(true)
      setError('')
      try {
        const [categoryResponse, notesResponse] = await Promise.all([
          api.get<Category[]>('/categories/'),
          api.get<Note[]>('/notes/'),
        ])
        if (!isMounted) return
        setCategories(categoryResponse.data)
        setNotes(notesResponse.data)
      } catch {
        if (isMounted) setError('Could not load your notes. Please try again.')
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }
    loadData()
    return () => {
      isMounted = false
    }
  }, [])

  const visibleNotes = useMemo(() => {
    if (selectedCategoryId === null) return notes
    return notes.filter((note) => note.category?.id === selectedCategoryId)
  }, [notes, selectedCategoryId])

  function handleLogout() {
    logout()
    router.replace('/auth/login')
  }

  return (
    <main className="min-h-screen bg-page px-5 py-6 text-primaryText md:px-8 lg:px-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <header className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-textMuted">cozy notes</p>
            <h1 className="font-serif text-3xl font-bold text-textMeta">Your tiny thought garden</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" aria-label="Logout" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
            <NewNoteButton />
          </div>
        </header>

        <div className="flex flex-col gap-8 md:flex-row">
          <CategorySidebar categories={categories} selectedCategoryId={selectedCategoryId} onSelectCategory={setSelectedCategoryId} />
          <section className="min-w-0 flex-1">
            {isLoading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="h-44 animate-pulse rounded-2xl border-[1.5px] border-borderTan bg-[#eadbbd]/60" />
                ))}
              </div>
            ) : error ? (
              <div className="rounded-2xl border border-borderTan bg-[#fff7e8] p-5 text-sm text-textMeta">{error}</div>
            ) : visibleNotes.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 [&>*]:mb-4">
                {visibleNotes.map((note) => (
                  <NoteCard key={note.id} note={note} />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}
