'use client'

import { CategoryDot } from '@/components/notes/CategoryDot'
import type { Category } from '@/lib/types'
import { cn } from '@/lib/utils'

type CategorySidebarProps = {
  categories: Category[]
  selectedCategoryId: number | null
  onSelectCategory: (id: number | null) => void
}

export function CategorySidebar({ categories, selectedCategoryId, onSelectCategory }: CategorySidebarProps) {
  return (
    <aside className="w-full shrink-0 md:w-[220px]">
      <button
        className={cn(
          'mb-5 block text-left text-sm text-primaryText transition-colors hover:text-textMeta',
          selectedCategoryId === null ? 'font-bold' : 'font-semibold',
        )}
        onClick={() => onSelectCategory(null)}
      >
        All Categories
      </button>
      <nav className="flex gap-3 overflow-x-auto pb-2 md:block md:space-y-3 md:overflow-visible md:pb-0">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onSelectCategory(category.id)}
            className={cn(
              'flex min-w-fit items-center gap-3 rounded-full px-1 py-1 text-left text-sm text-textMeta transition-colors hover:text-primaryText md:w-full md:rounded-none md:px-0',
              selectedCategoryId === category.id && 'font-bold text-primaryText',
            )}
          >
            <CategoryDot name={category.name} color={category.color} />
            <span className="truncate">{category.name}</span>
            <span className="ml-auto text-xs text-textMeta">{category.note_count ?? 0}</span>
          </button>
        ))}
      </nav>
    </aside>
  )
}
