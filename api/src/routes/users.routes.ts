import { Router } from 'express';
import { usersController } from '../controllers/users.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createUserSchema, updateUserSchema } from '../validators/user.validator.js';

const router = Router();

router.use(authenticate);

router.get('/', usersController.getUsers);
router.post('/', validate(createUserSchema), usersController.createUser);
router.get('/:userId', usersController.getUser);
router.put('/:userId', validate(updateUserSchema), usersController.updateUser);
router.delete('/:userId', usersController.deleteUser);

export default router;