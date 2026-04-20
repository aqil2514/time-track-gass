import { Inject, Injectable } from '@nestjs/common';
import { ZhipuAiService } from './zhipu-ai/zhipu-ai.service';
import {
  AnalyzerBody,
  AnalyzerProvider,
} from '../interfaces/analyzer.interface';
import { GoogleGenAI } from '@google/genai';

@Injectable()
export class AnalyzerService {
  constructor(
    private readonly zhipuAi: ZhipuAiService,

    @Inject('GEMINI_AI')
    private readonly geminiAI: GoogleGenAI,
  ) {}
  callAnalyzerProvider(body: AnalyzerBody) {
    const { provider } = body;
    switch (provider) {
      case 'zhipu-ai':
        return this.zhipuAi.callZApi(body);

      case 'gemini-ai':
        return this.geminiAI.models.generateContent(body);

      default:
        throw new Error('Provider tidak valid');
    }
  }
}
