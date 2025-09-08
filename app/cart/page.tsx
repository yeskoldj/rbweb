// app/cart/page.tsx
import { redirect } from 'next/navigation';

export default function CartRedirectPage() {
  redirect('/order');
}
