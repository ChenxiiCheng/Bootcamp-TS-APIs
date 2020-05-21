import { Request, Response, NextFunction } from 'express';
import Course from '@models/course.schema';
import Bootcamp from '@models/bootcamp.schema';
import BadRequestException from '@exceptions/bad-request.exception';
import NotFoundException from '@exceptions/not-found.exception';
import { IRequest } from '@middlewares/auth.middleware';
import { IResponse } from '@middlewares/pagination-populate.middleware';
import InvalidCredentialException from '@exceptions/invalid-credential.exception';

class CourseController {
  /**
   * @desc   Get courses
   * @route  GET /api/v1/courses
   * @route  GET /api/v1/bootcamps/:bootcampId/courses
   * @access Public
   * @param  req
   * @param  res
   */
  public async getCourses(req: Request, res: IResponse, next: NextFunction) {
    try {
      if (req.params.bootcampId) {
        const courses = await Course.find({ bootcamp: req.params.bootcampId });

        return res.status(200).json({
          success: true,
          count: courses.length,
          data: courses,
        });
      } else {
        res.status(200).json(res.resourceResults);
      }
    } catch (error) {
      next(new NotFoundException());
    }
  }

  /**
   * @desc   Get a single course
   * @route  GET /api/v1/courses/:id
   * @access Public
   * @param  req
   * @param  res
   */
  public async getCourse(req: Request, res: Response, next: NextFunction) {
    try {
      const course = await Course.findById(req.params.id).populate({
        path: 'bootcamp',
        select: 'name description',
      });

      if (!course) {
        next(new NotFoundException(req.params.id));
      }

      return res.status(200).json({
        success: true,
        data: course,
      });
    } catch (error) {
      next(new BadRequestException());
    }
  }

  /**
   * @desc   Add a course
   * @route  POST /api/v1/bootcamps/:bootcampId/courses
   * @access Public
   * @param  req
   * @param  res
   */
  public async addCourse(req: IRequest, res: Response, next: NextFunction) {
    try {
      req.body.bootcamp = req.params.bootcampId;
      req.body.user = req.user?.id;

      const bootcamp = await Bootcamp.findById(req.params.bootcampId);

      if (!bootcamp) {
        next(new NotFoundException(req.params.bootcampId));
      }

      // Make sure user is bootcamp owner
      if (bootcamp?.user !== req.user?.id && req.user?.role !== 'admin') {
        return next(
          new InvalidCredentialException(
            `User ${req.params.id} is not authorized to add a course to bootcamp ${bootcamp?._id}`
          )
        );
      }

      const course = await Course.create(req.body);

      return res.status(200).json({
        success: true,
        data: course,
      });
    } catch (error) {
      next(new BadRequestException());
    }
  }

  /**
   * @desc   Update course
   * @route  PUT /api/v1/courses/:id
   * @access Private
   * @param  req
   * @param  res
   */
  public async updateCourse(req: IRequest, res: Response, next: NextFunction) {
    try {
      let course = await Course.findById(req.params.id);

      if (!course) {
        next(new NotFoundException(req.params.id));
      }

      // Make sure user is course owner
      if (course?.user !== req.user?.id && req.user?.role !== 'admin') {
        return next(
          new InvalidCredentialException(
            `User ${req.params.id} is not authorized to update course ${course?._id}`
          )
        );
      }

      course = await Course.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });

      return res.status(200).json({
        success: true,
        data: course,
      });
    } catch (error) {
      next(new BadRequestException());
    }
  }

  /**
   * @desc   Delete course
   * @route  DELETE /api/v1/courses/:id
   * @access Private
   * @param  req
   * @param  res
   */
  public async deleteCourse(req: IRequest, res: Response, next: NextFunction) {
    try {
      const course = await Course.findById(req.params.id);

      if (!course) {
        next(new NotFoundException(req.params.id));
      }

      // Make sure user is course owner
      if (course?.user !== req.user?.id && req.user?.role !== 'admin') {
        return next(
          new InvalidCredentialException(
            `User ${req.params.id} is not authorized to update course ${course?._id}`
          )
        );
      }

      await course?.remove();

      return res.status(200).json({
        success: true,
        data: {},
      });
    } catch (error) {
      next(new BadRequestException());
    }
  }
}

export default new CourseController();
