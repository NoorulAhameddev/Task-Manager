import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { validate, validateQuery } from '../middleware/validate';
import { createTaskSchema, updateTaskSchema, taskQuerySchema } from '../validators/task.validator';
import * as taskController from '../controllers/task.controller';

const router = Router();

router.use(requireAuth);

router.get('/', validateQuery(taskQuerySchema), taskController.getAll);
router.get('/:id', taskController.getOne);
router.post('/', validate(createTaskSchema), taskController.create);
router.put('/:id', validate(updateTaskSchema), taskController.update);
router.delete('/:id', taskController.remove);

export default router;
