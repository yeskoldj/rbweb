const NODE_ENV = (Deno.env.get('NODE_ENV') || 'development').toLowerCase();
const rawOrigins =
  Deno.env.get('ALLOWED_ORIGINS') ?? Deno.env.get('ALLOWED_ORIGIN') ?? '';

const parsedOrigins = rawOrigins
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowAllOrigins =
  parsedOrigins.includes('*') ||
  (parsedOrigins.length === 0 && NODE_ENV !== 'production');

const allowedOrigins = allowAllOrigins
  ? []
  : Array.from(new Set(parsedOrigins));

const corsBaseHeaders: Record<string, string> = {
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

const configurationError = !allowAllOrigins && allowedOrigins.length === 0
  ? 'Missing ALLOWED_ORIGINS environment variable. Set ALLOWED_ORIGINS to a comma-separated list of trusted domains.'
  : null;

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
