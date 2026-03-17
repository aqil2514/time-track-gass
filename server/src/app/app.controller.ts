import { Controller, Get, Inject } from '@nestjs/common';
import { AppService } from './app.service';
import {
  S3Client,
  GetObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    @Inject('AWS_S3_CLIENT')
    private readonly s3Client: S3Client,
  ) {}

  @Get('aws')
  async awsTest() {
    const listobject = new ListObjectsV2Command({
      Bucket: 'tracker',
      Prefix: 'Activity-',
    });
    const listobjectResponse = await this.s3Client.send(listobject);

    const getObject = new GetObjectCommand({
      Bucket: 'tracker',
      Key: 'Activity-518c3daa-510a-4d7e-85e3-8a070f376b18-1773712147463.webp',
    });

    const url = await getSignedUrl(this.s3Client, getObject, {expiresIn: 3600})
    return { data: listobjectResponse, url: url };
  }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
