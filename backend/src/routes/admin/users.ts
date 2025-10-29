import { Router, Response } from 'express'
import { AuthRequest } from '../../middleware/auth'
import { prisma } from '../../db/prisma'
import { Prisma, users_role } from '@prisma/client'

export const adminUsersRouter = Router()

// Get all users with their stats
adminUsersRouter.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 25
    const skip = (page - 1) * limit

    const where: Prisma.usersWhereInput = {
      deleted_at: null,
      role: users_role.customer // Only show regular customers, not company members
    }

    // Get total count for pagination
    const total = await prisma.users.count({ where })

    const users = await prisma.users.findMany({
      where,
      skip,
      take: limit,
      select: {
        id: true,
        name: true,
        email: true,
        email_verified: true,
        created_at: true,
        avatar_url: true,
        _count: {
          select: {
            orders_orders_user_idTousers: true,
            projects: true,
            chat_sessions_chat_sessions_user_idTousers: true
          }
        },
        orders_orders_user_idTousers: {
          where: {
            status: {
              in: ['paid', 'in_progress']
            }
          },
          select: {
            id: true,
            status: true,
            total_price: true
          },
          take: 5,
          orderBy: {
            created_at: 'desc'
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    })

    // Get active chat counts separately
    const userIds = users.map((u: any) => u.id)
    const activeChatCounts = await prisma.chat_sessions.groupBy({
      by: ['user_id'],
      where: {
        user_id: { in: userIds },
        status: 'open'
      },
      _count: {
        id: true
      }
    })
    const activeChatMap = new Map(activeChatCounts.map((ac: any) => [ac.user_id, ac._count.id]))

    // Format response with user stats
    const usersWithStats = users.map((user: any) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      emailVerified: user.email_verified,
      avatarUrl: user.avatar_url,
      createdAt: user.created_at,
      stats: {
        totalProjects: user._count.projects,
        totalOrders: user._count.orders_orders_user_idTousers,
        activeOrders: user.orders_orders_user_idTousers?.filter((o: any) => o.status === 'in_progress').length || 0,
        activeChats: activeChatMap.get(user.id) || 0,
        pendingOrders: user.orders_orders_user_idTousers?.filter((o: any) => o.status === 'paid').length || 0
      },
      recentOrders: user.orders_orders_user_idTousers || []
    }))

    const totalPages = Math.ceil(total / limit)

    res.json({
      success: true,
      data: usersWithStats,
      pagination: {
        page,
        limit,
        total,
        totalPages
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

// Get single user details
adminUsersRouter.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params

    const user = await prisma.users.findUnique({
      where: { id },
      include: {
        projects: {
          take: 5,
          orderBy: { created_at: 'desc' },
          select: {
            id: true,
            name: true,
            estimated_cost: true,
            created_at: true
          }
        },
        orders_orders_user_idTousers: {
          take: 10,
          orderBy: { created_at: 'desc' },
          select: {
            id: true,
            status: true,
            total_price: true,
            created_at: true
          }
        },
        chat_sessions_chat_sessions_user_idTousers: {
          where: { status: 'open' },
          select: {
            id: true,
            mode: true,
            chat_type: true,
            created_at: true
          }
        },
        consultations: {
          where: {
            status: 'scheduled'
          },
          select: {
            id: true,
            meeting_time: true,
            experts: {
              select: {
                users: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        }
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

    const { password_hash, ...userWithoutPassword } = user

    res.json({
      success: true,
      data: userWithoutPassword
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

