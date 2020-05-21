import { Router } from 'express';
import { protect, authorize } from '@middlewares/auth.middleware';
import courseController from '@controllers/course.controller';
import Course from '@models/course.schema';
import paginationAndPopulate from '@middlewares/pagination-populate.middleware';

const router = Router({ mergeParams: true });

// GET /api/v1/bootcamps/:bootcampId/courses
router.get(
  '/',
  paginationAndPopulate(Course, {
    path: 'bootcamp',
    select: 'name description',
  }),
  courseController.getCourses
);
// POST /api/v1/bootcamps/:bootcampId/courses
router.post(
  '/',
  protect,
  authorize('publisher', 'admin'),
  courseController.addCourse
);

router.get('/:id', courseController.getCourse);
router.put(
  '/:id',
  protect,
  authorize('publisher', 'admin'),
  courseController.updateCourse
);
router.delete(
  '/:id',
  protect,
  authorize('publisher', 'admin'),
  courseController.deleteCourse
);

export default router;
