import { supabase } from './supabase';

const STORAGE_BUCKET = 'temp-uploads';
const PHOTO_FOLDER_PREFIX = 'photo-cakes/';
const SIGNED_URL_TTL_SECONDS = 60 * 60; // 1 hour

const isHttpUrl = (value: string) => /^https?:\/\//i.test(value.trim());

const normalizePhotoPath = (rawPath: string) => {
  const trimmed = rawPath.trim().replace(/^\/+/, '');
  if (!trimmed) {
    return null;
  }

  return trimmed.startsWith(PHOTO_FOLDER_PREFIX)
    ? trimmed
    : `${PHOTO_FOLDER_PREFIX}${trimmed}`;
};

const resolveSignedUrl = async (storagePath: string) => {
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS);

  if (error) {
    console.error('Error creating signed URL for order photo:', error);
    return null;
  }

  return data?.signedUrl ?? null;
};

const cloneCustomization = (customization: unknown) =>
  customization && typeof customization === 'object'
    ? { ...(customization as Record<string, unknown>) }
    : undefined;

export const withSignedPhotoUrls = async <T extends Record<string, any>>(items: T[]): Promise<T[]> => {
  return Promise.all(
    items.map(async (item) => {
      const directPhoto = typeof item.photoUrl === 'string' ? item.photoUrl : '';
      const customizationPhoto =
        item.customization && typeof item.customization === 'object'
          ? (item.customization as Record<string, unknown>).photoUrl
          : null;
      const customizationPhotoString = typeof customizationPhoto === 'string' ? customizationPhoto : '';

      const candidatePath =
        !directPhoto || isHttpUrl(directPhoto)
          ? customizationPhotoString
          : directPhoto;

      if (!candidatePath || isHttpUrl(candidatePath)) {
        return item;
      }

      const normalizedPath = normalizePhotoPath(candidatePath);
      if (!normalizedPath) {
        return item;
      }

      const signedUrl = await resolveSignedUrl(normalizedPath);

      const nextItem: Record<string, any> = {
        ...item,
        photoStoragePath: normalizedPath,
        photoUrl: signedUrl ?? null,
      };

      if (item.customization && typeof item.customization === 'object') {
        const nextCustomization = cloneCustomization(item.customization) ?? {};
        if (typeof nextCustomization.photoUrl === 'string' && !isHttpUrl(nextCustomization.photoUrl)) {
          nextCustomization.photoUrl = signedUrl ?? null;
        }
        nextItem.customization = nextCustomization;
      }

      return nextItem as T;
    })
  );
};

export const collectPhotoStoragePaths = (items: Array<Record<string, any>>): string[] => {
  const paths = items
    .map((item) => {
      const storagePath = item?.photoStoragePath;
      return typeof storagePath === 'string' && storagePath.trim().length > 0
        ? storagePath.trim()
        : null;
    })
    .filter((path): path is string => path !== null);

  return Array.from(new Set(paths));
};

export const clearSignedPhotoData = <T extends Record<string, any>>(items: T[], pathsToClear: Set<string>): T[] => {
  return items.map((item) => {
    const storagePath = typeof item.photoStoragePath === 'string' ? item.photoStoragePath : null;

    if (!storagePath || !pathsToClear.has(storagePath)) {
      return item;
    }

    const nextItem: Record<string, any> = { ...item };
    nextItem.photoUrl = null;
    nextItem.photoStoragePath = null;

    if (nextItem.customization && typeof nextItem.customization === 'object') {
      const nextCustomization = { ...(nextItem.customization as Record<string, unknown>) };
      if (typeof nextCustomization.photoUrl === 'string') {
        nextCustomization.photoUrl = null;
      }
      nextItem.customization = nextCustomization;
    }

    return nextItem as T;
  });
};

export const normalizeQuotePhotoPath = (rawPath: string | null | undefined) => {
  if (!rawPath || typeof rawPath !== 'string') {
    return null;
  }

  if (isHttpUrl(rawPath)) {
    return rawPath;
  }

  const normalized = normalizePhotoPath(rawPath);
  if (!normalized) {
    return null;
  }

  return normalized;
};

export const getSignedQuotePhotoUrl = async (rawPath: string | null | undefined) => {
  const normalized = normalizeQuotePhotoPath(rawPath);
  if (!normalized || isHttpUrl(normalized)) {
    return normalized ?? null;
  }

  return resolveSignedUrl(normalized);
};
