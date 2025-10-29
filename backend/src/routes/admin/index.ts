import { Router } from 'express'
import { adminMaterialsRouter } from './materials'
import { adminCategoriesRouter } from './categories'
import { adminUsersRouter } from './users'

export const adminRouter = Router()

adminRouter.use('/materials', adminMaterialsRouter);
adminRouter.use('/categories', adminCategoriesRouter);
adminRouter.use('/users', adminUsersRouter);

export default adminRouter;