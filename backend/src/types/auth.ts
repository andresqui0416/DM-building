export type UserRole = 'customer' | 'cm_team' | 'expert' | 'admin'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  avatarUrl?: string | null
  emailVerified: boolean
  createdAt: Date
  updatedAt: Date
}

export interface JWTPayload {
  userId: string
  email: string
  role: UserRole
}

export interface RegisterDto {
  name: string
  email: string
  password: string
}

export interface LoginDto {
  email: string
  password: string
}

