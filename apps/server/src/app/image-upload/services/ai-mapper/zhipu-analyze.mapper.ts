import { Injectable } from '@nestjs/common';
import {
  AnalyzerResponse,
  CostDetail,
  TokenUsage,
} from 'src/services/analyzer/interfaces/analyzer.interface';
import {
  UserMessages,
  ZhipuAiResponse,
  ZhipuAiResponseUsage,
  ZhipuModel,
} from 'src/services/analyzer/interfaces/zhipu-ai.interface';
import { AnalyzerService } from 'src/services/analyzer/services/analyzer.service';
import { isJsonResponse } from 'src/utils/is-json-response';

@Injectable()
export class ZhipuAnalyzeMapper {
  constructor(private readonly analyzer: AnalyzerService) {}

  private zhipuCalculateCost(
    usage: ZhipuAiResponseUsage,
    model: string = 'glm-4.6v',
  ): CostDetail {
    const pricing = {
      'glm-4.6v': { prompt: 0.3, completion: 0.9, cached: 0.05 },
      'glm-5.1': { prompt: 0.1, completion: 0.1, cached: 0.05 },
    };

    const modelPrice = pricing[model] || {
      prompt: 0,
      completion: 0,
      cached: 0,
    };

    const cachedTokens = usage.prompt_tokens_details?.cached_tokens || 0;
    const purePromptTokens = usage.prompt_tokens - cachedTokens;

    const promptCostUsd = (purePromptTokens * modelPrice.prompt) / 1_000_000;
    const cachedCostUsd = (cachedTokens * modelPrice.cached) / 1_000_000;
    const completionCostUsd =
      (usage.completion_tokens * modelPrice.completion) / 1_000_000;

    const totalCostUsd = promptCostUsd + cachedCostUsd + completionCostUsd;

    return {
      total: totalCostUsd,
      currency: 'USD',
      rate_per_unit: {
        prompt: modelPrice.prompt,
        completion: modelPrice.completion,
      },
      calculated_at: new Date(),
    };
  }

  private mapZhipuToUniversalResponse(
    response: ZhipuAiResponse,
  ): AnalyzerResponse {
    const message = response.choices[0].message.content;

    const token: TokenUsage = {
      completion_tokens: response.usage.completion_tokens,
      prompt_tokens: response.usage.prompt_tokens,
      total_tokens: response.usage.total_tokens,
    };

    return {
      token,
      data: isJsonResponse(message) ? JSON.parse(message) : {},
      cost: this.zhipuCalculateCost(response.usage),
    };
  }

  async zhipuProvider(imageDataUrl: string, prompt: string) {
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

    const response = (await this.analyzer.callAnalyzerProvider({
      provider: 'zhipu-ai',
      model: ZhipuModel.GLM_4_6V,
      user_messages: messages,
      response_format: {
        type: 'json_object',
      },
    })) as ZhipuAiResponse;

    return this.mapZhipuToUniversalResponse(response);
  }
}
