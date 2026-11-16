import { Router } from 'express';
import * as ctrl from '../controllers/user.controller';
import { validate } from '../middlewares/validate';
import { asyncHandler } from '../utils/asyncHandler';
import { createUserSchema, idParamSchema } from '../validators';

const router = Router();

router.post('/', validate(createUserSchema), asyncHandler(ctrl.createUser));
router.get('/:id/sessions', validate(idParamSchema, 'params'), asyncHandler(ctrl.getUserSessions));

export default router;
