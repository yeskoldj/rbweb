export type QuoteStatus = 'pending' | 'responded' | 'accepted' | 'rejected';

export interface Quote {
  id: string;
  customer_name: string;
  customer_email?: string | null;
  customer_phone?: string | null;
  occasion?: string | null;
  age_group?: string | null;
  theme?: string | null;
  servings?: string | null;
  budget?: string | null;
  event_date?: string | null;
  event_details?: string | null;
  has_reference_photo?: boolean;
  photo_description?: string | null;
  reference_photo_url?: string | null;
  status: QuoteStatus;
  created_at: string;
  estimated_price?: number | null;
  admin_notes?: string | null;
  responded_at?: string | null;
  updated_at?: string | null;
}
