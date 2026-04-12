import Link from 'next/link'

import { Card } from '@/components/ui/card'
import { getCategoryColors } from '@/lib/categories'
import { formatCardDate } from '@/lib/dates'
import type { Note } from '@/lib/types'

export function NoteCard({ note }: { note: Note }) {
  const colors = getCategoryColors(note.category?.name, note.category?.color)
  const title = note.title.trim() || 'Note Title'
  const content = note.content.trim() || 'Note content...'

  return (
    <Link href={`/notes/${note.id}`} className="block break-inside-avoid focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-borderTan focus-visible:ring-offset-4">
      <Card
        className="space-y-3 rounded-2xl border-[1.5px] p-4 shadow-none transition-transform hover:-translate-y-0.5 hover:shadow-soft"
        style={{ backgroundColor: colors.bg, borderColor: colors.border }}
      >
        <div className="flex items-center justify-between gap-4 text-xs text-textMeta">
          <span>{formatCardDate(note.updated_at)}</span>
          <span className="truncate">{note.category?.name ?? 'Uncategorized'}</span>
        </div>
        <h2 className="font-serif text-xl font-bold leading-snug text-primaryText">{title}</h2>
        <p className="line-clamp-4 whitespace-pre-line text-sm leading-6 text-primaryText">{content}</p>
      </Card>
    </Link>
  )
}
