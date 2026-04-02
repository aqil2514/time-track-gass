export interface VisionConfig {
    allowed_categories: string[]
    category_definitions: Record<string, string>
}

export interface DivisionsDb {
  id: number;
  created_at: string;
  name: string;
  description: string;
  vision_config: VisionConfig;
}

export interface DivisionsDbInsert extends Omit<DivisionsDb, "id" | "created_at">{}