import { Controller, Get, Inject } from '@nestjs/common';
import { AppService } from './app.service';
import {
  GetObjectCommand,
  ListObjectsCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    @Inject('AWS_S3_CLIENT')
    private readonly s3Client: S3Client,
  ) {}

  // @Get('test')
  // async testFunction() {
  //   const listCommand = new ListObjectsCommand({
  //     Bucket: 'tracker',
  //     EncodingType: 'url',
  //     Prefix: 'Activity',
  //   });

  //   const responseList = await this.s3Client.send(listCommand);

  //   const keyList =
  //     responseList.Contents?.filter((item) => item.Size > 0)?.map(
  //       (item) => item.Key,
  //     ) || [];

  //   const imageUrls: string[] = await Promise.all(
  //     keyList.map(async (item) => {
  //       const command = new GetObjectCommand({ Bucket: 'tracker', Key: item });
  //       const url = await getSignedUrl(this.s3Client, command, {
  //         expiresIn: 3600,
  //       });

  //       return url;
  //     }),
  //   );

  //   return { imageUrls };
  // }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
