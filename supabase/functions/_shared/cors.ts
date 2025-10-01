const NODE_ENV = (Deno.env.get('NODE_ENV') || 'production').toLowerCase();

const normalizeOrigin = (value: string | null | undefined): string | null => {
  if (!value) return null;

  try {
    const url = new URL(value);
    return url.origin;
  } catch {
    return null;
  }
};

const rawOrigins =
  Deno.env.get('ALLOWED_ORIGINS') ?? Deno.env.get('ALLOWED_ORIGIN') ?? '';

const configuredOrigins = rawOrigins
  .split(',')
  .map((origin) => normalizeOrigin(origin.trim()))
  .filter((origin): origin is string => Boolean(origin));

const fallbackOriginCandidates = [
  Deno.env.get('NEXT_PUBLIC_SITE_URL'),
  Deno.env.get('SITE_URL'),
  Deno.env.get('NEXT_PUBLIC_SUPABASE_URL'),
  Deno.env.get('SUPABASE_URL'),
];

const fallbackOrigins = fallbackOriginCandidates
  .map((origin) => normalizeOrigin(origin?.trim()))
  .filter((origin): origin is string => Boolean(origin));

const effectiveOrigins = configuredOrigins.length > 0
  ? configuredOrigins
  : fallbackOrigins;

const allowAllOrigins = configuredOrigins.includes('*') ||
  (configuredOrigins.length === 0 && effectiveOrigins.length === 0 && NODE_ENV !== 'production');

const allowedOrigins = allowAllOrigins
  ? []
  : Array.from(new Set(effectiveOrigins));

const corsBaseHeaders: Record<string, string> = {
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Vary': 'Origin',
};

let configurationError: string | null = null;

if (!allowAllOrigins && allowedOrigins.length === 0) {
  configurationError =
    'Missing ALLOWED_ORIGINS environment variable. Provide a comma-separated list of trusted domains or set NEXT_PUBLIC_SITE_URL.';
}

if (configurationError) {
  const message = `[CORS] ${configurationError}`;
  console.error(message);
  if (NODE_ENV === 'production') {
    throw new Error(message);
  }
}

export function getCorsHeaders(origin: string | null): Record<string, string> {
  if (allowAllOrigins) {
    return { ...corsBaseHeaders, 'Access-Control-Allow-Origin': '*' };
  }

  if (origin && allowedOrigins.includes(origin)) {
    return { ...corsBaseHeaders, 'Access-Control-Allow-Origin': origin };
  }

  return { ...corsBaseHeaders, 'Access-Control-Allow-Origin': 'null' };
}

export function isOriginAllowed(origin: string | null): boolean {
  if (allowAllOrigins) {
    return true;
  }

  return !!origin && allowedOrigins.includes(origin);
}

export function getCorsConfigError(): string | null {
  return configurationError;
}

export function getAllowedOrigins(): string[] {
  return allowAllOrigins ? ['*'] : allowedOrigins;
}
