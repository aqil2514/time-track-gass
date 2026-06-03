import {
  GenerateContentParameters,
  GenerateContentResponse,
  ServiceTier,
} from '@google/genai';
import { Injectable } from '@nestjs/common';
import {
  AnalyzerResponse,
  CostDetail,
  TokenUsage,
} from 'src/services/analyzer/interfaces/analyzer.interface';
import { AnalyzerService } from 'src/services/analyzer/services/analyzer.service';
import { isJsonResponse } from 'src/utils/is-json-response';

@Injectable()
export class GeminiAnalyzeMapper {
  private readonly jsonSchema = {
    type: 'object',
    properties: {
      app_name: {
        type: 'string',
        description: 'main application visible on the screen',
      },
      window_title: {
        type: 'string',
        description: 'visible window title',
      },
      category: {
        type: 'string',
        description: 'the most relevant category for the activity',
      },
      summary: {
        type: 'string',
        description: 'concise description of the activity in English',
      },
    },
    required: ['app_name', 'window_title', 'category', 'summary'],
  };
  constructor(private readonly analyzer: AnalyzerService) {}

  private calculateCost(geminiResponse: GenerateContentResponse): CostDetail {
    const usage = geminiResponse.usageMetadata;
    if (!usage) {
      return {
        total: 0,
        currency: 'USD',
        rate_per_unit: { prompt: 0, completion: 0 },
        calculated_at: new Date(),
      };
    }

    const PROMPT_RATE_PER_1M = 0.1;
    const COMPLETION_RATE_PER_1M = 0.4;

    const promptCost =
      (usage.promptTokenCount / 1_000_000) * PROMPT_RATE_PER_1M;
    const completionCost =
      (usage.candidatesTokenCount / 1_000_000) * COMPLETION_RATE_PER_1M;

    const totalUsd = promptCost + completionCost;

    return {
      total: totalUsd,
      currency: 'USD',
      rate_per_unit: {
        prompt: PROMPT_RATE_PER_1M,
        completion: COMPLETION_RATE_PER_1M,
      },
      calculated_at: new Date(),
    };
  }

  private mapGeminiToUniversalResponse(
    geminiResponse: GenerateContentResponse,
  ): AnalyzerResponse {
    const tokenUsage: TokenUsage = {
      prompt_tokens: geminiResponse.usageMetadata.promptTokenCount,
      completion_tokens: geminiResponse.usageMetadata.candidatesTokenCount,
      total_tokens: geminiResponse.usageMetadata.totalTokenCount,
    };

    const cost = this.calculateCost(geminiResponse);
    const data = isJsonResponse ? JSON.parse(geminiResponse.text) : {};
    return {
      data: isJsonResponse ? JSON.parse(geminiResponse.text) : {},
      cost,
      token: tokenUsage,
    };
  }

  async geminiProvider(imageDataUrl: string, prompt: string) {
    const base64Data = imageDataUrl.split(',')[1];
    const mimeType = imageDataUrl.split(',')[0].split(':')[1].split(';')[0];

    const contents: GenerateContentParameters['contents'] = [
      {
        role: 'user',
        parts: [
          {
            text: prompt,
          },
          {
            inlineData: {
              mimeType,
              data: base64Data,
            },
          },
        ],
      },
    ];
    try {
      const response = (await this.analyzer.callAnalyzerProvider({
        provider: 'gemini-ai',
        model: 'gemini-2.5-flash-lite',
        contents,
        config: {
          serviceTier: ServiceTier.FLEX,
          responseMimeType: 'application/json',
          responseJsonSchema: this.jsonSchema,
        },
      })) as GenerateContentResponse;

      return this.mapGeminiToUniversalResponse(response);
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}
