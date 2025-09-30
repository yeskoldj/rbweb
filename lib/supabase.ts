
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const PLACEHOLDER_VALUES = new Set([
  undefined,
  null,
  '',
  'your-supabase-url',
  'your-supabase-anon-key',
  'YOUR_SUPABASE_URL',
  'YOUR_SUPABASE_ANON_KEY',
])

const hasValidUrl =
  typeof supabaseUrl === 'string' &&
  !PLACEHOLDER_VALUES.has(supabaseUrl) &&
  /^https?:\/\//.test(supabaseUrl)

const hasValidAnonKey =
  typeof supabaseAnonKey === 'string' && !PLACEHOLDER_VALUES.has(supabaseAnonKey)

const configurationError = new Error(
  'Supabase no está configurado. Agrega NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en tu entorno.'
)

const createUnavailableClient = (): SupabaseClient => {
  const resolveWithError = async <T>() => ({ data: null as T | null, error: configurationError })

  const createQueryBuilder = () => {
    const builder: any = {}

    const chain = () => builder
    const rejectPromise = () => resolveWithError()
    const mutate = () => builder

    builder.select = chain
    builder.insert = mutate
    builder.update = mutate
    builder.upsert = mutate
    builder.delete = mutate
    builder.eq = chain
    builder.neq = chain
    builder.in = chain
    builder.order = chain
    builder.limit = chain
    builder.range = chain
    builder.like = chain
    builder.ilike = chain
    builder.contains = chain
    builder.or = chain
    builder.filter = chain
    builder.single = rejectPromise
    builder.maybeSingle = rejectPromise
    builder.throwOnError = chain
    builder.abortSignal = chain
    builder.then = (onFulfilled: any, onRejected: any) =>
      rejectPromise().then(onFulfilled, onRejected)
    builder.catch = (onRejected: any) => rejectPromise().catch(onRejected)
    builder.finally = (onFinally: any) => rejectPromise().finally(onFinally)

    return builder
  }

  const storageBucket = () => ({
    upload: resolveWithError,
    download: resolveWithError,
    remove: resolveWithError,
    list: resolveWithError,
    createSignedUrl: resolveWithError,
    getPublicUrl: () => ({ data: null, error: configurationError }),
  })

  return {
    auth: {
      getUser: async () => ({ data: { user: null }, error: configurationError }),
      getSession: async () => ({ data: { session: null }, error: configurationError }),
      signInWithPassword: async () => ({
        data: { session: null, user: null },
        error: configurationError,
      }),
      signUp: async () => ({ data: { user: null, session: null }, error: configurationError }),
      signOut: async () => ({ error: configurationError }),
      updateUser: async () => ({ data: { user: null }, error: configurationError }),
      onAuthStateChange: () => ({
        data: {
          subscription: {
            unsubscribe: () => {
              /* noop */
            },
          },
        },
        error: configurationError,
      }),
    },
    from: () => createQueryBuilder(),
    storage: {
      from: storageBucket,
    },
    functions: {
      invoke: resolveWithError,
    },
    rpc: resolveWithError,
    channel: () => ({
      on: () => ({ subscribe: resolveWithError }),
      subscribe: resolveWithError,
    }),
    removeChannel: () => {},
    getChannels: () => [],
  } as unknown as SupabaseClient
}

export const isSupabaseConfigured = hasValidUrl && hasValidAnonKey

if (!isSupabaseConfigured && process.env.NODE_ENV !== 'production') {
  console.warn(configurationError.message)
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : createUnavailableClient()

export type OrderStatus =
  | 'pending'
  | 'received'
  | 'baking'
  | 'decorating'
  | 'ready'
  | 'completed'
  | 'delivered'
  | 'cancelled'

export interface User {
  id: string
  email: string
  full_name?: string
  role: 'customer' | 'employee' | 'owner' | 'pending'
  created_at: string
  updated_at: string
}

export interface Order {
  id: string
  p2p_reference?: string | null
  user_id?: string
  customer_name: string
  customer_phone: string
  customer_email?: string
  billing_address?: string
  items: any[]
  subtotal: number
  tax: number
  total: number
  status: OrderStatus
  pickup_date?: string
  pickup_time?: string
  special_requests?: string
  payment_type?: string
  payment_status: 'pending' | 'completed' | 'failed' | 'paid'
  order_date: string
  payment_id?: string | null
  payment_reference?: string | null
  created_at: string
  updated_at: string
}
