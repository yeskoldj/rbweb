import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

const ALLOWED_ROLES = new Set(['owner', 'employee', 'customer', 'pending']);

function isValidUuid(value: unknown): value is string {
  if (typeof value !== 'string') {
    return false;
  }

  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function extractAccessToken(request: Request): string | null {
  const headerToken = request.headers.get('Authorization');
  if (headerToken) {
    const bearerToken = headerToken.replace(/bearer\s+/i, '').trim();
    if (bearerToken) {
      return bearerToken;
    }
  }

  try {
    const cookieStore = cookies();
    const directToken = cookieStore.get('sb-access-token')?.value?.trim();
    if (directToken) {
      return directToken;
    }

    const authCookie = cookieStore
      .getAll()
      .find((cookie) => /sb-.*-auth-token$/.test(cookie.name));

    if (authCookie?.value) {
      let decodedValue = authCookie.value;
      try {
        decodedValue = decodeURIComponent(authCookie.value);
      } catch (error) {
        console.warn('Unable to decode Supabase auth cookie value:', error);
      }

      try {
        const parsed = JSON.parse(decodedValue);
        const cookieToken =
          parsed?.access_token ||
          parsed?.currentSession?.access_token ||
          parsed?.session?.access_token;

        if (typeof cookieToken === 'string' && cookieToken.trim().length > 0) {
          return cookieToken.trim();
        }
      } catch (error) {
        console.warn('Unable to parse Supabase auth cookie:', error);
      }
    }
  } catch (error) {
    console.warn('Unable to read Supabase auth cookies:', error);
  }

  return null;
}

async function getAuthorizedClient(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: 'Missing Supabase configuration' }, { status: 500 });
  }

  const token = extractAccessToken(request);
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
  const {
    data: { user },
    error: authError,
  } = await supabaseAdmin.auth.getUser(token);

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  if (!profile || !['owner', 'employee'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return supabaseAdmin;
}

export async function GET(request: Request) {
  const supabaseAdmin = await getAuthorizedClient(request);
  if (supabaseAdmin instanceof NextResponse) {
    return supabaseAdmin;
  }

  const {
    data: { users },
    error: authError,
  } = await supabaseAdmin.auth.admin.listUsers({ perPage: 100 });

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 500 });
  }

  if (!users || users.length === 0) {
    return NextResponse.json({ data: [] });
  }

  const userIds = users.map((user) => user.id);
  const { data: profiles, error: profilesError } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name, phone, role, created_at')
    .in('id', userIds);

  if (profilesError) {
    return NextResponse.json({ error: profilesError.message }, { status: 500 });
  }

  const profileMap = new Map(profiles?.map((profile) => [profile.id, profile]));
  const combined = users
    .map((user) => {
      const profile = profileMap.get(user.id);

      return {
        id: user.id,
        email: user.email ?? '',
        full_name: profile?.full_name ?? '',
        phone: profile?.phone ?? '',
        role: profile?.role ?? 'customer',
        created_at: profile?.created_at ?? user.created_at,
      };
    })
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    .slice(0, 100);

  return NextResponse.json({ data: combined });
}

export async function PUT(request: Request) {
  const supabaseAdmin = await getAuthorizedClient(request);
  if (supabaseAdmin instanceof NextResponse) {
    return supabaseAdmin;
  }

  const body = await request.json();
  const { userId, newRole } = body ?? {};

  if (!isValidUuid(userId)) {
    return NextResponse.json({ error: 'Invalid user id' }, { status: 400 });
  }

  if (typeof newRole !== 'string') {
    return NextResponse.json({ error: 'Role is required' }, { status: 400 });
  }

  const normalizedRole = newRole.trim();

  if (!ALLOWED_ROLES.has(normalizedRole)) {
    return NextResponse.json({ error: 'Unsupported role value' }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from('profiles')
    .update({ role: normalizedRole, updated_at: new Date().toISOString() })
    .eq('id', userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, role: normalizedRole });
}
