import { Router } from 'express';
import { getResult, getResultByAssignment, regenerateResult, downloadPDF } from '../controllers/result.controller';
import { validate } from '../middleware/validate';
import { generationLimiter } from '../middleware/rateLimiter';
import { idParamSchema } from '../validators/assignment.validator';

const router = Router();

router.get('/:id', validate(idParamSchema, 'params'), getResult);
router.get('/:id/pdf', validate(idParamSchema, 'params'), downloadPDF);
router.get('/assignment/:id', validate(idParamSchema, 'params'), getResultByAssignment);
router.post('/:id/regenerate', generationLimiter, validate(idParamSchema, 'params'), regenerateResult);

export { router as resultRoutes };
