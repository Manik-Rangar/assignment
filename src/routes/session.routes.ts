import { Router } from 'express';
import * as ctrl from '../controllers/session.controller';
import { validate } from '../middlewares/validate';
import { asyncHandler } from '../utils/asyncHandler';
import {
  availableQuerySchema,
  bookSessionSchema,
  createSessionSchema,
  idParamSchema,
} from '../validators';

const router = Router();

router.post('/', validate(createSessionSchema), asyncHandler(ctrl.createSession));
router.get(
  '/available',
  validate(availableQuerySchema, 'query'),
  asyncHandler(ctrl.getAvailableSessions),
);
router.post(
  '/:id/book',
  validate(idParamSchema, 'params'),
  validate(bookSessionSchema),
  asyncHandler(ctrl.bookSession),
);
router.patch(
  '/:id/complete',
  validate(idParamSchema, 'params'),
  asyncHandler(ctrl.completeSession),
);

export default router;
