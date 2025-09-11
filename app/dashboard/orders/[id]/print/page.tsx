'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface OrderItem {
  name: string;
  quantity: number;
  price: string | number;
  details?: string;
  photoUrl?: string;
}

interface Order {
  id: string;
  p2p_reference?: string | null;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  items: OrderItem[];
  total: number;
  order_date: string;
  pickup_time?: string;
  special_requests?: string;
}

export default function PrintOrderPage({ params }: { params: { id: string } }) {
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('id', params.id)
        .single();
      if (data) setOrder(data as Order);
    };
    fetchOrder();
  }, [params.id]);

  const handlePrint = () => {
    window.print();
  };

  if (!order) {
    return <div className="p-4">Loading…</div>;
  }

  return (
    <div className="p-4 print:p-0">
      <div className="max-w-2xl mx-auto bg-white p-6 rounded shadow print:shadow-none">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Orden #{order.p2p_reference ?? order.id.slice(-8)}</h1>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-pink-600 text-white rounded print:hidden"
          >
            Imprimir / Descargar
          </button>
        </div>

        <div className="mb-4">
          <p><strong>Cliente:</strong> {order.customer_name}</p>
          <p><strong>Teléfono:</strong> {order.customer_phone}</p>
          {order.customer_email && (
            <p><strong>Email:</strong> {order.customer_email}</p>
          )}
          <p><strong>Fecha:</strong> {order.order_date}</p>
          {order.pickup_time && (
            <p><strong>Hora de retiro:</strong> {order.pickup_time}</p>
          )}
        </div>

        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2">Artículos</h2>
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Cant.</th>
                <th className="text-left py-2">Descripción</th>
                <th className="text-right py-2">Precio</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, index) => (
                <tr key={index} className="border-b align-top">
                  <td className="py-2">{item.quantity}x</td>
                  <td className="py-2">
                    <div>
                      {item.name}
                      {item.details && (
                        <div className="text-sm text-gray-600">{item.details}</div>
                      )}
                      {item.photoUrl && (
                        <img
                          src={item.photoUrl}
                          alt={item.name}
                          className="mt-1 h-24 object-cover"
                        />
                      )}
                    </div>
                  </td>
                  <td className="py-2 text-right">${item.price}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {order.special_requests && (
          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-2">Instrucciones</h2>
            <p>{order.special_requests}</p>
          </div>
        )}

        <div className="text-right font-bold text-lg">
          Total: ${order.total}
        </div>
      </div>
    </div>
  );
}

