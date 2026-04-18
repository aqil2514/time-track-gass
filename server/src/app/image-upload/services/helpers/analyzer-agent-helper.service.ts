import { Injectable } from '@nestjs/common';
import { AnalyzerBody } from 'src/services/analyzer/interfaces/analyzer.interface';
import {
  UserMessages,
  ZhipuAiResponseUsage,
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
      token: response.usage,
      data: this.isJsonResponse(message) ? JSON.parse(message) : {},
      cost: this.zhipuCalculateCost(response.usage),
    };
  }

  private zhipuCalculateCost(
    usage: ZhipuAiResponseUsage,
    model: string = 'glm-4.6v',
  ) {
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
      prompt_cost_usd: promptCostUsd,
      cached_cost_usd: cachedCostUsd,
      completion_cost_usd: completionCostUsd,
      total_cost_usd: totalCostUsd,
      formatted: {
        total: `$${totalCostUsd.toFixed(10)}`,
      },
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
