import { RegisterDto, LoginDto, User, UserRole } from '../types/auth'
import { hashPassword, comparePassword } from '../utils/password'
import { generateAccessToken, generateRefreshToken } from '../utils/jwt'
import { prisma } from '../db/prisma'

export interface AuthResponse {
  user: User
  accessToken: string
  refreshToken: string
}

export class AuthService {
  async register(data: RegisterDto, role: UserRole = 'customer'): Promise<AuthResponse> {
    // Check if user exists
    const existingUser = await prisma.users.findUnique({
      where: { email: data.email }
    })
    if (existingUser) {
      throw new Error('User with this email already exists')
    }

    // Hash password
    const passwordHash = await hashPassword(data.password)

    // Create user
    const user = await prisma.users.create({
      data: {
        name: data.name,
        email: data.email,
        password_hash: passwordHash,
        role: role as any,
        email_verified: false,
        avatar_url: null
      } as any
    })

    // Generate tokens
    const { password_hash: _, ...userWithoutPassword } = user
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role
    })
    const refreshToken = generateRefreshToken({
      userId: user.id,
      email: user.email,
      role: user.role
    })

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role as UserRole,
        avatarUrl: user.avatar_url,
        emailVerified: user.email_verified,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      },
      accessToken,
      refreshToken
    }
  }

  async login(data: LoginDto): Promise<AuthResponse> {
    // Find user
    const user = await prisma.users.findUnique({
      where: { email: data.email }
    })
    if (!user) {
      throw new Error('Invalid email or password')
    }

    // Verify password
    const isValid = await comparePassword(data.password, user.password_hash)
    if (!isValid) {
      throw new Error('Invalid email or password')
    }

    // Generate tokens
    const { password_hash: _, ...userWithoutPassword } = user
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role
    })
    const refreshToken = generateRefreshToken({
      userId: user.id,
      email: user.email,
      role: user.role
    })

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role as UserRole,
        avatarUrl: user.avatar_url,
        emailVerified: user.email_verified,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      },
      accessToken,
      refreshToken
    }
  }
}

export const authService = new AuthService()

