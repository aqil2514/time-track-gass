import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class TestAxiosService {
  private readonly url = process.env.SERVICE_KONEKWA_ENDPOINT;
  constructor(private readonly axios: HttpService) {}

  async sendMessage() {
    const result = await firstValueFrom(this.axios.post(
      this.url,
      {
        session_id: '62811251852',
        to: '628985606632',
        type: 'text',
        body: 'Hello from Konekwa!',
      },
      {
        headers: {
          'X-API-Key': process.env.SERVICE_KONEKWA_API_KEY
        },
      },
    ));

    console.log(result.data);
    return result.data
  }
}
