import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { catchError, firstValueFrom, retry, throwError, timeout } from 'rxjs';

@Injectable()
export class ActivitiesCronMessageHelper {
  constructor(private readonly service: HttpService) {}

  private readonly url = process.env.SERVICE_KONEKWA_ENDPOINT;
  private readonly logger = new Logger(ActivitiesCronMessageHelper.name)

  async sendMessage(message:string) {
    try {
      const connection = this.service
        .post(
          this.url,
          {
            session_id: '62811251852',
            to: '628985606632',
            type: 'text',
            body: message,
          },
          {
            headers: {
              'X-API-Key': process.env.SERVICE_KONEKWA_API_KEY,
            },
          },
        )
        .pipe(
          timeout(5000),
          retry({ count: 3, delay: 2000 }),
          catchError((err) => throwError(() => err)),
        );

      await firstValueFrom(connection);

      this.logger.log('Pesan berhasil dikirim ke provider');
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }
}
