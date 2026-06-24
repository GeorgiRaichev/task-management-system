import { Router } from 'express';
import { usersController } from '../controllers/users.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';
import { UserRole } from '../models/user.model.js';

const router = Router();

router.use(authenticate);

router.get('/select-options', usersController.getUserOptions);

router.get('/', authorizeRoles(UserRole.ADMINISTRATOR), usersController.getUsers);
router.get('/:userId', authorizeRoles(UserRole.ADMINISTRATOR), usersController.getUser);
router.post('/', authorizeRoles(UserRole.ADMINISTRATOR), usersController.createUser);
router.put('/:userId', authorizeRoles(UserRole.ADMINISTRATOR), usersController.updateUser);
router.delete('/:userId', authorizeRoles(UserRole.ADMINISTRATOR), usersController.deleteUser);

export default router;