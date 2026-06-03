import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class ZAIHelperService {
  endpoint: string =
    'https://open.bigmodel.cn/api/coding/paas/v4/chat/completions';
  apiKey: string = `Bearer ${process.env.Z_AI_API_KEY}`;
  model: string = 'glm-4.6v';

  private cleanAiJson(text: string): string {
    return text
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();
  }

  async chatCompletion(content: unknown[]): Promise<{
    rawText: string;
    cleanJson: string;
    reasoning?: string;
  }> {
    const { data } = await axios.post(
      this.endpoint,
      {
        model: this.model,
        messages: [{ role: 'user', content }],
      },
      {
        headers: {
          Authorization: this.apiKey,
          'Content-Type': 'application/json',
        },
      },
    );

    const message = data.choices[0].message;
    return {
      rawText: message.content,
      cleanJson: this.cleanAiJson(message.content),
      reasoning: message.reasoning_content,
    };
  }
}
