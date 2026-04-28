import { GenerateContentResponse } from '@google/genai';
import sharp from 'sharp';
import { AnalyzerService } from 'src/services/analyzer/services/analyzer.service';

export interface AIResult {
  date: string | null;
  time: string | null;
}

export async function adjustImage(file: Express.Multer.File, os: string) {
  const image = sharp(file.buffer);
  const { width, height } = await image.metadata();

  if (!width || !height) throw new Error('Gagal membaca metadata gambar');

  const cropWidth = Math.max(Math.floor(width * 0.15), 200);
  const cropHeight = Math.max(Math.floor(height * 0.08), 80);

  let extractOptions: sharp.Region;

  if (os.toLowerCase() === 'macos') {
    extractOptions = {
      left: width - cropWidth,
      top: 0,
      width: cropWidth,
      height: cropHeight,
    };
  } else {
    extractOptions = {
      left: width - cropWidth,
      top: height - cropHeight,
      width: cropWidth,
      height: cropHeight,
    };
  }

  return await image
    .extract(extractOptions)
    .resize(1200)
    .greyscale()
    .normalize()
    .threshold(128)
    .toBuffer();
}

export async function extractDateTime(
  image: Buffer<ArrayBufferLike>,
  analyzerService: AnalyzerService,
): Promise<AIResult> {
  const result = (await analyzerService.callAnalyzerProvider({
    provider: 'gemini-ai',
    model: 'gemini-2.5-flash-lite',
    contents: [
      {
        text: `Extract the date and time shown in this taskbar/screenshot image.
Return ONLY a raw JSON object, no markdown, no explanation:
{"date": "YYYY-MM-DD", "time": "HH:mm"}
If date or time not found, use null for that field.`,
      },
      {
        inlineData: {
          mimeType: 'image/png',
          data: image.toString('base64'),
        },
      },
    ],
  })) as GenerateContentResponse;

  try {
    const text = result.text;
    const clean = text.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch {
    return { date: null, time: null };
  }
}
