import { Router } from 'express';
import authRoutes from './auth.routes.js';
import projectRoutes from './projects.routes.js';
import projectGroupRoutes from './projectGroups.routes.js';

const router = Router();

router.get('/health', (_req, res) => {
    res.status(200).json({
        message: 'API is running'
    });
});

router.use('/auth', authRoutes);
router.use('/projects', projectRoutes);
router.use('/groups', projectGroupRoutes);

export default router;