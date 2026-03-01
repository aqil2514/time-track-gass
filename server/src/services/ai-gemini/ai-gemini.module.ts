import { Global, Module } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';

@Global()
@Module({
  providers: [
    {
      provide: 'GEMINI_AI',
      useFactory: () =>
        new GoogleGenAI({
          apiKey: process.env.GEMINI_API_KEY,
        }),
    },
  ],
  exports:['GEMINI_AI']
})
export class AIGeminiModule {}
