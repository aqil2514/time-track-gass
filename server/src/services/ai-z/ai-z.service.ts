import { Injectable } from '@nestjs/common';
import axios, { isAxiosError } from 'axios';
import {
  AiDailySummaryResult,
  AiSessionSummaryResult,
  ZImageAnalyzeReturn,
} from './interface/ai-z.interface';
import { ActivityData } from 'src/app/activities/interface/activities_data.interface';
import { AnalyzeImageService } from './helper/analyze-image.service';

@Injectable()
export class ZAIService {
  private readonly endpoint: string =
    'https://open.bigmodel.cn/api/coding/paas/v4/chat/completions';
  private readonly apiKey: string = `Bearer ${process.env.Z_AI_API_KEY}`;
  private readonly model: string = 'glm-4.6v';

  constructor(
    private readonly analyzeImageSerivice: AnalyzeImageService
  ){}

  private cleanAiJson(text: string): string {
    return text
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();
  }

  private async chatCompletion(content: unknown[]): Promise<{
    rawText: string;
    cleanJson: string;
    reasoning?: string;
  }> {
    const { data } = await axios.post(
      this.endpoint,
      {
        model: this.model,
        messages: [{ role: 'user', content }],
      },
      {
        headers: {
          Authorization: this.apiKey,
          'Content-Type': 'application/json',
        },
      },
    );

    const message = data.choices[0].message;
    return {
      rawText: message.content,
      cleanJson: this.cleanAiJson(message.content),
      reasoning: message.reasoning_content,
    };
  }

  async getAiImageAnalyze(imageDataUrl: string, userId:string): Promise<ZImageAnalyzeReturn> {
    return await this.analyzeImageSerivice.getAiImageAnalyze(imageDataUrl, userId)
  }

  async getAiSessionSummaryTitleAndDescription(
    summaries: string[],
  ): Promise<AiSessionSummaryResult> {
    const content = [
      {
        type: 'text',
        text: `
You are generating a short session title and a brief session description.

Below are activity summaries from one time session:

${summaries.map((s, i) => `${i + 1}. ${s}`).join('\n')}

Generate:
1. ONE concise session title (maximum 8 words)
2. A brief professional description summarizing the session (1-2 sentences)

Requirements:
- Both must be professional and natural
- Written in English
- Title max 8 words
- Do NOT include anything else
- Return ONLY valid JSON
- Do NOT wrap in markdown
- Do NOT add explanation

Expected format:
{
  "title": "Your short title here",
  "description": "Brief description summarizing the session"
}
      `,
      },
    ];

    try {
      const { cleanJson } = await this.chatCompletion(content);
      return JSON.parse(cleanJson) as AiSessionSummaryResult;
    } catch (error) {
      console.error('AI Session Summary Error:', error);
      throw error;
    }
  }

  async getAiDailySummary(
    sessionActivities: ActivityData[],
  ): Promise<AiDailySummaryResult> {
    const summaries = sessionActivities.map(
      (s) => s.title || s.description || '',
    );

    const content = [
      {
        type: 'text',
        text: `
You are generating a professional daily summary from multiple activity sessions.

Below are activity summaries for one user today:

${summaries.map((s, i) => `${i + 1}. ${s}`).join('\n')}

Generate the following:
1. A professional daily summary (1-3 sentences) describing the user's activities.
2. An array of highlights (main modules, tasks, or topics) that appear in the summary.
3. A productivity description, e.g., "5.5h coding from 6.5h total", based on the activities.

Requirements:
- Use only English.
- Highlights must appear in the summary.
- Return ONLY valid JSON.
- Do NOT wrap in markdown, backticks, or add extra text.
- Always return at least 1 highlight. If unsure, pick the main topic.

Expected JSON format:
{
  "summary": "Brief professional daily summary...",
  "highlights": ["word1", "word2", "word3"],
  "productivity_description": "5.5h coding from 6.5h total"
}
    `,
      },
    ];

    try {
      const { cleanJson } = await this.chatCompletion(content);
      const parsed: AiDailySummaryResult = JSON.parse(cleanJson);

      parsed.highlights = parsed.highlights.filter((h) =>
        parsed.summary.includes(h),
      );

      return parsed;
    } catch (error) {
      console.error('AI Daily Summary Error:', error);
      throw error;
    }
  }
}
