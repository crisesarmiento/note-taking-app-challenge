import { format, isToday, isYesterday } from 'date-fns'

export function formatCardDate(dateStr: string): string {
  const date = new Date(dateStr)
  if (isToday(date)) return 'today'
  if (isYesterday(date)) return 'yesterday'
  return format(date, 'MMM d')
}

export function formatEditorDate(dateStr: string): string {
  return format(new Date(dateStr), "MMMM d, yyyy 'at' h:mmaaa").toLowerCase()
}
