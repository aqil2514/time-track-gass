import { GoogleGenAI, ServiceTier } from '@google/genai';
import { Inject, Injectable } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'node:fs';

@Injectable()
export class TestGeminiService {
  constructor(
    @Inject('GEMINI_AI')
    private readonly gemini: GoogleGenAI,
  ) {}

  async testGeminiVideo() {
    const filePath = path.join(process.cwd(), 'file-test', 'hasil_rekaman.mp4');
    const base64VideoFile = await fs.readFileSync(filePath, {
      encoding: 'base64',
    });
    const contents = [
      {
        inlineData: {
          mimeType: 'video/mp4',
          data: base64VideoFile,
        },
      },
      { text: 'Please summarize the video in 3 sentences.' },
    ];

    const response = await this.gemini.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: contents,
    //   config: {
    //     serviceTier: ServiceTier.FLEX,
    //   },
    });

    return response;
  }
}
