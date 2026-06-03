import { Inject, Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js/dist/index.cjs';
import { DivisionsDb } from 'src/app/supervisor/interfaces/divisions.interface';
import { TableName } from 'src/services/supabase/supabase.interface';

@Injectable()
export class BuildPromptHelperService {
  private FALLBACK_PROMPT = `
    Analyze this image and extract the relevant information.
    
    Return ONLY valid JSON in the following format:
    
    {
      "app_name": "main application visible on the screen",
      "window_title": "visible window title",
      "category": "choose one of the following: active_support, client_farming, technical_escalation, admin_reporting, coding, debugging, research, database, devops, review, meeting, communication, design, planning",
      "summary": "concise description of the activity"
    }
    
    Category Definitions:
    - active_support: Focus on responding to client chats/tickets or providing quick solutions in CRM.
    - client_farming: Proactive activity of contacting old clients to maintain relationships (weekly follow-up).
    - technical_escalation: Process of creating tickets in "Task Gass" for technical issues to be handled by the dev team.
    - admin_reporting: Filling out reports in Google Sheets, attendance forms, or internal database updates.
    
    Rules:
    - Respond with JSON only.
    - Do NOT wrap the response in markdown.
    - Do NOT include explanations.
    - All values must be written in English.
    `;
  private readonly ALL_DIVISIONS_ID = 8;

  constructor(
    @Inject('SUPABASE_CLIENT')
    private readonly supabase: SupabaseClient,
  ) {}

  private async getUserDivisionByUserId(
    userId: string,
  ): Promise<DivisionsDb | null> {
    const { data, error } = await this.supabase
      .from(TableName.Profiles)
      .select('division:division_id(*)')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error(error);
      return null;
    }

    if (!data) return null;

    return data.division as unknown as DivisionsDb;
  }

  private async getGeneralDivisionConfig(): Promise<DivisionsDb> {
    const { data, error } = await this.supabase
      .from(TableName.Divisions)
      .select('*')
      .eq('id', this.ALL_DIVISIONS_ID)
      .maybeSingle();

    if (error) {
      console.error(error);
      return null;
    }

    return data;
  }

  async buildPrompt(userId: string): Promise<string> {
    const [divisionConfig, generalConfig] = await Promise.all([
      this.getUserDivisionByUserId(userId),
      this.getGeneralDivisionConfig(),
    ]);

    if (
      !divisionConfig ||
      divisionConfig.vision_config.allowed_categories.length === 0
    ) {
      return this.FALLBACK_PROMPT;
    }

    const { allowed_categories: divCat, category_definitions: divDef } =
      divisionConfig.vision_config;
    const { allowed_categories: genCat, category_definitions: genDef } =
      generalConfig.vision_config;

    const allCategories = [...new Set([...genCat, ...divCat, 'unclassified'])];
    const categoriesString = allCategories.join(', ');

    const allDefinitions = { ...genDef, ...divDef };
    const definitionsString =
      Object.entries(allDefinitions)
        .map(([key, value]) => `- ${key}: ${value}`)
        .join('\n    ') +
      '\n    - unclassified: Use this if the activity does not match any of the categories above or if the screen is showing non-work related content.';

    return `
    Analyze this image and extract the relevant information for the ${divisionConfig.name} division.
    Division Context: ${divisionConfig.description}
    
    Return ONLY valid JSON in the following format:
    
    {
      "app_name": "main application visible on the screen",
      "window_title": "visible window title",
      "category": "choose one of the following: ${categoriesString}",
      "summary": "concise description of the activity"
    }
    
    Category Definitions:
    ${definitionsString}
    
    Rules:
    - Respond with JSON only.
    - Do NOT wrap the response in markdown.
    - Do NOT include explanations.
    - All values must be written in English.
    - If the activity does not strictly match any category, use the one that is most relevant, or return "unclassified" if provided.
    - If the image is blurry or the activity is unclear, set the category to "unclassified"
    `.trim();
  }
}
