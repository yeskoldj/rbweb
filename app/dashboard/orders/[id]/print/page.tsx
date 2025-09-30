'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import SafeImage from '@/components/SafeImage';
import { extractItemDetails, getItemPhotoUrl } from '@/lib/orderItemFormatting';
import { withSignedPhotoUrls } from '@/lib/orderPhotoStorage';
import { extractSpecialRequestNotes } from '@/lib/specialRequestParsing';

interface OrderItem {
  name: string;
  quantity: number;
  price: string | number;
  details?: string;
  photoUrl?: string;
  photoStoragePath?: string | null;
  price_label?: string | null;
  isPricePending?: boolean;
  customization?: Record<string, unknown> | null;
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
  pickup_date?: string;
  pickup_time?: string;
  special_requests?: string;
}

export default function PrintOrderPage({ params }: { params: { id: string } }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [hasAutoPrinted, setHasAutoPrinted] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('id', params.id)
        .single();
      if (data) {
        const itemsArray = Array.isArray(data.items) ? data.items : [];
        const itemsWithUrls = await withSignedPhotoUrls(itemsArray);
        setOrder({ ...(data as Order), items: itemsWithUrls as OrderItem[] });
      }
    };
    fetchOrder();
  }, [params.id]);

  useEffect(() => {
    if (!order || hasAutoPrinted) {
      return;
    }

    if (typeof window === 'undefined') {
      return;
    }

    const timeout = window.setTimeout(() => {
      window.print();
      setHasAutoPrinted(true);
    }, 400);

    return () => window.clearTimeout(timeout);
  }, [order, hasAutoPrinted]);

  const handlePrint = () => {
    window.print();
  };

  const normalizePriceString = (value: string) => value.replace(/[^0-9.,-]/g, '').replace(',', '.');

  const formatCurrency = (value: number | string) => {
    if (typeof value === 'number') {
      return `$${value.toFixed(2)}`;
    }

    const trimmed = String(value).trim();
    if (!trimmed) {
      return '$0.00';
    }

    if (trimmed.startsWith('$')) {
      return trimmed;
    }

    const parsed = parseFloat(normalizePriceString(trimmed));
    return Number.isNaN(parsed) ? trimmed : `$${parsed.toFixed(2)}`;
  };

  const formatItemPrice = (item: OrderItem) => {
    const label = item.price_label?.trim();
    if (item.isPricePending || (label && label.length > 0)) {
      return label || 'Precio pendiente';
    }

    return formatCurrency(item.price);
  };

  if (!order) {
    return <div className="p-4">Loading…</div>;
  }

  const printableItems = Array.isArray(order.items) ? order.items : [];
  const orderReference = order.p2p_reference ?? order.id.slice(-8);
  const specialRequestNotes = extractSpecialRequestNotes(order.special_requests);

  return (
    <div className="p-4 print:p-0">
      <div className="mx-auto max-w-3xl rounded-lg bg-white p-6 shadow print:shadow-none print:p-10">
        <div className="flex flex-col gap-4 border-b border-gray-200 pb-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Orden #{orderReference}</h1>
            <p className="text-sm text-gray-500 print:hidden">Documento listo para imprimir o guardar como PDF.</p>
            {order.p2p_reference && (
              <p className="text-xs text-gray-400">Referencia externa: {order.p2p_reference}</p>
            )}
          </div>
          <button
            onClick={handlePrint}
            className="self-start rounded bg-pink-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-pink-700 print:hidden"
            type="button"
          >
            <i className="ri-printer-line mr-2"></i>
            Imprimir / Descargar
          </button>
        </div>

        <div className="mt-4 grid gap-2 text-sm text-gray-700">
          <p>
            <span className="font-semibold text-gray-900">Cliente:</span> {order.customer_name}
          </p>
          <p>
            <span className="font-semibold text-gray-900">Teléfono (contacto principal):</span>{' '}
            {order.customer_phone}
          </p>
          {order.customer_email && (
            <p>
              <span className="font-semibold text-gray-900">Email:</span> {order.customer_email}
            </p>
          )}
          <p>
            <span className="font-semibold text-gray-900">Fecha de creación:</span> {order.order_date}
          </p>
          {(order.pickup_date || order.pickup_time) && (
            <p>
              <span className="font-semibold text-gray-900">Retiro:</span>{' '}
              {order.pickup_date && <span>{order.pickup_date}</span>}
              {order.pickup_date && order.pickup_time && <span> · </span>}
              {order.pickup_time && <span>{order.pickup_time}</span>}
            </p>
          )}
        </div>

        <div className="mt-6">
          <h2 className="text-xl font-semibold text-gray-800">Artículos</h2>
          <table className="mt-3 w-full border-collapse text-sm text-gray-700">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Cant.</th>
                <th className="py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Descripción</th>
                <th className="py-2 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Precio</th>
              </tr>
            </thead>
            <tbody>
              {printableItems.map((item, index) => {
                const detailEntries = extractItemDetails(item);
                const photoSource = getItemPhotoUrl(item);

                return (
                  <tr key={`${order.id}-print-item-${index}`} className="align-top border-b border-gray-200 last:border-0">
                    <td className="whitespace-nowrap py-3 pr-3 text-base font-semibold text-gray-800">
                      {item.quantity}x
                    </td>
                    <td className="py-3 pr-3">
                      <div className="font-semibold text-gray-800">{item.name}</div>
                      {detailEntries.length > 0 && (
                        <ul className="mt-2 space-y-1 text-xs text-gray-600">
                          {detailEntries.map((detail, detailIndex) => (
                            <li
                              key={`${order.id}-print-item-${index}-detail-${detailIndex}`}
                              className="flex items-start gap-2"
                            >
                              <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-pink-400"></span>
                              <span>
                                {detail.label ? (
                                  <>
                                    <span className="font-semibold text-gray-700">{detail.label}:</span>{' '}
                                    <span className={detail.emphasis ? 'text-gray-800 font-semibold' : undefined}>
                                      {detail.value}
                                    </span>
                                  </>
                                ) : (
                                  detail.value
                                )}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}

                      {photoSource && (
                        <div className="relative mt-3 h-28 w-48 overflow-hidden rounded border border-pink-100">
                          <SafeImage
                            src={photoSource}
                            alt={`Referencia de ${item.name}`}
                            fill
                            className="object-cover"
                            sizes="192px"
                          />
                        </div>
                      )}
                    </td>
                    <td className="whitespace-nowrap py-3 text-right text-base font-semibold text-gray-800">
                      {formatItemPrice(item)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {specialRequestNotes.length > 0 && (
          <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <h2 className="text-lg font-semibold text-amber-800">Instrucciones adicionales</h2>
            <ul className="mt-2 space-y-1 text-sm text-amber-800">
              {specialRequestNotes.map((note, index) => (
                <li key={`${order.id}-print-special-${index}`} className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-500"></span>
                  <span>{note}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4">
          <span className="text-sm font-medium text-gray-600">Total del pedido</span>
          <span className="text-xl font-bold text-gray-900">{formatCurrency(order.total)}</span>
        </div>
      </div>
    </div>
  );
}

