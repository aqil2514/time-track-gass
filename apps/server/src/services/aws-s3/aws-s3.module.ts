import { Global, Module } from '@nestjs/common';
import { S3Client } from '@aws-sdk/client-s3';

@Global()
@Module({
  providers: [
    {
      provide: 'AWS_S3_CLIENT',
      useFactory: () =>
        new S3Client({
          region: 'auto',
          endpoint: process.env.S3_ENDPOINT,
          credentials: {
            accessKeyId: process.env.S3_ACCESS_KEY_ID,
            secretAccessKey: process.env.S3_ACCES_SECRET_KEY,
          },
        }),
    },
  ],
  exports:['AWS_S3_CLIENT']
})
export class AWSS3Module {}
