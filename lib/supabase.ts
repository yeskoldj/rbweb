
import { createClient } from '@supabase/supabase-js'
import { getEnvVar } from './env'

const supabaseUrl = getEnvVar('NEXT_PUBLIC_SUPABASE_URL')
const supabaseAnonKey = getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY')

export const supabase: any =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null

export type OrderStatus = 'pending' | 'baking' | 'decorating' | 'ready' | 'completed' | 'cancelled'

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
  items: any[]
  subtotal: number
  tax: number
  total: number
  status: OrderStatus
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
