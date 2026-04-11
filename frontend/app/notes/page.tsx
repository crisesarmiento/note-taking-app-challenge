import { NotesPageClient } from '@/components/notes/NotesPageClient'
import { RequireAuth } from '@/components/notes/RequireAuth'

export default function NotesPage() {
  return (
    <RequireAuth>
      <NotesPageClient />
    </RequireAuth>
  )
}
