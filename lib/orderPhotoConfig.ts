const DEFAULT_PRIMARY_BUCKET = 'photo-cakes';
const DEFAULT_FALLBACK_BUCKETS = ['temp-uploads'];

const normalizeBucketList = (): string[] => {
  const envBucket = process.env.NEXT_PUBLIC_ORDER_PHOTO_BUCKET?.trim();
  const baseBuckets = envBucket
    ? [envBucket, ...DEFAULT_FALLBACK_BUCKETS]
    : [DEFAULT_PRIMARY_BUCKET, ...DEFAULT_FALLBACK_BUCKETS];

  return Array.from(
    new Set(
      baseBuckets
        .map(bucket => bucket.trim())
        .filter(bucket => bucket.length > 0)
    )
  );
};

const normalizeFolderPrefix = (): string => {
  const rawFolder = process.env.NEXT_PUBLIC_ORDER_PHOTO_FOLDER;
  const trimmed = rawFolder?.trim();

  if (!trimmed) {
    return 'photo-cakes/';
  }

  const normalized = trimmed.replace(/^\/+/, '').replace(/\/+$/, '');
  return normalized ? `${normalized}/` : '';
};

const sanitizeFileName = (fileName: string): string => {
  return fileName
    .trim()
    .replace(/[^a-zA-Z0-9_.-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    || 'photo-reference';
};

export const ORDER_PHOTO_BUCKETS = normalizeBucketList();
export const PRIMARY_ORDER_PHOTO_BUCKET = ORDER_PHOTO_BUCKETS[0] ?? DEFAULT_PRIMARY_BUCKET;
export const ORDER_PHOTO_FOLDER_PREFIX = normalizeFolderPrefix();

export const buildOrderPhotoPath = (originalFileName: string): string => {
  const sanitizedName = sanitizeFileName(originalFileName);
  const timestamp = Date.now();
  const prefix = ORDER_PHOTO_FOLDER_PREFIX;

  if (!prefix) {
    return `${timestamp}-${sanitizedName}`;
  }

  return `${prefix}${timestamp}-${sanitizedName}`;
};
