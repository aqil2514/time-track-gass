import { GoogleGenAI, ServiceTier } from '@google/genai';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class GeminiAIService {
  constructor(
    @Inject('GEMINI_AI')
    private readonly geminiService: GoogleGenAI,
  ) {}

  async callGeminiApi() {
    try {
      const response = await this.geminiService.models.generateContent({
        contents: 'Halo',
        model: 'gemini-2.5-flash-lite',
        config: {
          serviceTier: ServiceTier.FLEX,
        },
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}
