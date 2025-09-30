import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || ''

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY for auth helper')
}

export const STAFF_ROLES = new Set(['owner', 'employee'])

export interface AuthContext {
  userId: string
  role: string
  email?: string
}

function jsonResponse(
  status: number,
  message: string,
  corsHeaders: Record<string, string>,
): Response {
  return new Response(
    JSON.stringify({ error: message }),
    {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    },
  )
}

export async function requireUser(
  req: Request,
  supabaseAdmin: any,
  corsHeaders: Record<string, string>,
): Promise<AuthContext | Response> {
  const authHeader = req.headers.get('Authorization') || req.headers.get('authorization') || ''

  if (!authHeader.toLowerCase().startsWith('bearer ')) {
    return jsonResponse(401, 'Missing or invalid Authorization header', corsHeaders)
  }

  const token = authHeader.slice(7).trim()
  if (!token) {
    return jsonResponse(401, 'Missing bearer token', corsHeaders)
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return jsonResponse(500, 'Supabase credentials not configured', corsHeaders)
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token)

    if (error || !user) {
      console.warn('Invalid Supabase token:', error?.message)
      return jsonResponse(401, 'Invalid token', corsHeaders)
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, role')
      .eq('id', user.id)
      .maybeSingle()

    if (profileError) {
      console.error('Error fetching profile during auth:', profileError)
      return jsonResponse(500, 'Failed to load profile', corsHeaders)
    }

    const role = profile?.role || 'customer'

    const email = user.email || profile?.email || undefined

    return { userId: user.id, role, email }
  } catch (err: any) {
    console.error('Unexpected auth validation error:', err)
    return jsonResponse(500, 'Authentication failure', corsHeaders)
  }
}

export function isStaffRole(role: string | null | undefined): boolean {
  return role ? STAFF_ROLES.has(role) : false
}
