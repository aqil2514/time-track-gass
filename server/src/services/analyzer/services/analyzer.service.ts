import { Injectable } from '@nestjs/common';
import { ZhipuAiService } from './zhipu-ai/zhipu-ai.service';
import {
  AnalyzerBody,
  AnalyzerProvider,
} from '../interfaces/analyzer.interface';

@Injectable()
export class AnalyzerService {
  constructor(private readonly zhipuAi: ZhipuAiService) {}
  callAnalyzerProvider(body: AnalyzerBody) {
    const { provider } = body;
    switch (provider) {
      case 'zhipu-ai':
        return this.zhipuAi.callZApi(body);

      default:
        throw new Error('Provider tidak valid');
    }
  }
}
