import { GenerateContentParameters, GoogleGenAI } from '@google/genai';
import { Logger } from '@nestjs/common';
import { NineRouterService } from 'src/services/analyzer/services/nine-router/nine-router.service';

const logger = new Logger('GeminiAnalyzeHelper');

const NINE_ROUTER_MODEL = 'ag/gemini-3.6-flash-low';

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

async function fetchImageAsBase64(imageUrl: string) {
  const response = await fetch(imageUrl);

  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status}`);
  }

  const mimeType = response.headers.get('content-type') || 'image/png';
  const arrayBuffer = await response.arrayBuffer();
  const base64Data = Buffer.from(arrayBuffer).toString('base64');

  return { mimeType, base64Data };
}

export async function analyzeImage(
  gemini: GoogleGenAI,
  model: string,
  prompt: string,
  imageUrl: string,
) {
  const { mimeType, base64Data } = await fetchImageAsBase64(imageUrl);

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

export async function analyzeImageViaGateway(
  nineRouter: NineRouterService,
  gemini: GoogleGenAI,
  model: string,
  prompt: string,
  imageUrl: string,
): Promise<{ text: string }> {
  const { mimeType, base64Data } = await fetchImageAsBase64(imageUrl);

  try {
    const result = await nineRouter.analyzeImage({
      model: NINE_ROUTER_MODEL,
      prompt,
      imageBase64: base64Data,
      mimeType,
      jsonSchema,
    });

    logger.log(`[PROVIDER=9ROUTER] model=${NINE_ROUTER_MODEL} sukses`);

    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.warn(
      `[PROVIDER=9ROUTER] model=${NINE_ROUTER_MODEL} gagal, fallback ke Gemini langsung. Alasan: ${message}`,
    );

    const content: GenerateContentParameters['contents'] = [
      {
        role: 'user',
        parts: [
          { text: prompt },
          { inlineData: { mimeType, data: base64Data } },
        ],
      },
    ];

    const res = await gemini.models.generateContent({
      model,
      contents: content,
      config: {
        responseMimeType: 'application/json',
        responseJsonSchema: jsonSchema,
      },
    });

    logger.log(`[PROVIDER=GEMINI-FALLBACK] model=${model} sukses`);

    return { text: res.text };
  }
}
