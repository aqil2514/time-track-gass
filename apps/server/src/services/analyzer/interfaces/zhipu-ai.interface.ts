// REQUEST TEXT BODY
export interface ZhipuAiRequestBody {
  model: ZhipuModel;
  user_messages: UserMessages[];
  system_messages?: SystemMessages;
  temperature?: number;
  max_token?: number;
  response_format?: ResponseFormat;
}

export interface UserMessages {
  role: 'user';
  content: (ContentText | ContentImageUrl)[];
}

export interface ContentText {
  type: 'text';
  text: string;
}

export interface ContentImageUrl {
  type: 'image_url';
  image_url: {
    url: string;
  };
}

export interface SystemMessages {
  role: 'system';
  content: string;
}

export type BodyMessages = (UserMessages | SystemMessages)[];

export interface ResponseFormat {
  type: 'text' | 'json_object';
}

// RESPONSE
export interface ZhipuAiResponse {
  id: string;
  request_id: string;
  created: number;
  model: string;
  choices: ZhipuAiChoices[];
  object: string;
  usage: ZhipuAiResponseUsage;
}

export interface ZhipuAiResponseUsage {
  completion_tokens: number;
  completion_tokens_details: { reasoning_tokens: number };
  prompt_tokens: number;
  prompt_tokens_details: { cached_tokens: number };
  total_tokens: number;
}

// CHOICES RESPONSE
export interface ZhipuAiChoices {
  finish_reason: string;
  index: number;
  message: ChoicesMessage;
}

export interface ChoicesMessage {
  role: string;
  content: string;
  reasoning_content: string;
}

// MODEL
export enum ZhipuModel {
  // Model Teks (GLM-5 & 4.7)
  GLM_5_1 = 'glm-5.1',
  GLM_5_TURBO = 'glm-5-turbo',
  GLM_5 = 'glm-5',
  GLM_4_7 = 'glm-4.7',
  GLM_4_7_FLASH = 'glm-4.7-flash',
  GLM_4_7_FLASHX = 'glm-4.7-flashx',
  GLM_4_6 = 'glm-4.6',
  GLM_4_5_AIR = 'glm-4.5-air',
  GLM_4_5_AIRX = 'glm-4.5-airx',
  GLM_4_5_FLASH = 'glm-4.5-flash',
  GLM_4_FLASH_250414 = 'glm-4-flash-250414',
  GLM_4_FLASHX_250414 = 'glm-4-flashx-250414',

  // Model Vision (Multimodal)
  GLM_5V_TURBO = 'glm-5v-turbo',
  GLM_4_6V = 'glm-4.6v',
  GLM_4_6V_FLASH = 'glm-4.6v-flash',
  GLM_4_6V_FLASHX = 'glm-4.6v-flashx',
  GLM_4V_FLASH = 'glm-4v-flash',

  // Model Thinking/Reasoning Vision
  GLM_4_1V_THINKING_FLASH = 'glm-4.1v-thinking-flash',
  GLM_4_1V_THINKING_FLASHX = 'glm-4.1v-thinking-flashx',

  // Model Agent/Mobile
  AUTOGLM_PHONE = 'autoglm-phone',
}