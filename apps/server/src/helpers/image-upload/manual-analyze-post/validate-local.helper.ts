import { createHash } from 'crypto';

const MINIMUM_IMAGES = 8;

export interface LocalInvalidImage {
  filename: string;
  reason: string;
}

export interface LocalValidationResult {
  validImages: Express.Multer.File[];
  invalidImages: LocalInvalidImage[];
}

export function validateLocalImages(
  images: Express.Multer.File[],
): LocalValidationResult {
  if (images.length < MINIMUM_IMAGES) {
    throw new Error(`Minimal upload ${MINIMUM_IMAGES} gambar per slot`);
  }

  const usedHashes = new Set<string>();
  const validImages: Express.Multer.File[] = [];
  const invalidImages: LocalInvalidImage[] = [];

  for (const image of images) {
    if (isDuplicateImage(usedHashes, image)) {
      invalidImages.push({
        filename: image.originalname,
        reason: 'Gambar ini sudah diunggah (Duplikat)',
      });
      continue;
    }

    if (!isValidSize(image)) {
      invalidImages.push({
        filename: image.originalname,
        reason: 'Ukuran gambar melebihi 5MB',
      });
      continue;
    }

    if (!isValidImageBuffer(image.buffer)) {
      invalidImages.push({
        filename: image.originalname,
        reason: 'Format gambar harus JPEG atau PNG',
      });
      continue;
    }

    validImages.push(image);
  }

  return { validImages, invalidImages };
}

function isDuplicateImage(
  usedHashes: Set<string>,
  image: Express.Multer.File,
): boolean {
  const hash = createHash('md5').update(image.buffer).digest('hex');
  if (usedHashes.has(hash)) return true;
  usedHashes.add(hash);
  return false;
}

function isValidSize(image: Express.Multer.File): boolean {
  return image.size <= 5 * 1024 * 1024;
}

function isValidImageBuffer(buffer: Buffer): boolean {
  const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  const isPng =
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47;
  return isJpeg || isPng;
}
