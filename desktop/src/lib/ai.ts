// desktop/src/lib/ai.ts
import { logger } from './logger';

export interface AnalysisResult {
    app_name: string;
    window_title: string;
    category: string;
    summary: string;
}

const BASE_URL = "https://open.bigmodel.cn/api/paas/v4"; // Standard GLM V4 endpoint
const PRIMARY_MODEL = "glm-4v"; // Or glm-4v-flash if available/cheaper. Config used glm-4.6v
const FALLBACK_MODEL = "glm-4v-flash";

export async function analyzeScreenshot(base64Image: string, apiKey: string): Promise<AnalysisResult> {
    try {
        return await callModel(base64Image, apiKey, PRIMARY_MODEL);
    } catch (e) {
        logger.warn(`Primary model ${PRIMARY_MODEL} failed, trying fallback ${FALLBACK_MODEL}`, e);
        return await callModel(base64Image, apiKey, FALLBACK_MODEL);
    }
}

async function callModel(base64Image: string, apiKey: string, model: string): Promise<AnalysisResult> {
    const prompt = `Extract activity context from this screenshot.

**Capture visible information:**
1. App/Tool: What application is active?
2. Visible paths/URLs: File paths, URLs, terminal directories
3. Specific content: Error messages, code being edited, article titles, queries
4. Action: editing, reading, running, debugging, querying, etc.

**Category** (pick one):
- coding: Writing/editing code files
- debugging: Analyzing errors, logs, stack traces
- research: Reading docs, StackOverflow, articles
- database: SQL queries, DB tools
- devops: Docker, CI/CD, deployment, monitoring
- review: Code/PR review
- meeting: Video calls
- communication: Chat apps, email
- design: Design tools
- planning: Task management, notes
- other: None of the above

**Summary format:**
- Include project name ONLY if visible in paths/titles
- Focus on WHAT is being done specifically
- Examples:
  - "Editing retry_queue.go error handling logic"
  - "Reading PostgreSQL INTERVAL documentation"
  - "Running go build with compilation errors"

JSON output (no markdown):
{"app_name": "...", "window_title": "...", "category": "...", "summary": "..."}`;

    // Ensure data URI format
    const imageUrl = base64Image.startsWith('data:')
        ? base64Image
        : `data:image/png;base64,${base64Image}`; // Assume PNG if raw, or check format

    const body = {
        model: model,
        messages: [
            {
                role: "user",
                content: [
                    { type: "image_url", image_url: { url: imageUrl } },
                    { type: "text", text: prompt }
                ]
            }
        ]
    };

    const response = await fetch(`${BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`AI API failed (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    if (!data.choices?.[0]?.message?.content) {
        throw new Error('Invalid AI response format');
    }

    const content = data.choices[0].message.content;

    // Parse JSON
    try {
        // Strip code blocks if present
        const jsonStr = content.replace(/```json\n?|\n?```/g, '').trim();
        return JSON.parse(jsonStr) as AnalysisResult;
    } catch (e) {
        logger.warn("Failed to parse AI JSON response, using raw content", content);
        // Fallback
        return {
            app_name: "Unknown",
            window_title: "Unknown",
            category: "other",
            summary: content.slice(0, 200) // Truncate
        };
    }
}
