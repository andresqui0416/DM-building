import { Router } from 'express';
import adminRouter from './admin';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth'
import { authRouter } from './auth'

export const apiRouter = Router();

apiRouter.use('/admin', authenticate, requireRole('admin'),adminRouter);
apiRouter.use('/auth', authRouter);
export default apiRouter;