import { Injectable } from '@nestjs/common';
import { AnalyzerBody } from 'src/services/analyzer/interfaces/analyzer.interface';
import {
  UserMessages,
  ZhipuAiResponseUsage,
  ZhipuModel,
} from 'src/services/analyzer/interfaces/zhipu-ai.interface';
import { AnalyzerService } from 'src/services/analyzer/services/analyzer.service';
import { BuildPromptHelperService } from './build-prompt-helper.service';
import { ZhipuAnalyzeMapper } from '../ai-mapper/zhipu-analyze.mapper';
import { GeminiAnalyzeMapper } from '../ai-mapper/gemini-analyze.mapper';

@Injectable()
export class AnalyzerAgentHelperService {
  constructor(
    private readonly promptBuilder: BuildPromptHelperService,
    private readonly zhipuMapper: ZhipuAnalyzeMapper,
    private readonly geminiMapper: GeminiAnalyzeMapper,
  ) {}

  async analyzerAgentMapper(
    provider: AnalyzerBody['provider'],
    imageDataUrl: string,
    userId: string,
  ) {
    const prompt = await this.promptBuilder.buildPrompt(userId);
    switch (provider) {
      case 'zhipu-ai':
        return await this.zhipuMapper.zhipuProvider(imageDataUrl, prompt);
      case 'gemini-ai':
        return this.geminiMapper.geminiProvider(imageDataUrl, prompt);
      default:
        throw new Error('Provider wajib diisi');
    }
  }
}
