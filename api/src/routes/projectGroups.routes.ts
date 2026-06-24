import { Router } from 'express';
import { projectGroupsController } from '../controllers/projectGroups.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', projectGroupsController.getProjectGroups);
router.get('/:groupId', projectGroupsController.getProjectGroup);
router.post('/', projectGroupsController.createProjectGroup);
router.put('/:groupId', projectGroupsController.updateProjectGroup);
router.delete('/:groupId', projectGroupsController.deleteProjectGroup);
router.post('/:groupId/members', projectGroupsController.addMember);
router.put('/:groupId/members/:userId', projectGroupsController.updateMemberRole);
router.delete('/:groupId/members/:userId', projectGroupsController.removeMember);

export default router;