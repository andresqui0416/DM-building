import { Router, Response } from 'express'
import { authenticate, requireRole, AuthRequest } from '../../middleware/auth'
import { prisma } from '../../db/prisma'

export const adminCategoriesRouter = Router()

// Get flat list and tree
adminCategoriesRouter.get('/', authenticate, requireRole('admin'), async (_req: AuthRequest, res: Response) => {
  try {
    const categories = await prisma.materialCategory.findMany({
      orderBy: [{ parentId: 'asc' }, { sortOrder: 'asc' }, { name: 'asc' }]
    })

    // Build tree (simple in-memory)
    const byId = new Map(categories.map(c => [c.id, { ...c, children: [] as any[] }]))
    const roots: any[] = []
    for (const c of categories) {
      const node = byId.get(c.id)
      if (c.parentId) {
        const parent = byId.get(c.parentId)
        if (parent) parent.children.push(node)
        else roots.push(node)
      } else {
        roots.push(node)
      }
    }

    res.json({ success: true, data: { list: categories, tree: roots } })
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } })
  }
})

// Create
adminCategoriesRouter.post('/', authenticate, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { name, parentId, sortOrder, isActive } = req.body
    if (!name) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'name is required' } })
    }
    const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    const created = await prisma.materialCategory.create({
      data: { name, slug, parentId: parentId || null, sortOrder: sortOrder ?? 0, isActive: isActive ?? true }
    })
    res.status(201).json({ success: true, data: created })
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } })
  }
})

// Update
adminCategoriesRouter.put('/:id', authenticate, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const { name, parentId, sortOrder, isActive } = req.body
    const data: any = {}
    if (name !== undefined) {
      data.name = name
      data.slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    }
    if (parentId !== undefined) data.parentId = parentId
    if (sortOrder !== undefined) data.sortOrder = sortOrder
    if (isActive !== undefined) data.isActive = isActive

    const updated = await prisma.materialCategory.update({ where: { id }, data })
    res.json({ success: true, data: updated })
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Category not found' } })
    }
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } })
  }
})

// Delete: soft disable by isActive=false if has children/materials, else hard delete
adminCategoriesRouter.delete('/:id', authenticate, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const childrenCount = await prisma.materialCategory.count({ where: { parentId: id } })
    const materialsCount = await prisma.material.count({ where: { categoryId: id } })

    if (childrenCount > 0 || materialsCount > 0) {
      const updated = await prisma.materialCategory.update({ where: { id }, data: { isActive: false } })
      return res.json({ success: true, data: updated, meta: { softDeleted: true } })
    }

    await prisma.materialCategory.delete({ where: { id } })
    res.json({ success: true, data: { id } })
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Category not found' } })
    }
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } })
  }
})
