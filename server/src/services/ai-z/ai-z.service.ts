import { Injectable } from '@nestjs/common';
import axios from 'axios';
import {
  AiDailySummaryResult,
  AiSessionSummaryResult,
  ZImageAnalyzeReturn,
} from './interface/ai-z.interface';
import { ActivityData } from 'src/app/activities/interface/activities_data.interface';

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

      const parsed: AiSessionSummaryResult = JSON.parse(aiText);

      return parsed;
    } catch (error) {
      console.error('AI Session Summary Title Error:', error);
      throw error;
    }
  }

  async getAiDailySummary(
    sessionActivities: ActivityData[],
  ): Promise<AiDailySummaryResult> {
    // 🔹 Gabungkan semua session titles/summaries
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
      let aiText = message.content.trim();

      aiText = aiText.replace(/^```(json)?\s*/, '').replace(/```$/, '');

      const parsed: AiDailySummaryResult = JSON.parse(aiText);

      // pastikan highlights muncul di summary
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
