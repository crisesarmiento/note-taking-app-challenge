import { NoteEditor } from '@/components/notes/NoteEditor'
import { RequireAuth } from '@/components/notes/RequireAuth'

export default async function NotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <RequireAuth>
      <NoteEditor noteId={id} />
    </RequireAuth>
  )
}
