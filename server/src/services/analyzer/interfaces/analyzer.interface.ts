import { ZhipuAiRequestBody } from './zhipu-ai.interface';

export enum AnalyzerProvider {
  ZHIPU_AI = 'zhipu-ai',
}

export type AnalyzerBody = ZhipuAiProvider | GeminiAiProvider;

export interface ZhipuAiProvider extends ZhipuAiRequestBody {
  provider: 'zhipu-ai';
}

export interface GeminiAiProvider {
  provider: 'gemini-ai';
  test:"Tst aja"
}
