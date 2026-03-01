import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async uploadImageFile(file: Express.Multer.File) {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          upload_preset: 'gass-tracker',
        },
        (error, result) => {
          console.error(error);
          if (error) return reject(error);

          return resolve(result);
        },
      );

      stream.end(file.buffer);
    });
  }
}
