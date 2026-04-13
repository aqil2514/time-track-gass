import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { catchError, firstValueFrom, retry, throwError, timeout } from 'rxjs';

@Injectable()
export class ActivitiesCronMessageHelper {
  constructor(private readonly service: HttpService) {}

  private readonly url = process.env.SERVICE_KONEKWA_ENDPOINT;
  private readonly logger = new Logger(ActivitiesCronMessageHelper.name);

  private async sendMessage(message: string, to: string) {
    try {
      const connection = this.service
        .post(
          this.url,
          {
            session_id: process.env.SERVICE_KONEKWA_SESSION_ID,
            to,
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
  
  async sendMessageBulk(message: string) {
    this.logger.log("Mengirim pesan : ", message)
    const receivers = [
      process.env.SERVICE_KONEKWA_NO_MBAK_NISA,
      process.env.SERVICE_KONEKWA_NO_MAS_DETHO,
    ];
    await Promise.all(
      receivers.map((receiver) => this.sendMessage(message, receiver)),
    );
  }
}
