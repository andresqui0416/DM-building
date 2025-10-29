import { Router, Request, Response } from 'express'
import { authenticate, requireRole, AuthRequest } from '../../middleware/auth'
import { prisma } from '../../db/prisma'
import { Prisma } from '@prisma/client'

export const adminMaterialsRouter = Router()

// Get all materials with pagination
adminMaterialsRouter.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 25
    const skip = (page - 1) * limit
    const categoryId = req.query.categoryId as string | undefined
    const searchRaw = req.query.search as string | undefined
    const search = searchRaw ? searchRaw.replace(/\+/g, ' ').trim() : undefined
    const isActive = req.query.isActive !== undefined 
      ? req.query.isActive === 'true' 
      : undefined

    // If categoryId is provided, get all subcategory IDs (including the parent itself)
    let categoryIds: string[] | undefined = undefined
    if (categoryId) {
      // First, fetch all categories to build the tree
      const allCategories = await prisma.materialCategory.findMany({
        where: { isActive: true }
      })
      
      // Recursive function to get all descendant IDs
      const getDescendantIds = (parentId: string): string[] => {
        const descendants: string[] = [parentId] // Include the parent itself
        const children = allCategories.filter(c => c.parentId === parentId)
        for (const child of children) {
          descendants.push(...getDescendantIds(child.id))
        }
        return descendants
      }
      
      categoryIds = getDescendantIds(categoryId)
    }

    const where: Prisma.MaterialWhereInput = {
      ...(categoryIds && { categoryId: { in: categoryIds } }),
      ...(isActive !== undefined && { isActive }),
      ...(search
        ? {
            OR: [
              { name: { contains: search } },
              { description: { contains: search } }
            ]
          }
        : {})
    }

    // Get total count for pagination
    const total = await prisma.material.count({ where })

    const materials = await prisma.material.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc'
      }
    })

    const totalPages = Math.ceil(total / limit)

    // Also fetch category tree
    const categories = await prisma.materialCategory.findMany({
      where: { isActive: true },
      orderBy: [{ parentId: 'asc' }, { sortOrder: 'asc' }, { name: 'asc' }]
    })

    res.json({
      success: true,
      data: materials.map(material => ({
        ...material,
        unitCost: Number(material.unitCost)
      })),
      categories,
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

// Get single material details
adminMaterialsRouter.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params

    const material = await prisma.material.findUnique({
      where: { id }
    })

    if (!material) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'MATERIAL_NOT_FOUND',
          message: 'Material not found'
        }
      })
    }

    res.json({
      success: true,
      data: {
        ...material,
        unitCost: Number(material.unitCost)
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

// Create new material
adminMaterialsRouter.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { name, categoryId, unit, unitCost, textureUrl, modelUrl, description, isActive } = req.body

    if (!name || !categoryId || unitCost === undefined || !unit) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Name, categoryId, unit, and unitCost are required'
        }
      })
    }

    const material = await prisma.material.create({
      data: {
        name,
        categoryId,
        unit,
        unitCost,
        textureUrl,
        modelUrl,
        description,
        isActive: isActive !== undefined ? isActive : true
      } as any
    })

    res.status(201).json({
      success: true,
      data: {
        ...material,
        unitCost: Number(material.unitCost)
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

// Update material
adminMaterialsRouter.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const { name, categoryId, unit, unitCost, textureUrl, modelUrl, description, isActive } = req.body

    const material = await prisma.material.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(categoryId && { categoryId }),
        ...(unit !== undefined && { unit }),
        ...(unitCost !== undefined && { unitCost }),
        ...(textureUrl !== undefined && { textureUrl }),
        ...(modelUrl !== undefined && { modelUrl }),
        ...(description !== undefined && { description }),
        ...(isActive !== undefined && { isActive })
      }
    })

    res.json({
      success: true,
      data: {
        ...material,
        unitCost: Number(material.unitCost)
      }
    })
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: {
          code: 'MATERIAL_NOT_FOUND',
          message: 'Material not found'
        }
      })
    }
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message
      }
    })
  }
})

// Delete material (soft delete by setting isActive to false)
adminMaterialsRouter.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params

    const material = await prisma.material.update({
      where: { id },
      data: { isActive: false }
    })

    res.json({
      success: true,
      data: {
        ...material,
        unitCost: Number(material.unitCost)
      }
    })
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: {
          code: 'MATERIAL_NOT_FOUND',
          message: 'Material not found'
        }
      })
    }
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message
      }
    })
  }
})

