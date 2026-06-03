import { HttpService } from '@nestjs/axios';
import { Logger } from '@nestjs/common';
import { catchError, firstValueFrom, retry, throwError, timeout } from 'rxjs';

const logger = new Logger('sendReminderMessage');

async function sendMessage(
  http: HttpService,
  message: string,
  to: string,
): Promise<void> {
  try {
    const connection = http
      .post(
        process.env.SERVICE_KONEKWA_ENDPOINT,
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
    logger.log('Pesan berhasil dikirim ke provider');
  } catch (error) {
    logger.error(error);
    throw error;
  }
}

export async function sendMessageBulk(
  http: HttpService,
  message: string,
): Promise<void> {
  logger.log('Mengirim pesan : ' + message);
  const receivers = [
    process.env.SERVICE_KONEKWA_NO_MBAK_NISA,
    // process.env.SERVICE_KONEKWA_NO_MAS_DETHO,
  ];
  await Promise.all(receivers.map((receiver) => sendMessage(http, message, receiver)));
}
