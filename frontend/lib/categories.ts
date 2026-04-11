export const CATEGORY_COLORS: Record<string, { bg: string; border: string }> = {
  'Random Thoughts': { bg: '#E8A87C', border: '#D4946A' },
  School: { bg: '#F9E4A0', border: '#E8CC78' },
  Personal: { bg: '#8FBCBC', border: '#7AABAB' },
  Drama: { bg: '#C8D5A8', border: '#B4C490' },
}

export const DEFAULT_CATEGORY_COLOR = { bg: '#E8A87C', border: '#D4946A' }

export function getCategoryColors(name?: string | null, apiColor?: string | null) {
  if (name && CATEGORY_COLORS[name]) return CATEGORY_COLORS[name]
  return { bg: apiColor || DEFAULT_CATEGORY_COLOR.bg, border: DEFAULT_CATEGORY_COLOR.border }
}
