import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import {
  NineRouterChatCompletionResponse,
  NineRouterVisionRequest,
} from '../../interfaces/nine-router.interface';

@Injectable()
export class NineRouterService {
  private readonly logger = new Logger(NineRouterService.name);
  private readonly endpoint =
    'https://9router.gass.web.id/v1/chat/completions';

  constructor(private readonly httpService: HttpService) {}

  async analyzeImage(
    request: NineRouterVisionRequest,
  ): Promise<{ text: string }> {
    const { model, prompt, imageBase64, mimeType, jsonSchema } = request;

    const observable = this.httpService.post<NineRouterChatCompletionResponse>(
      this.endpoint,
      {
        model,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: { url: `data:${mimeType};base64,${imageBase64}` },
              },
            ],
          },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: { name: 'response', schema: jsonSchema },
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.NINEROUTER_API_KEY}`,
        },
        timeout: 30000,
      },
    );

    const { data } = await firstValueFrom(observable);
    const text = data.choices?.[0]?.message?.content;

    if (!text) {
      throw new Error('9Router response tidak mengandung konten');
    }

    return { text };
  }
}
