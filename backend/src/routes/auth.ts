import { Router, Request, Response } from 'express'
import { authService } from '../services/authService'
import { authenticate, AuthRequest } from '../middleware/auth'
import { RegisterDto, LoginDto } from '../types/auth'
import { verifyRefreshToken, generateAccessToken } from '../utils/jwt'
import { prisma } from '../db/prisma'

export const authRouter = Router()

authRouter.post('/register', async (req: Request, res: Response) => {
  try {
    const data: RegisterDto = req.body

    // Validation
    if (!data.name || !data.email || !data.password) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Name, email, and password are required'
        }
      })
    }

    if (data.password.length < 8) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Password must be at least 8 characters long'
        }
      })
    }

    const result = await authService.register(data)
    res.status(201).json({
      success: true,
      data: result
    })
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'REGISTRATION_FAILED',
        message: error.message
      }
    })
  }
})

authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const data: LoginDto = req.body

    // Validation
    if (!data.email || !data.password) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Email and password are required'
        }
      })
    }

    const result = await authService.login(data)
    res.json({
      success: true,
      data: result
    })
  } catch (error: any) {
    res.status(401).json({
      success: false,
      error: {
        code: 'LOGIN_FAILED',
        message: error.message
      }
    })
  }
})

authRouter.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Refresh token is required'
        }
      })
    }

    // Verify refresh token and generate new access token
    const payload = verifyRefreshToken(refreshToken)
    const newAccessToken = generateAccessToken({
      userId: payload.userId,
      email: payload.email,
      role: payload.role
    })

    res.json({
      success: true,
      data: {
        accessToken: newAccessToken
      }
    })
  } catch (error: any) {
    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_REFRESH_TOKEN',
        message: 'Invalid or expired refresh token'
      }
    })
  }
})

authRouter.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.users.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar_url: true,
        email_verified: true,
        created_at: true,
        updated_at: true
      }
    })
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      })
    }

    res.json({
      success: true,
      data: { 
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatarUrl: user.avatar_url,
          emailVerified: user.email_verified,
          createdAt: user.created_at,
          updatedAt: user.updated_at
        }
      }
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message
      }
    })
  }
})

