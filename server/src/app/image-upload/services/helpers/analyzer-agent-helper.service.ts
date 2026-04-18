import { Injectable } from '@nestjs/common';
import { AnalyzerBody } from 'src/services/analyzer/interfaces/analyzer.interface';
import {
  UserMessages,
  ZhipuModel,
} from 'src/services/analyzer/interfaces/zhipu-ai.interface';
import { AnalyzerService } from 'src/services/analyzer/services/analyzer.service';
import { BuildPromptHelperService } from './build-prompt-helper.service';

@Injectable()
export class AnalyzerAgentHelperService {
  constructor(
    private readonly analyzer: AnalyzerService,
    private readonly promptBuilder: BuildPromptHelperService,
  ) {}

  private isJsonResponse(response: string) {
    try {
      JSON.parse(response);
      return true;
    } catch {
      return false;
    }
  }

  //   ZHIPUAI
  private async zhipuProvider(imageDataUrl: string, userId: string) {
    const prompt = await this.promptBuilder.buildPrompt(userId);
    const messages: UserMessages[] = [
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: {
              url: imageDataUrl,
            },
          },
          {
            type: 'text',
            text: prompt,
          },
        ],
      },
    ];

    const response = await this.analyzer.callAnalyzerProvider({
      provider: 'zhipu-ai',
      model: ZhipuModel.GLM_4_6V,
      user_messages: messages,
      response_format: {
        type: 'json_object',
      },
    });

    const message = response.choices[0].message.content;

    return {
      data: this.isJsonResponse(message) ? JSON.parse(message) : {},
    };
  }

  async analyzerAgentMapper(
    provider: AnalyzerBody['provider'],
    imageDataUrl: string,
    userId: string,
  ) {
    switch (provider) {
      case 'zhipu-ai':
        return await this.zhipuProvider(imageDataUrl, userId);
      default:
        throw new Error('Provider wajib diisi');
    }
  }
}
