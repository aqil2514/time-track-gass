import { GenerateContentParameters } from '@google/genai';

export type AnalyzerBody = GeminiAiProvider;

export interface GeminiAiProvider extends GenerateContentParameters {
  provider: 'gemini-ai';
}

// UNIVERSAL RESPONSE
export interface TokenUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  details?: Record<string, unknown>;
}

export interface CostDetail {
  total: number;
  currency: string;
  rate_per_unit: {
    prompt: number;
    completion: number;
  };
  calculated_at: Date;
}

export interface AnalyzerResponse<T = unknown> {
  data: T;
  token: TokenUsage;
  cost: CostDetail;
}
