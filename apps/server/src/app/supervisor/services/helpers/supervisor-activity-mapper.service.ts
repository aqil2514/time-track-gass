import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Inject, Injectable } from '@nestjs/common';
import {
  AIScreenReportPopulateUser,
  AIScreenReportPopulateUserAndS3Image,
} from 'src/app/image-upload/interfaces/ai-screen-report.interface';

@Injectable()
export class SupervisorActivityMapper {
  constructor(
    @Inject('AWS_S3_CLIENT')
    private readonly awsClient: S3Client,
  ) {}

  async mapPopulatedDataKeyToImageUrl(
    payload: AIScreenReportPopulateUser,
  ): Promise<AIScreenReportPopulateUserAndS3Image> {
    const { s3_key, ...rest } = payload;

    if (!s3_key)
      return {
        ...rest,
        image_url: '',
      };
      
    const getCommand = new GetObjectCommand({
      Bucket: 'tracker',
      Key: s3_key,
    });

    const image_url = await getSignedUrl(this.awsClient, getCommand, {
      expiresIn: 3600,
    });

    return {
      ...rest,
      image_url,
    };
  }
}
