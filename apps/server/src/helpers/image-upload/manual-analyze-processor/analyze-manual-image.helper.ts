import { GenerateContentParameters, GoogleGenAI } from '@google/genai';

const jsonSchema = {
  type: 'object',
  properties: {
    app_name: {
      type: 'string',
      description: 'main application visible on the screen',
    },
    window_title: {
      type: 'string',
      description: 'visible window title',
    },
    category: {
      type: 'string',
      description: 'the most relevant category for the activity',
    },
    summary: {
      type: 'string',
      description: 'concise description of the activity in English',
    },
  },
  required: ['app_name', 'window_title', 'category', 'summary'],
};

export async function analyzeManualImage(
  gemini: GoogleGenAI,
  model: string,
  prompt: string,
  base64Data: string,
  mimeType: string,
) {
  const content: GenerateContentParameters['contents'] = [
    {
      role: 'user',
      parts: [
        { text: prompt },
        { inlineData: { mimeType, data: base64Data } },
      ],
    },
  ];

  return gemini.models.generateContent({
    model,
    contents: content,
    config: {
      responseMimeType: 'application/json',
      responseJsonSchema: jsonSchema,
    },
  });
}
