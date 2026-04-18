import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import {
  BodyMessages,
  ZhipuAiRequestBody,
  ZhipuAiResponse,
  ZhipuModel,
} from '../../interfaces/zhipu-ai.interface';

@Injectable()
export class ZhipuAiService {
  private readonly endpoint: string =
    'https://open.bigmodel.cn/api/coding/paas/v4/chat/completions';
  private readonly apiKey: string = `Bearer ${process.env.Z_AI_API_KEY}`;

  constructor(private readonly httpService: HttpService) {}

  async callZApi(body: ZhipuAiRequestBody) {
    const { model, temperature, response_format, max_token } = body;
    const messages = this.buildMessage(body);

    const observable = this.httpService.post(
      this.endpoint,
      {
        model,
        messages,
        temperature,
        response_format,
        max_token,
      },
      {
        headers: {
          Authorization: this.apiKey,
        },
      },
    );

    try {
      const { data } = await firstValueFrom(observable);

      return data as ZhipuAiResponse;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  private buildMessage(body: ZhipuAiRequestBody): BodyMessages {
    const { user_messages, system_messages } = body;

    const messages: BodyMessages = [];

    if (system_messages) {
      messages.push(system_messages);
    }

    messages.push(...user_messages);

    return messages;
  }
}
