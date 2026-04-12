export type Category = {
  id: number
  name: string
  color: string
  note_count?: number
}

export type Note = {
  id: number
  title: string
  content: string
  category: Category | null
  created_at: string
  updated_at: string
}

export type TokenPair = {
  access: string
  refresh: string
}
