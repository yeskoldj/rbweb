'use client';

import Image, { type ImageProps } from 'next/image';
import { useEffect, useMemo, useState } from 'react';

const OPTIMIZED_HOSTS = new Set(['static.readdy.ai']);

type SafeImageProps = Omit<ImageProps, 'src'> & {
  src?: string | null;
  fallbackSrc?: string;
};

const shouldOptimize = (value: string) => {
  if (!value) return false;
  if (value.startsWith('/')) return true;
  if (value.startsWith('data:')) return false;

  try {
    const url = new URL(value);
    return url.protocol === 'https:' && OPTIMIZED_HOSTS.has(url.hostname);
  } catch {
    return false;
  }
};

export default function SafeImage({
  src,
  fallbackSrc = '/images/placeholder.svg',
  onError,
  alt,
  ...imageProps
}: SafeImageProps) {
  const resolvedSrc = src && src.trim() ? src : fallbackSrc;
  const [currentSrc, setCurrentSrc] = useState(resolvedSrc);

  useEffect(() => {
    setCurrentSrc(resolvedSrc);
  }, [resolvedSrc]);

  const optimize = useMemo(() => shouldOptimize(currentSrc), [currentSrc]);

  return (
    <Image
      {...imageProps}
      alt={alt}
      src={currentSrc}
      unoptimized={!optimize}
      onError={event => {
        if (currentSrc !== fallbackSrc) {
          setCurrentSrc(fallbackSrc);
        }
        onError?.(event);
      }}
    />
  );
}
