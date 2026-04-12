import type { TokenPair } from '@/lib/types'

const ACCESS_TOKEN_KEY = 'cozy-notes-access-token'
const REFRESH_TOKEN_KEY = 'cozy-notes-refresh-token'

export function getAccessToken() {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function getRefreshToken() {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(REFRESH_TOKEN_KEY)
}

export function setTokens(tokens: TokenPair) {
  window.localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access)
  window.localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh)
}

export function clearTokens() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(ACCESS_TOKEN_KEY)
  window.localStorage.removeItem(REFRESH_TOKEN_KEY)
}
