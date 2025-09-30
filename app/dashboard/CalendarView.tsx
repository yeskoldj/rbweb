
'use client';

import { useState } from 'react';
import { Order } from '../../lib/supabase';

interface CalendarViewProps {
  orders: Order[];
  onStatusUpdate: (orderId: string, newStatus: string) => void;
}

export default function CalendarView({ orders, onStatusUpdate }: CalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');

  const getOrdersForDate = (date: string) => {
    return orders.filter(order => order.order_date === date);
  };

  const getNext7Days = () => {
    const days = [];
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push(date.toISOString().split('T')[0]);
    }
    
    return days;
  };

  const getDaysOfMonth = () => {
    const days = [];
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const date = new Date(year, month, 1);

    while (date.getMonth() === month) {
      days.push(date.toISOString().split('T')[0]);
      date.setDate(date.getDate() + 1);
    }

    return days;
  };

  const formatDateDisplay = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    if (dateString === today.toISOString().split('T')[0]) {
      return 'Hoy';
    } else if (dateString === tomorrow.toISOString().split('T')[0]) {
      return 'Mañana';
    } else {
      return date.toLocaleDateString('es-ES', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-400',
      baking: 'bg-orange-400',
      decorating: 'bg-purple-400',
      ready: 'bg-green-400',
      completed: 'bg-blue-400',
      cancelled: 'bg-red-400'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-400';
  };

  const getStatusText = (status: string) => {
    const statusTexts = {
      pending: 'Pendiente',
      baking: 'Horneando',
      decorating: 'Decorando',
      ready: 'Listo',
      completed: 'Completado',
      cancelled: 'Cancelado'
    };
    return statusTexts[status as keyof typeof statusTexts] || status;
  };

  const getPickupSchedule = (date?: string | null, time?: string | null) => {
    if (date && time) return `${date} · ${time}`;
    if (date) return date;
    if (time) return time;
    return '';
  };

  const selectedDateOrders = getOrdersForDate(selectedDate);

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-pink-100 via-purple-100 to-teal-100 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800 flex items-center">
            <div className="w-8 h-8 flex items-center justify-center bg-white rounded-full mr-3 shadow-sm">
              <i className="ri-calendar-line text-pink-500"></i>
            </div>
            {viewMode === 'week' ? 'Próximos 7 Días' : 'Vista Mensual'}
          </h3>
          <div className="space-x-2">
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 rounded-full text-sm font-medium ${viewMode === 'week' ? 'bg-pink-400 text-white' : 'bg-white text-gray-700'}`}
            >
              7 días
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 rounded-full text-sm font-medium ${viewMode === 'month' ? 'bg-pink-400 text-white' : 'bg-white text-gray-700'}`}
            >
              Mes
            </button>
          </div>
        </div>

        <div className={viewMode === 'month' ? 'grid grid-cols-2 md:grid-cols-3 gap-3' : 'grid grid-cols-1 gap-3'}>
          {(viewMode === 'week' ? getNext7Days() : getDaysOfMonth()).map((date) => {
            const dayOrders = getOrdersForDate(date);
            const isSelected = selectedDate === date;
            const isToday = date === new Date().toISOString().split('T')[0];
            
            return (
              <button
                key={date}
                onClick={() => setSelectedDate(date)}
                className={`relative p-4 rounded-xl text-left transition-all transform hover:scale-105 ${
                  isSelected
                    ? 'bg-white shadow-lg border-2 border-pink-300 scale-105'
                    : 'bg-white/70 hover:bg-white/90 border-2 border-transparent hover:shadow-md'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                      isToday ? 'bg-gradient-to-r from-pink-400 to-teal-400' : 'bg-gray-300'
                    }`}>
                      {new Date(date).getDate()}
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">
                        {formatDateDisplay(date)}
                      </p>
                      <p className="text-sm text-gray-600">
                        {dayOrders.length > 0 ? `${dayOrders.length} pedido${dayOrders.length !== 1 ? 's' : ''}` : 'Sin pedidos'}
                      </p>
                    </div>
                  </div>
                  
                  {dayOrders.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {['pending', 'baking', 'decorating', 'ready'].map((status) => {
                        const count = dayOrders.filter(o => o.status === status).length;
                        if (count === 0) return null;
                        
                        return (
                          <div
                            key={status}
                            className={`w-7 h-7 rounded-full ${getStatusColor(status)} text-white text-xs flex items-center justify-center font-bold shadow-sm`}
                            title={`${count} ${getStatusText(status).toLowerCase()}`}
                          >
                            {count}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                
                {isSelected && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-pink-400 rounded-full"></div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-amber-400 via-orange-400 to-pink-400 p-4 text-white">
          <h3 className="text-lg font-bold mb-1 flex items-center">
            <div className="w-6 h-6 flex items-center justify-center mr-2">
              <i className="ri-cake-3-line"></i>
            </div>
            Pedidos para {formatDateDisplay(selectedDate)}
          </h3>
          <p className="text-sm opacity-90">
            {selectedDateOrders.length > 0 
              ? `${selectedDateOrders.length} pedido${selectedDateOrders.length !== 1 ? 's' : ''} programado${selectedDateOrders.length !== 1 ? 's' : ''}`
              : 'Día libre para la panadería'
            }
          </p>
        </div>
        
        <div className="p-4">
          {selectedDateOrders.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 flex items-center justify-center bg-gradient-to-br from-pink-100 to-teal-100 rounded-full mx-auto mb-4">
                <i className="ri-calendar-check-line text-pink-400 text-3xl"></i>
              </div>
              <h4 className="text-lg font-semibold text-gray-800 mb-2">¡Día tranquilo!</h4>
              <p className="text-gray-600 text-sm mb-4">No hay pedidos programados para este día</p>
              <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                <p className="text-green-800 text-sm">
                  Perfecto momento para preparar ingredientes o actualizar el menú
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {selectedDateOrders.map((order) => {
                const pickupSchedule = getPickupSchedule(order.pickup_date, order.pickup_time);

                return (
                  <div key={order.id} className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-pink-400 via-purple-400 to-teal-400 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                          {order.customer_name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-800">{order.customer_name}</h4>
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <i className="ri-phone-line"></i>
                            <span>
                              <span className="font-medium">Teléfono principal:</span>{' '}
                              {order.customer_phone}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-xl font-bold text-pink-600">${order.total}</p>
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${getStatusColor(order.status)}`}></div>
                          <span className="text-sm font-medium text-gray-700">
                            {getStatusText(order.status)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {pickupSchedule && (
                      <div className="mb-3 p-2 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center text-blue-800">
                          <i className="ri-time-line mr-2"></i>
                          <span className="text-sm font-medium">Horario de entrega: {pickupSchedule}</span>
                        </div>
                      </div>
                    )}

                    <div className="mb-3">
                      <div className="text-sm text-gray-600 mb-2">
                        <i className="ri-shopping-bag-line mr-1"></i>
                        Productos pedidos:
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {order.items.map((item: any, index: number) => (
                          <span key={index} className="px-3 py-1 bg-pink-100 text-pink-800 rounded-full text-xs font-medium">
                            {item.quantity}x {item.name}
                          </span>
                        ))}
                      </div>
                    </div>

                    {order.status !== 'completed' && order.status !== 'cancelled' && (
                      <div className="flex space-x-2">
                        {order.status === 'pending' && (
                          <button
                            onClick={() => onStatusUpdate(order.id, 'baking')}
                            className="flex-1 bg-gradient-to-r from-orange-400 to-red-400 text-white py-2 px-4 rounded-lg text-sm font-bold !rounded-button hover:from-orange-500 hover:to-red-500 transition-all transform hover:scale-105"
                          >
                            <i className="ri-fire-line mr-2"></i>
                            Comenzar a Hornear
                          </button>
                        )}
                        {order.status === 'baking' && (
                          <button
                            onClick={() => onStatusUpdate(order.id, 'decorating')}
                            className="flex-1 bg-gradient-to-r from-purple-400 to-pink-400 text-white py-2 px-4 rounded-lg text-sm font-bold !rounded-button hover:from-purple-500 hover:to-pink-500 transition-all transform hover:scale-105"
                          >
                            <i className="ri-brush-line mr-2"></i>
                            Comenzar a Decorar
                          </button>
                        )}
                        {order.status === 'decorating' && (
                          <button
                            onClick={() => onStatusUpdate(order.id, 'ready')}
                            className="flex-1 bg-gradient-to-r from-green-400 to-emerald-400 text-white py-2 px-4 rounded-lg text-sm font-bold !rounded-button hover:from-green-500 hover:to-emerald-500 transition-all transform hover:scale-105"
                          >
                            <i className="ri-check-line mr-2"></i>
                            Marcar como Listo
                          </button>
                        )}
                        {order.status === 'ready' && (
                          <button
                            onClick={() => onStatusUpdate(order.id, 'completed')}
                            className="flex-1 bg-gradient-to-r from-blue-400 to-indigo-400 text-white py-2 px-4 rounded-lg text-sm font-bold !rounded-button hover:from-blue-500 hover:to-indigo-500 transition-all transform hover:scale-105"
                          >
                            <i className="ri-check-double-line mr-2"></i>
                            Marcar Completado
                          </button>
                        )}

                        <button
                          onClick={() => window.open(`tel:${order.customer_phone}`, '_self')}
                          className="bg-gradient-to-r from-teal-400 to-blue-400 text-white py-2 px-4 rounded-lg text-sm font-bold !rounded-button hover:from-teal-500 hover:to-blue-500 transition-all transform hover:scale-105"
                        >
                          <i className="ri-phone-line"></i>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
