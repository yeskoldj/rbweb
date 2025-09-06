
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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
  order_date: string
  created_at: string
  updated_at: string
}
