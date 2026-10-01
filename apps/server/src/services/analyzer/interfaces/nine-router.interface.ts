export interface NineRouterVisionRequest {
  model: string;
  prompt: string;
  imageBase64: string;
  mimeType: string;
  jsonSchema: Record<string, unknown>;
}

export interface NineRouterChatCompletionResponse {
  id: string;
  model: string;
  choices: {
    index: number;
    finish_reason: string;
    message: {
      role: string;
      content: string;
    };
  }[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}
