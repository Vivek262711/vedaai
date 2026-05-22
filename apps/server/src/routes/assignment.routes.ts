import { Router } from 'express';
import { createAssignment, getAssignment, getAllAssignments, generateAssignment } from '../controllers/assignment.controller';
import { validate } from '../middleware/validate';
import { upload } from '../middleware/upload';
import { generationLimiter, uploadLimiter } from '../middleware/rateLimiter';
import { createAssignmentSchema, idParamSchema, paginationSchema } from '../validators/assignment.validator';

const router = Router();

const parseFormJsonFields = (req: any, _res: any, next: any) => {
  if (req.body) {
    if (typeof req.body.difficultyDistribution === 'string') {
      try {
        req.body.difficultyDistribution = JSON.parse(req.body.difficultyDistribution);
      } catch (e) {}
    }
    if (typeof req.body.questionTypes === 'string') {
      try {
        req.body.questionTypes = JSON.parse(req.body.questionTypes);
      } catch (e) {}
    }
  }
  next();
};

router.post('/', uploadLimiter, upload.single('file'), parseFormJsonFields, validate(createAssignmentSchema), createAssignment);
router.get('/', validate(paginationSchema, 'query'), getAllAssignments);
router.get('/:id', validate(idParamSchema, 'params'), getAssignment);
router.post('/:id/generate', generationLimiter, validate(idParamSchema, 'params'), generateAssignment);

export { router as assignmentRoutes };
