import { defineEventHandler, getQuery, sendStream, H3Event } from 'h3';
import { Readable } from 'node:stream';
import { Images } from '../../../models/Images';
import sharp from 'sharp';
import crypto from 'crypto';

// ===== Type Definitions ===== //

interface ImageRecord {
  url: string;
  content: Buffer;
  size: number;
  etag: string;
  updatedAt: Date;
}

// For the caching logic
interface CachedWebPImageInput {
  imageUrl: string;
  now: Date;
}

interface StoreWebPImageInput {
  imageUrl: string;
  webpBuffer: Buffer;
  eTag: string;
  now: Date;
}

// For building the image URL
interface BuildImageUrlInput {
  id: string;
  additionalPath: string;
  size?: number;
}

// ===== Helper Functions ===== //

function buildImageUrl({id, additionalPath, size}: BuildImageUrlInput): string {
  let url = `https://images.evetech.net/types/${id}`;
  if (additionalPath) {
    url += `/${additionalPath}`;
  }
  if (size) {
    url += `?size=${size}`;
  }
  return url;
}

function supportsWebP(event: H3Event): boolean {
  const acceptHeader = event.node.req.headers['accept'] || '';
  return acceptHeader.includes('image/webp');
}

function setCommonHeaders(event: H3Event, contentType: string, eTag: string): void {
  event.node.res.setHeader('Content-Type', contentType);
  event.node.res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year
  event.node.res.setHeader('ETag', eTag);
}

function checkFor304(event: H3Event, eTag: string): boolean {
  const ifNoneMatch = event.node.req.headers['if-none-match'];
  if (ifNoneMatch === eTag) {
    event.node.res.statusCode = 304;
    return true;
  }
  return false;
}

async function fetchImage(imageUrl: string): Promise<Response> {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.statusText}`);
  }
  return response;
}

async function getCachedWebPImage({imageUrl, now}: CachedWebPImageInput): Promise<ImageRecord | null> {
  const cacheDuration = 30 * 24 * 60 * 60 * 1000; // 30 days
  return Images.findOne({
    url: imageUrl,
    updatedAt: { $gte: new Date(now.getTime() - cacheDuration) },
  });
}

async function storeWebPImageInDb({imageUrl, webpBuffer, eTag, now}: StoreWebPImageInput): Promise<void> {
  await Images.findOneAndUpdate(
    { url: imageUrl },
    {
      url: imageUrl,
      content: webpBuffer,
      size: webpBuffer.length,
      etag: eTag,
      updatedAt: now,
    },
    { upsert: true, new: true }
  );
}

async function convertToWebP(imageBuffer: Buffer, size?: number): Promise<Buffer> {
  const image = sharp(imageBuffer);
  if (size) {
    image.resize(size, size);
  }
  return image.toFormat('webp').toBuffer();
}

function generateETag(buffer: Buffer): string {
  return crypto.createHash('md5').update(buffer).digest('hex');
}

// ===== Main Handler ===== //

export default defineEventHandler(async (event: H3Event): Promise<any> => {
  const pathSegments = event.context.params.path;
  const segmentsArray = Array.isArray(pathSegments) ? pathSegments : [pathSegments];
  const id = segmentsArray[0] as string;
  const additionalPath = segmentsArray.slice(1).join('/');
  const query = getQuery(event);

  const size = query.size ? parseInt(query.size as string, 10) : undefined;

  // Build the external image URL
  const imageUrl = buildImageUrl({ id, additionalPath, size });

  // Check for WebP support
  const webpSupported = supportsWebP(event);

  if (webpSupported) {
    const now = new Date();
    const cachedImage = await getCachedWebPImage({ imageUrl, now });

    if (cachedImage) {
      const eTag = cachedImage.etag;
      if (checkFor304(event, eTag)) {
        return null; // Client already has the up-to-date image
      }
      setCommonHeaders(event, 'image/webp', eTag);
      return sendStream(event, Readable.from(cachedImage.content));
    }

    // No cached image or stale: fetch and convert
    const response = await fetchImage(imageUrl);

    // If the content is JSON, return that immediately
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return response.json();
    }

    const arrayBuffer = await response.arrayBuffer();
    const originalBuffer = Buffer.from(arrayBuffer);
    const webpBuffer = await convertToWebP(originalBuffer, size);
    const eTag = generateETag(webpBuffer);

    await storeWebPImageInDb({ imageUrl, webpBuffer, eTag, now });
    if (checkFor304(event, eTag)) {
      return null;
    }

    setCommonHeaders(event, 'image/webp', eTag);
    return sendStream(event, Readable.from(webpBuffer));
  }

  // WebP not supported: just fetch original
  const response = await fetchImage(imageUrl);
  const arrayBuffer = await response.arrayBuffer();
  const originalBuffer = Buffer.from(arrayBuffer);
  const eTag = generateETag(originalBuffer);

  if (checkFor304(event, eTag)) {
    return null;
  }

  const contentType = response.headers.get('content-type') || 'image/jpeg';
  setCommonHeaders(event, contentType, eTag);
  event.node.res.setHeader('Expires', new Date(Date.now() + 31536000000).toUTCString()); // 1 year
  return sendStream(event, Readable.from(originalBuffer));
});
