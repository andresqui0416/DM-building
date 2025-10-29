'use client'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

// Get stored tokens
export function getTokens(): AuthTokens | null {
  if (typeof window === 'undefined') return null
  
  const accessToken = localStorage.getItem('token')
  const refreshToken = localStorage.getItem('refreshToken')
  
  if (!accessToken || !refreshToken) return null
  
  return { accessToken, refreshToken }
}

// Store tokens
export function setTokens(tokens: AuthTokens) {
  localStorage.setItem('token', tokens.accessToken)
  localStorage.setItem('refreshToken', tokens.refreshToken)
}

// Clear tokens
export function clearTokens() {
  localStorage.removeItem('token')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('user')
}

// Refresh access token using refresh token
export async function refreshAccessToken(): Promise<string | null> {
  const tokens = getTokens()
  if (!tokens?.refreshToken) {
    return null
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ refreshToken: tokens.refreshToken })
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    
    if (data.data?.accessToken) {
      localStorage.setItem('token', data.data.accessToken)
      return data.data.accessToken
    }

    return null
  } catch (error) {
    // Silent failure - just return null
    return null
  }
}

// API request wrapper with automatic token refresh
export async function apiRequest<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const tokens = getTokens()
  
  // Add authorization header if token exists
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  }

  if (tokens?.accessToken) {
    headers['Authorization'] = `Bearer ${tokens.accessToken}`
  }

  // Make the request
  let response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers: headers as HeadersInit
  })

  // If token expired, try to refresh and retry
  if (response.status === 401 && tokens?.refreshToken) {
    const newAccessToken = await refreshAccessToken()
    
    if (newAccessToken) {
      // Retry the request with new token
      headers['Authorization'] = `Bearer ${newAccessToken}`
      response = await fetch(`${API_BASE_URL}${url}`, {
        ...options,
        headers: headers as HeadersInit
      })
    } else {
      // Refresh failed, clear tokens and redirect to login silently
      clearTokens()
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname + window.location.search
        window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`
      }
      // Return empty response to prevent error propagation
      return {} as T
    }
  }

  // Handle non-401 errors (but not 401 as it's handled above)
  if (!response.ok && response.status !== 401) {
    const error = await response.json().catch(() => ({ error: { message: 'Request failed' } }))
    throw new Error(error.error?.message || `Request failed: ${response.status}`)
  }

  // If still 401 after refresh attempt, redirect silently
  if (response.status === 401) {
    clearTokens()
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname + window.location.search
      window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`
    }
    return {} as T
  }

  return response.json() as Promise<T>
}

