import { getCategoryColors } from '@/lib/categories'
import { cn } from '@/lib/utils'

type CategoryDotProps = {
  name?: string | null
  color?: string | null
  className?: string
}

export function CategoryDot({ name, color, className }: CategoryDotProps) {
  const colors = getCategoryColors(name, color)
  return <span className={cn('inline-block h-3 w-3 shrink-0 rounded-full', className)} style={{ backgroundColor: colors.bg }} />
}
