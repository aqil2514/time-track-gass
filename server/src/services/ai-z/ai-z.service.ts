import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { ZImageAnalyzeReturn } from './interface/ai-z.interface';

@Injectable()
export class ZAIService {
  private readonly endpoint: string =
    'https://api.z.ai/api/coding/paas/v4/chat/completions';
  private readonly apiKey: string = `Bearer ${process.env.Z_AI_API_KEY}`;
  private readonly model: string = 'glm-4.6v';

  async getAiImageAnalyze(image_url: string): Promise<ZImageAnalyzeReturn> {
    const content = [
      {
        type: 'image_url',
        image_url: { url: image_url },
      },
      {
        type: 'text',
        text: `
Analyze this image and extract the relevant information.

Return ONLY valid JSON in the following format:

{
  "app_name": "main application visible on the screen",
  "window_title": "visible window title",
  "category": "choose one of the following: coding, debugging, research, database, devops, review, meeting, communication, design, planning",
  "summary": "concise description of the activity"
}

Rules:
- Respond with JSON only.
- Do NOT wrap the response in markdown.
- Do NOT include explanations.
- All values must be written in English.
`,
      },
    ];

    try {
      const { data } = await axios.post(
        this.endpoint,
        {
          model: this.model,
          messages: [
            {
              role: 'user',
              content,
            },
          ],
          // thinking: { type: 'enabled' },
        },
        {
          headers: {
            Authorization: this.apiKey,
            'Content-Type': 'application/json',
          },
        },
      );

      const message = data.choices[0].message;
      const aiText = message.content;
      const aiReasoning = message.reasoning_content;

      return { message, aiText, aiReasoning, data: JSON.parse(aiText) };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async getAiSessionSummaryTitle(summaries: string[]): Promise<string> {
    const content = [
      {
        type: 'text',
        text: `
You are generating a short session title.

Below are activity summaries from one time session:

${summaries.map((s, i) => `${i + 1}. ${s}`).join('\n')}

Generate ONE concise session title (maximum 8 words).
The title must:
- Be professional
- Be natural
- Be written in English
- Not exceed 8 words

Return ONLY valid JSON.
Do NOT wrap in markdown.
Do NOT add explanation.

Expected format:
{"title":"Your short title here"}
`,
      },
    ];

    try {
      const { data } = await axios.post(
        this.endpoint,
        {
          model: this.model,
          messages: [
            {
              role: 'user',
              content,
            },
          ],
        },
        {
          headers: {
            Authorization: this.apiKey,
            'Content-Type': 'application/json',
          },
        },
      );

      const message = data.choices[0].message;
      const aiText = message.content;

      const parsed = JSON.parse(aiText);

      return parsed.title;
    } catch (error) {
      console.error('AI Session Summary Title Error:', error);
      throw error;
    }
  }
}
