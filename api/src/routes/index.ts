import { Router } from 'express';
import attachmentRoutes from './attachments.routes.js';
import authRoutes from './auth.routes.js';
import commentRoutes from './comments.routes.js';
import notificationRoutes from './notifications.routes.js';
import projectGroupRoutes from './projectGroups.routes.js';
import projectRoutes from './projects.routes.js';
import taskRoutes from './tasks.routes.js';

const router = Router();

router.get('/health', (_req, res) => {
    res.status(200).json({
        message: 'API is running'
    });
});

router.use('/auth', authRoutes);
router.use('/projects', projectRoutes);
router.use('/groups', projectGroupRoutes);
router.use('/tasks', taskRoutes);
router.use('/notifications', notificationRoutes);
router.use('/attachments', attachmentRoutes);
router.use('/comments', commentRoutes);

export default router;