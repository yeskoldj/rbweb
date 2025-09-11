
'use client';

/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase, type Order, type OrderStatus } from '@/lib/supabase';

interface Item {
  name: string;
  quantity: number;
  price: string;
  details?: string;
  photoUrl?: string;
}

type DashboardOrder = Order & {
  items: Item[];
  pickup_date: string;
  pickup_time: string;
};

interface OrderCardProps {
  order: DashboardOrder;
  onStatusChange: (orderId: string, newStatus: OrderStatus) => void;
}

export default function OrderCard({ order, onStatusChange }: OrderCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [signedItems, setSignedItems] = useState<Item[]>([]);

  useEffect(() => {
    const signItems = async () => {
      const itemsWithUrls = await Promise.all(
        (order.items || []).map(async (item) => {
          if (item.photoUrl) {
            const { data } = await supabase.storage
              .from('temp-uploads')
              .createSignedUrl(item.photoUrl, 60 * 60);
            return { ...item, photoUrl: data?.signedUrl };
          }
          return item;
        })
      );
      setSignedItems(itemsWithUrls);
    };
    signItems();
  }, [order.items]);

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-blue-100 text-blue-800';
      case 'ready':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'baking':
        return 'bg-yellow-100 text-yellow-800';
      case 'decorating':
        return 'bg-purple-100 text-purple-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return 'Recibido';
      case 'ready':
        return 'Listo para Pick up';
      case 'completed':
        return 'Entregado';
      case 'baking':
        return 'En horneado';
      case 'decorating':
        return 'Decorando';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  const getPaymentStatusColor = (status: DashboardOrder['payment_status']) => {
    switch (status) {
      case 'paid':
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusText = (status: DashboardOrder['payment_status']) => {
    switch (status) {
      case 'paid':
      case 'completed':
        return 'Pagado';
      case 'pending':
        return 'Pendiente';
      case 'failed':
        return 'Falló';
      default:
        return status;
    }
  };

  const handleStatusChange = (newStatus: OrderStatus) => {
    onStatusChange(order.id, newStatus);
  };

  // Asegurar que tenemos el nombre del cliente
  const customerName = order.customer_name || 'Cliente';
  const customerInitial = customerName.charAt(0).toUpperCase();
  const firstItemPhoto = signedItems.find((item) => item.photoUrl)?.photoUrl;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Order Header */}
      <div 
        className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            {firstItemPhoto ? (
              <img
                src={firstItemPhoto}
                alt={signedItems.find((item) => item.photoUrl)?.name || 'Referencia'}
                className="w-10 h-10 rounded object-cover"
              />
            ) : (
              <div className="w-10 h-10 bg-gradient-to-r from-pink-400 to-teal-400 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">{customerInitial}</span>
              </div>
            )}
            <div>
              <h4 className="font-semibold text-gray-900">{customerName}</h4>
              <p className="text-sm text-gray-500">#{order.p2p_reference ?? order.id.slice(-8)}</p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="font-bold text-lg text-gray-900">${order.total}</div>
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                {getStatusText(order.status)}
              </span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(order.payment_status)}`}>
                {getPaymentStatusText(order.payment_status)}
              </span>
              {order.payment_type === 'zelle' && (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  Pagado con Zelle
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-4">
            <span>
              <i className="ri-calendar-line mr-1"></i>
              {order.pickup_date}
            </span>
            <span>
              <i className="ri-time-line mr-1"></i>
              {order.pickup_time}
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              href={`/dashboard/orders/${order.id}/print`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center space-x-1 text-pink-600 hover:text-pink-700"
            >
              <i className="ri-printer-line text-lg"></i>
              <span className="hidden sm:inline text-sm font-medium">Imprimir</span>
            </Link>
            <i className={`ri-arrow-${isExpanded ? 'up' : 'down'}-s-line text-gray-400`}></i>
          </div>
        </div>
      </div>

      {/* Expanded Order Details */}
      {isExpanded && (
        <div className="border-t border-gray-100">
          <div className="p-4 flex justify-end">
            <Link
              href={`/dashboard/orders/${order.id}/print`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 rounded-lg text-sm font-medium bg-pink-600 text-white hover:bg-pink-700"
            >
              Imprimir
            </Link>
          </div>
          {/* Contact Info */}
          <div className="p-4 bg-gray-50">
            <h5 className="font-medium text-gray-900 mb-2">Información de Contacto</h5>
            <div className="space-y-1 text-sm text-gray-600">
              <div className="flex items-center">
                <i className="ri-phone-line mr-2 w-4"></i>
                <span>{order.customer_phone}</span>
              </div>
              {order.customer_email && (
                <div className="flex items-center">
                  <i className="ri-mail-line mr-2 w-4"></i>
                  <span>{order.customer_email}</span>
                </div>
              )}
            </div>
          </div>

          {/* Order Items */}
          <div className="p-4">
            <h5 className="font-medium text-gray-900 mb-3">Artículos del Pedido</h5>
            <div className="space-y-2">
              {signedItems.map((item, index) => (
                <div key={index} className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <span className="font-medium">{item.quantity}x</span>
                      <span className="ml-2">{item.name}</span>
                    </div>
                    {item.details && (
                      <p className="text-xs text-gray-500 mt-1 ml-6">{item.details}</p>
                    )}
                    {item.photoUrl && (
                      <a
                        href={item.photoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block mt-2 ml-6"
                      >
                        <img
                          src={item.photoUrl}
                          alt={item.name}
                          className="h-24 w-24 object-cover rounded"
                        />
                      </a>
                    )}
                  </div>
                  <span className="font-medium">${item.price}</span>
                </div>
              ))}
            </div>
            
            <div className="border-t border-gray-200 mt-3 pt-3">
              <div className="flex justify-between items-center font-bold">
                <span>Total:</span>
                <span>${order.total}</span>
              </div>
            </div>
          </div>

          {/* Special Instructions */}
          {order.special_requests && (
            <div className="px-4 pb-4">
              <h5 className="font-medium text-gray-900 mb-2">Instrucciones Especiales</h5>
              <p className="text-sm text-gray-600 bg-yellow-50 p-3 rounded-lg">
                {order.special_requests}
              </p>
            </div>
          )}

          {/* Status Actions */}
          <div className="p-4 bg-gray-50 border-t border-gray-200">
            <h5 className="font-medium text-gray-900 mb-3">Actualizar Estado</h5>
            <div className="flex space-x-2">
              <button
                onClick={() => handleStatusChange('pending')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  order.status === 'pending'
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                }`}
              >
                Recibido
              </button>
              <button
                onClick={() => handleStatusChange('ready')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  order.status === 'ready'
                    ? 'bg-yellow-600 text-white'
                    : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                }`}
              >
                Listo para Pick up
              </button>
              <button
                onClick={() => handleStatusChange('completed')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  order.status === 'completed'
                    ? 'bg-green-600 text-white'
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                Entregado
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
