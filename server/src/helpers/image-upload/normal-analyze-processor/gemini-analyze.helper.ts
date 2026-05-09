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

export async function analyzeImage(
  gemini: GoogleGenAI,
  model: string,
  prompt: string,
  imageUrl: string,
) {
  const response = await fetch(imageUrl);

  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status}`);
  }

  const mimeType = response.headers.get('content-type') || 'image/png';
  const arrayBuffer = await response.arrayBuffer();
  const base64Data = Buffer.from(arrayBuffer).toString('base64');

  const content: GenerateContentParameters['contents'] = [
    {
      role: 'user',
      parts: [
        {
          text: prompt,
        },
        {
          inlineData: {
            mimeType,
            data: base64Data,
          },
        },
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
