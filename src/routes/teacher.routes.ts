import { Router } from 'express';
import * as ctrl from '../controllers/teacher.controller';
import { validate } from '../middlewares/validate';
import { asyncHandler } from '../utils/asyncHandler';
import { createTeacherSchema } from '../validators';

const router = Router();

router.post('/', validate(createTeacherSchema), asyncHandler(ctrl.createTeacher));

export default router;
