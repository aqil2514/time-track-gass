import { NineRouterService } from 'src/services/nine-router/nine-router.service';

const NINE_ROUTER_MODEL = 'ag/gemini-3-flash';

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
  nineRouter: NineRouterService,
  prompt: string,
  base64Data: string,
  mimeType: string,
): Promise<{ text: string }> {
  return nineRouter.analyzeImage({
    model: NINE_ROUTER_MODEL,
    prompt,
    imageBase64: base64Data,
    mimeType,
    jsonSchema,
  });
}
