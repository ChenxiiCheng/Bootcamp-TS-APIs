import { Router } from 'express';
import bootcampController from '@controllers/bootcamp.controller';
import { protect, authorize } from '@middlewares/auth.middleware';
import courseRoute from '@routes/course.route';
import Bootcamp from '@models/bootcamp.schema';
import paginationAndPopulate from '@middlewares/pagination-populate.middleware';

const router = Router();

// Re-route into other resource routers
router.use('/:bootcampId/courses', courseRoute);

// PUT /api/v1/bootcamps/:id/photo
router.put(
  '/:id/photo',
  protect,
  authorize('publisher', 'admin'),
  bootcampController.bootcampPhotoUpload
);

router.get(
  '/',
  paginationAndPopulate(Bootcamp, 'courses'),
  bootcampController.getBootcamps
);
router.get('/:id', bootcampController.getBootcamp);
router.get(
  '/radius/:zipcode/:distance',
  bootcampController.getBootcampsInRadius
);
router.post(
  '/',
  protect,
  authorize('publisher', 'admin'),
  bootcampController.createBootcamp
);
router.put(
  '/:id',
  protect,
  authorize('publisher', 'admin'),
  bootcampController.updateBootcamp
);
router.delete(
  '/:id',
  protect,
  authorize('publisher', 'admin'),
  bootcampController.deleteBootcamp
);

export default router;
