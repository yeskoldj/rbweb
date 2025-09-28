'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import TabBar from '@/components/TabBar';
import OrderForm from './OrderForm';
import { getUser } from '@/lib/authStorage';

export default function OrderPage() {
  const searchParams = useSearchParams();
  const existingOrderId = searchParams.get('orderId') ?? undefined;
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  

  useEffect(() => {
    const user = getUser();
    setIsAuthenticated(Boolean(user));
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-purple-50">
        <Header />
        <div className="pt-20 pb-20 flex items-center justify-center">
          <div className="text-center">Loading…</div>
        </div>
        <TabBar />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-purple-50">
        <Header />
        <div className="pt-20 pb-20">
          <div className="px-4 py-6">
            <h1 className="text-3xl font-bold text-amber-800 text-center mb-2">
              Place Order
            </h1>

            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <div className="w-20 h-20 flex items-center justify-center bg-amber-100 rounded-full mx-auto mb-4">
                <i className="ri-lock-line text-amber-600 text-3xl" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Account Required</h3>
              <p className="text-gray-600 mb-6">
                You need to create an account to place orders and track your orders.
              </p>

              <div className="space-y-3">
                <Link href="/auth">
                  <button className="w-full bg-gradient-to-r from-pink-400 to-teal-400 text-white px-6 py-3 rounded-lg font-medium !rounded-button">
                    Create Account / Login
                  </button>
                </Link>
                <Link href="/menu">
                  <button className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-medium !rounded-button">
                    View Menu
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
        <TabBar />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-purple-50">
      <Header />



      <div className="pt-20 pb-20">
        <div className="px-4 py-6">
          <h1 className="text-3xl font-bold text-amber-800 text-center mb-2">
            Place Order
          </h1>
          <p className="text-gray-600 text-center mb-8">
            Complete the form and we’ll prepare your delicious products.
          </p>

          <OrderForm orderId={existingOrderId} />
        </div>
      </div>

      <TabBar />
    </div>
  );
}
