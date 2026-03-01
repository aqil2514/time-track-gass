export interface ZImageAnalyzeData {
  app_name: string;
  category: string;
  summary: string;
  window_title: string;
}

export interface ZImageAnalyzeReturn {
  message: string;
  aiText: string;
  aiReasoning: string;
  data: ZImageAnalyzeData;
}
