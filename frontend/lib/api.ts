import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'

import { clearTokens, getAccessToken, getRefreshToken, setTokens } from '@/lib/auth'
import type { TokenPair } from '@/lib/types'

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api'

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

let refreshPromise: Promise<string | null> | null = null

async function refreshAccessToken() {
  const refresh = getRefreshToken()
  if (!refresh) return null
  const response = await axios.post<TokenPair | { access: string }>(`${API_BASE_URL}/auth/token/refresh/`, { refresh })
  const access = response.data.access
  setTokens({ access, refresh: 'refresh' in response.data ? response.data.refresh : refresh })
  return access
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined
    if (error.response?.status !== 401 || !originalRequest || originalRequest._retry) {
      return Promise.reject(error)
    }

    originalRequest._retry = true
    refreshPromise ??= refreshAccessToken().finally(() => {
      refreshPromise = null
    })

    const token = await refreshPromise
    if (!token) {
      clearTokens()
      return Promise.reject(error)
    }

    originalRequest.headers.Authorization = `Bearer ${token}`
    return api(originalRequest)
  },
)

export async function register(email: string, password: string) {
  const response = await api.post<TokenPair>('/auth/register/', { email, password })
  setTokens(response.data)
  return response.data
}

export async function login(email: string, password: string) {
  const response = await api.post<TokenPair>('/auth/token/', { email, password })
  setTokens(response.data)
  return response.data
}

export function logout() {
  clearTokens()
}
