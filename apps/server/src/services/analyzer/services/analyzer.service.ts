import { Inject, Injectable } from '@nestjs/common';
import { AnalyzerBody } from '../interfaces/analyzer.interface';
import { GoogleGenAI } from '@google/genai';

@Injectable()
export class AnalyzerService {
  constructor(
    @Inject('GEMINI_AI')
    private readonly geminiAI: GoogleGenAI,
  ) {}
  callAnalyzerProvider(body: AnalyzerBody) {
    const { provider } = body;
    switch (provider) {
      case 'gemini-ai':
        return this.geminiAI.models.generateContent(body);

      default:
        throw new Error('Provider tidak valid');
    }
  }
}
