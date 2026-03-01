import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { ZImageAnalyzeReturn } from './interface/ai-z.interface';

@Injectable()
export class ZAIService {
  private readonly endpoint: string =
    'https://api.z.ai/api/coding/paas/v4/chat/completions';
  private readonly apiKey: string = `Bearer ${process.env.Z_AI_API_KEY}`;
  private readonly model: string = 'glm-4.6v';

  async getAiImageAnalyze(image_url: string):Promise<ZImageAnalyzeReturn> {
    const content = [
      {
        type: 'image_url',
        image_url: { url: image_url },
      },
      {
        type: 'text',
        text: `
        Tolong analisis gambar ini dan extract informasi.  
Balas **hanya JSON** dengan format ini:

{
  "app_name": "nama aplikasi utama di layar",
  "window_title": "judul window yang terlihat",
  "category": "pilih salah satu dari 10 kategori: coding, debugging, research, database, devops, review, meeting, communication, design, planning",
  "summary": "deskripsi ringkas aktivitas"
}

Jangan tulis teks lain selain JSON.`,
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

      return { message, aiText, aiReasoning, data:JSON.parse(aiText) };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}
