import path from 'path';
import { Request, Response, NextFunction } from 'express';
import { UploadedFile } from 'express-fileupload';
import geocoder from '@utils/geocoder.util';
import Bootcamp from '@models/bootcamp.schema';
import NotFoundException from '@exceptions/not-found.exception';
import ServerErrorException from '@exceptions/server-error.exception';
import BadRequestException from '@exceptions/bad-request.exception';
import uploadConfig from '@config/upload';
import { IRequest } from '@middlewares/auth.middleware';
import { IResponse } from '@middlewares/pagination-populate.middleware';
import InvalidCredentialException from '@exceptions/invalid-credential.exception';

class BootcampController {
  /**
   * @desc   Get all bootcamps
   * @route  GET /api/v1/bootcamps
   * @access Public
   * @param  req
   * @param  res
   */
  public async getBootcamps(
    req: Request,
    res: IResponse,
    next: NextFunction
  ): Promise<Response | void> {
    try {
      return res.status(200).json(res.resourceResults);
    } catch (error) {
      return next(new BadRequestException());
    }
  }

  /**
   * @desc   Get single bootcamp
   * @route  GET /api/v1/bootcamps/:id
   * @access Public
   * @param  req
   * @param  res
   */
  public async getBootcamp(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    try {
      const bootcamp = await Bootcamp.findById(req.params.id);

      if (!bootcamp) {
        return next(new NotFoundException(req.params.id));
      }

      return res.status(200).json({
        success: true,
        data: bootcamp,
      });
    } catch (error) {
      // return res.status(400).json({ success: false });
      return next(new BadRequestException());
    }
  }

  /**
   * @desc   Create new bootcamp
   * @route  POST /api/v1/bootcamps
   * @access Private
   * @param  req
   * @param  res
   */
  public async createBootcamp(
    req: IRequest,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    try {
      // Add user to req.body
      // 要添加的bootcamp是放在当前登录用户的下面的
      req.body.user = req.user?.id;

      // Check for published bootcamp
      const publishedBootcamp = await Bootcamp.findOne({ user: req.user?.id });

      // If the user is not an admin, they can only add one bootcamp
      if (publishedBootcamp && req.user?.role !== 'admin') {
        return next(
          new BadRequestException(
            `The uuser with ID ${req.user?.id} has already published a bootcamp`
          )
        );
      }

      const bootcamp = await Bootcamp.create(req.body);
      return res.status(201).json({
        success: true,
        data: bootcamp,
      });
    } catch (error) {
      return next(new BadRequestException());
    }
  }

  /**
   * @desc   Update bootcamp
   * @route  PUT /api/v1/bootcamps/:id
   * @access Private
   * @param  req
   * @param  res
   */
  public async updateBootcamp(
    req: IRequest,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    try {
      let bootcamp = await Bootcamp.findById(req.params.id);

      if (!bootcamp) {
        return next(new NotFoundException(req.params.id));
      }

      // Make sure user is bootcamp owner
      if (bootcamp.user !== req.user?.id && req.user?.role !== 'admin') {
        return next(
          new InvalidCredentialException(
            `User ${req.params.id} is not authorized to upadte this bootcamp`
          )
        );
      }

      bootcamp = await Bootcamp.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });

      return res.status(200).json({
        success: true,
        data: bootcamp,
      });
    } catch (error) {
      console.log(error);
      return next(new BadRequestException());
    }
  }

  /**
   * @desc   Delete bootcamp
   * @route  DELETE /api/v1/bootcamps/:id
   * @access Private
   * @param  req
   * @param  res
   */
  public async deleteBootcamp(
    req: IRequest,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    try {
      const bootcamp = await Bootcamp.findById(req.params.id);

      if (!bootcamp) {
        return next(new NotFoundException(req.params.id));
      }

      // Make sure user is bootcamp owner
      if (bootcamp.user !== req.user?.id && req.user?.role !== 'admin') {
        return next(
          new InvalidCredentialException(
            `User ${req.params.id} is not authorized to delete this bootcamp`
          )
        );
      }

      bootcamp?.remove();

      return res.status(200).json({
        success: true,
        data: {},
      });
    } catch (error) {
      return next(new BadRequestException());
    }
  }

  /**
   * @desc   Get bootcamp within a radius
   * @route  GET /api/v1/bootcamps/radius/:zipcode/:distance
   * @access Private
   * @param  req
   * @param  res
   */
  public async getBootcampsInRadius(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    try {
      const { zipcode, distance } = req.params;

      // Get lat/lng from geocoder
      const loc = await geocoder.geocode(zipcode);
      const lat = loc[0].latitude;
      const lng = loc[0].longitude;

      // Cal radius using radians
      // Divide dist by radius of Earth
      // Earth Radius = 3,963 mi / 6,378 km
      const radius = parseInt(distance) / 3963;

      const bootcamps = await Bootcamp.find({
        location: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
      });

      return res.status(200).json({
        success: true,
        count: bootcamps.length,
        data: bootcamps,
      });
    } catch (error) {
      return next(new BadRequestException());
    }
  }

  /**
   * @desc   Upload photo for bootcamp
   * @route  PUT /api/v1/bootcamps/:id/photo
   * @access Private
   * @param  req
   * @param  res
   */
  public async bootcampPhotoUpload(
    req: IRequest,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    try {
      const bootcamp = await Bootcamp.findById(req.params.id);

      if (!bootcamp) {
        return next(new NotFoundException(req.params.id));
      }

      // Make sure user is bootcamp owner
      if (bootcamp.user !== req.user?.id && req.user?.role !== 'admin') {
        return next(
          new InvalidCredentialException(
            `User ${req.params.id} is not authorized to upadte this bootcamp`
          )
        );
      }

      if (!req.files) {
        return next(new BadRequestException('Please upload a file'));
      }

      const file = req.files?.file as UploadedFile;

      // Make sure img is a photo
      if (!file.mimetype.startsWith('image')) {
        return next(new BadRequestException('Please upload an image file'));
      }

      // Check filesize
      if (file.size > parseInt(uploadConfig.max_file_upload as string)) {
        return next(
          new BadRequestException(
            `Please upload an image size less than ${uploadConfig.max_file_upload}`
          )
        );
      }

      // Create custom filename
      file.name = `photo_${bootcamp._id}${path.parse(file.name).ext}`;

      file.mv(`${uploadConfig.file_upload_path}/${file.name}`, async (err) => {
        if (err) {
          console.error(err);
          return next(new ServerErrorException(`Problem with file upload`));
        }

        await Bootcamp.findByIdAndUpdate(req.params.id, { photo: file.name });

        return res.status(200).json({
          success: true,
          data: file.name,
        });
      });
    } catch (error) {
      return next(new BadRequestException());
    }
  }
}

export default new BootcampController();
