import { supabase } from '@/lib/supabase'

export async function getCurrentAccessToken(explicitToken?: string): Promise<string | null> {
  if (explicitToken) {
    return explicitToken
  }

  const { data, error } = await supabase.auth.getSession()
  if (error) {
    console.error('Error obtaining Supabase session:', error.message)
    return null
  }

  return data.session?.access_token || null
}
