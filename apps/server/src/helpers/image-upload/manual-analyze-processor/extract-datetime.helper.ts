import { GoogleGenAI } from '@google/genai';
import { fromZonedTime } from 'date-fns-tz';
import { Logger } from '@nestjs/common';
import { TIMEZONE } from 'src/constants/timezone';

const logger = new Logger('extractDateTimeFromImage');

export interface ExtractDateTimeResult {
  date: Date;
  source: 'gemini' | 'filename';
}

export async function extractDateTimeFromImage(
  gemini: GoogleGenAI,
  model: string,
  base64Data: string,
  mimeType: string,
  originalFilename?: string,
): Promise<ExtractDateTimeResult | null> {
  const fromGemini = await tryGemini(gemini, model, base64Data, mimeType);
  if (fromGemini) {
    logger.log(`[gemini] datetime extracted: ${fromGemini.toISOString()}`);
    return { date: fromGemini, source: 'gemini' };
  }
  logger.warn(`[gemini] gagal extract datetime, fallback ke filename: "${originalFilename}"`);

  if (originalFilename) {
    const fromFilename = tryParseFilename(originalFilename);
    if (fromFilename) {
      logger.log(`[filename] datetime extracted: ${fromFilename.toISOString()} dari "${originalFilename}"`);
      return { date: fromFilename, source: 'filename' };
    }
    logger.warn(`[filename] gagal parse datetime dari filename: "${originalFilename}"`);
  }

  return null;
}

async function tryGemini(
  gemini: GoogleGenAI,
  model: string,
  base64Data: string,
  mimeType: string,
): Promise<Date | null> {
  try {
    const res = await gemini.models.generateContent({
      model,
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `Extract the current system date and time from the taskbar or system clock visible in this screenshot.
Do NOT use dates or times shown in the page content, data tables, or documents.
Return ONLY a raw JSON object, no markdown, no explanation:
{"date": "YYYY-MM-DD", "time": "HH:mm"}
If the system clock is not visible, use null for both fields.`,
            },
            { inlineData: { mimeType, data: base64Data } },
          ],
        },
      ],
    });

    const clean = res.text.replace(/```json|```/g, '').trim();
    logger.debug(`[gemini] raw response: ${clean}`);

    let parsed: any;
    try {
      parsed = JSON.parse(clean);
    } catch (parseErr) {
      logger.warn(`[gemini] gagal parse JSON: ${parseErr instanceof Error ? parseErr.message : parseErr} | raw="${clean}"`);
      return null;
    }

    if (!parsed.date || !parsed.time) {
      logger.warn(`[gemini] date/time null di response: date=${parsed.date} time=${parsed.time}`);
      return null;
    }

    const combined = fromZonedTime(`${parsed.date}T${parsed.time}:00`, TIMEZONE);
    if (isNaN(combined.getTime())) {
      logger.warn(`[gemini] datetime tidak valid: "${parsed.date}T${parsed.time}:00"`);
      return null;
    }

    return combined;
  } catch (err) {
    logger.warn(`[gemini] exception saat generate content: ${err instanceof Error ? err.message : err}`);
    return null;
  }
}

function tryParseFilename(filename: string): Date | null {
  const match = filename.match(/(\d{4}-\d{2}-\d{2})[_ ](\d{2}-\d{2}-\d{2})/);
  if (!match) return null;

  const [, datePart, timePart] = match;
  const timeFormatted = timePart.replace(/-/g, ':');

  // Treat datetime in filename as WIB (Asia/Jakarta), convert to UTC
  const utcDate = fromZonedTime(`${datePart}T${timeFormatted}`, TIMEZONE);
  logger.debug(`[filename] raw="${datePart}T${timeFormatted}" WIB -> UTC="${utcDate.toISOString()}"`);
  return isNaN(utcDate.getTime()) ? null : utcDate;
}
