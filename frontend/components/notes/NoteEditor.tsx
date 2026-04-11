'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import debounce from 'lodash.debounce'
import { ChevronDown, X } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { CategoryDot } from '@/components/notes/CategoryDot'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Textarea } from '@/components/ui/textarea'
import { api } from '@/lib/api'
import { getCategoryColors } from '@/lib/categories'
import { formatEditorDate } from '@/lib/dates'
import type { Category, Note } from '@/lib/types'
import { cn } from '@/lib/utils'

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

type NoteEditorProps = {
  noteId: string
}

function resizeTextarea(textarea: HTMLTextAreaElement | null) {
  if (!textarea) return
  textarea.style.height = 'auto'
  textarea.style.height = `${textarea.scrollHeight}px`
}

export function NoteEditor({ noteId }: NoteEditorProps) {
  const router = useRouter()
  const titleRef = useRef<HTMLTextAreaElement>(null)
  const [note, setNote] = useState<Note | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true
    async function loadEditor() {
      setIsLoading(true)
      try {
        const [noteResponse, categoryResponse] = await Promise.all([
          api.get<Note>(`/notes/${noteId}/`),
          api.get<Category[]>('/categories/'),
        ])
        if (!isMounted) return
        const loadedNote = noteResponse.data
        setNote(loadedNote)
        setTitle(loadedNote.title)
        setContent(loadedNote.content)
        setCurrentCategory(loadedNote.category)
        setCategories(categoryResponse.data)
      } catch {
        if (isMounted) setError('Could not open this note.')
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }
    loadEditor()
    return () => {
      isMounted = false
    }
  }, [noteId])

  useEffect(() => {
    resizeTextarea(titleRef.current)
  }, [title])

  const debouncedSave = useMemo(
    () =>
      debounce(async (patch: Partial<Pick<Note, 'title' | 'content'>>) => {
        setSaveStatus('saving')
        try {
          const response = await api.patch<Note>(`/notes/${noteId}/`, patch)
          setNote(response.data)
          setSaveStatus('saved')
        } catch {
          setSaveStatus('error')
        }
      }, 500),
    [noteId],
  )

  useEffect(() => {
    return () => debouncedSave.cancel()
  }, [debouncedSave])

  const handleTitleChange = useCallback(
    (value: string) => {
      setTitle(value)
      debouncedSave({ title: value })
    },
    [debouncedSave],
  )

  const handleContentChange = useCallback(
    (value: string) => {
      setContent(value)
      debouncedSave({ content: value })
    },
    [debouncedSave],
  )

  async function handleCategoryChange(category: Category) {
    const previousCategory = currentCategory
    setCurrentCategory(category)
    setSaveStatus('saving')
    try {
      const response = await api.patch<Note>(`/notes/${noteId}/`, { category_id: category.id })
      setNote(response.data)
      setCurrentCategory(response.data.category)
      setSaveStatus('saved')
    } catch {
      setCurrentCategory(previousCategory)
      setSaveStatus('error')
    }
  }

  const colors = getCategoryColors(currentCategory?.name, currentCategory?.color)
  const otherCategories = categories.filter((category) => category.id !== currentCategory?.id)

  if (isLoading) {
    return <main className="min-h-screen bg-page" />
  }

  if (error || !note) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-page px-6">
        <div className="rounded-2xl border border-borderTan bg-[#fff7e8] p-6 text-sm text-textMeta">{error || 'Note not found.'}</div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-page px-5 py-6 text-primaryText md:px-8 lg:px-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="flex items-center justify-between gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="gap-2 px-4" aria-label="Change category">
                <CategoryDot name={currentCategory?.name} color={currentCategory?.color} />
                <span>{currentCategory?.name ?? 'Uncategorized'}</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {otherCategories.length ? (
                otherCategories.map((category) => (
                  <DropdownMenuItem key={category.id} className="gap-3" onClick={() => handleCategoryChange(category)}>
                    <CategoryDot name={category.name} color={category.color} />
                    {category.name}
                  </DropdownMenuItem>
                ))
              ) : (
                <DropdownMenuItem disabled>No other categories</DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="icon" aria-label="Close editor" onClick={() => router.push('/notes')}>
            <X className="h-5 w-5" />
          </Button>
        </header>

        <Card
          className="min-h-[72vh] rounded-2xl border-[1.5px] p-5 shadow-none md:p-8"
          style={{ backgroundColor: colors.bg, borderColor: colors.border }}
        >
          <div className="mb-8 flex justify-end text-right text-xs text-textMeta">
            <div>
              <span>Last Edited: </span>
              <span>{formatEditorDate(note.updated_at)}</span>
              <span className={cn('ml-3', saveStatus === 'error' ? 'text-red-900' : 'text-textMeta')}>
                {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved' : saveStatus === 'error' ? 'Not saved' : ''}
              </span>
            </div>
          </div>
          <Textarea
            ref={titleRef}
            value={title}
            onChange={(event) => handleTitleChange(event.target.value)}
            placeholder="Note Title"
            rows={1}
            className="mb-5 min-h-0 overflow-hidden border-0 bg-transparent p-0 font-serif text-2xl font-bold leading-tight text-primaryText shadow-none outline-none resize-none focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-textMuted md:text-[1.5rem]"
          />
          <Textarea
            value={content}
            onChange={(event) => handleContentChange(event.target.value)}
            placeholder="Pour your heart out..."
            className="min-h-[48vh] border-0 bg-transparent p-0 text-sm leading-7 text-primaryText shadow-none outline-none resize-none focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-textMuted"
          />
        </Card>
      </div>
    </main>
  )
}
