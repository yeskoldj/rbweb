import { NextResponse } from 'next/server';

const getSupabaseConfig = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY ?? '';

  return { supabaseUrl: supabaseUrl.trim(), supabaseAnonKey: supabaseAnonKey.trim() };
};

const buildCacheHeaders = (response: Response): Record<string, string> => {
  const cacheControl = response.headers.get('cache-control');
  return cacheControl ? { 'Cache-Control': cacheControl } : {};
};

const missingConfigResponse = (message: string) =>
  NextResponse.json(
    {
      success: false,
      setupRequired: true,
      message,
    },
    { status: 500 },
  );

export async function GET() {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();

  if (!supabaseUrl) {
    return missingConfigResponse('Supabase URL is not configured.');
  }

  if (!supabaseAnonKey) {
    return missingConfigResponse('Supabase anon key is not configured.');
  }

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/google-reviews`, {
      headers: {
        'Content-Type': 'application/json',
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
      cache: 'no-store',
    });

    const contentType = response.headers.get('content-type') ?? '';
    const isJson = contentType.includes('application/json');
    const payload: unknown = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      if (isJson && payload && typeof payload === 'object') {
        return NextResponse.json(payload as Record<string, unknown>, {
          status: response.status,
          headers: buildCacheHeaders(response),
        });
      }

      return NextResponse.json(
        {
          success: false,
          message: typeof payload === 'string' && payload.length > 0
            ? payload
            : 'Unexpected error calling google-reviews function.',
        },
        { status: response.status },
      );
    }

    return NextResponse.json(payload as Record<string, unknown>, {
      status: 200,
      headers: buildCacheHeaders(response),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        setupRequired: false,
        message: 'Failed to contact the google-reviews Edge Function.',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
