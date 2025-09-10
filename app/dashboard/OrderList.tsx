'use client';

import { useState } from 'react';
import { Order } from '@/lib/supabase';

interface Props {
  orders: Order[];
  currentUser: any;
  showSuccessMessage?: string;
  onStatusUpdate: (id: string, status: Order['status']) => void;
  onDelete: (id: string) => Promise<void> | void;
  setShowTodayView: (show: boolean) => void;
}

export default function OrderList({ orders, currentUser, showSuccessMessage, onStatusUpdate, onDelete, setShowTodayView }: Props) {
  const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(null);
  const [deletingOrder, setDeletingOrder] = useState<string | null>(null);

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    baking: 'bg-orange-100 text-orange-800',
    decorating: 'bg-purple-100 text-purple-800',
    ready: 'bg-green-100 text-green-800',
    completed: 'bg-blue-100 text-blue-800',
    cancelled: 'bg-red-100 text-red-800',
  } as const;

  const getTodayOrders = () => {
    const today = new Date().toISOString().split('T')[0];
    return orders.filter((order) => order.order_date === today);
  };

  const handleDelete = async (id: string) => {
    setDeletingOrder(id);
    await onDelete(id);
    setDeletingOrder(null);
    setDeleteConfirmation(null);
  };

  return (
    <div className="space-y-4">
      {showSuccessMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <div className="flex items-center">
            <div className="w-5 h-5 flex items-center justify-center">
              <i className="ri-check-line text-green-600"></i>
            </div>
            <p className="ml-3 text-green-700 font-medium">{showSuccessMessage}</p>
          </div>
        </div>
      )}

      {deleteConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm mx-4 shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 flex items-center justify-center bg-red-100 rounded-full mx-auto mb-4">
                <i className="ri-delete-bin-line text-red-500 text-2xl"></i>
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">¿Eliminar Pedido?</h3>
              <p className="text-gray-600 text-sm mb-6">
                Esta acción no se puede deshacer. El pedido será eliminado permanentemente.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setDeleteConfirmation(null)}
                  className="flex-1 bg-gray-200 text-gray-800 py-3 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirmation)}
                  disabled={deletingOrder === deleteConfirmation}
                  className="flex-1 bg-red-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {deletingOrder === deleteConfirmation ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Eliminando...
                    </div>
                  ) : (
                    'Eliminar'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-gradient-to-r from-pink-400 to-teal-400 rounded-xl p-4 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-1">Vista Rápida</h3>
            <p className="text-sm opacity-90">Gestiona los pedidos de hoy eficientemente</p>
          </div>
          <button
            onClick={() => setShowTodayView(true)}
            className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-lg font-medium !rounded-button hover:bg-white/30 transition-all transform hover:scale-105 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-white">Hoy</p>
                <p className="text-sm text-white/90">{getTodayOrders().length} pedido{getTodayOrders().length !== 1 ? 's' : ''}</p>
              </div>
              <div className="flex space-x-1 ml-3">
                <div className="w-6 h-6 rounded-full bg-white/30 text-white text-xs flex items-center justify-center font-medium">
                  {getTodayOrders().length}
                </div>
                <i className="ri-arrow-right-line text-lg ml-2"></i>
              </div>
            </div>
          </button>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 flex items-center justify-center bg-gray-100 rounded-full mx-auto mb-4">
            <i className="ri-shopping-bag-line text-gray-400 text-2xl"></i>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">No hay pedidos aún</h3>
          <p className="text-gray-600 text-sm">
            Los pedidos aparecerán aquí cuando los clientes los realicen
          </p>
        </div>
      ) : (
        orders.map((order) => (
          <div key={order.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-pink-400 via-purple-400 to-teal-400 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                    {order.customer_name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 text-lg">{order.customer_name}</h3>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <i className="ri-time-line"></i>
                      <span>{order.pickup_time || 'Hora no especificada'}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-right">
                    <p className="text-2xl font-bold text-pink-600">${order.total.toFixed(2)}</p>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusColors[order.status]} shadow-sm`}>
                      <i
                        className={`${
                          order.status === 'pending'
                            ? 'ri-timer-line'
                            : order.status === 'baking'
                            ? 'ri-fire-line'
                            : order.status === 'decorating'
                            ? 'ri-brush-line'
                            : order.status === 'ready'
                            ? 'ri-check-line'
                            : order.status === 'completed'
                            ? 'ri-check-double-line'
                            : 'ri-close-line'
                        } mr-1`}
                      ></i>
                      {order.status === 'pending'
                        ? 'Pendiente'
                        : order.status === 'baking'
                        ? 'Horneando'
                        : order.status === 'decorating'
                        ? 'Decorando'
                        : order.status === 'ready'
                        ? 'Listo'
                        : order.status === 'completed'
                        ? 'Completado'
                        : 'Cancelado'}
                    </span>
                  </div>
                  {currentUser?.role === 'owner' && (
                    <button
                      onClick={() => setDeleteConfirmation(order.id)}
                      className="w-8 h-8 flex items-center justify-center bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors"
                      title="Eliminar pedido"
                    >
                      <i className="ri-delete-bin-line text-sm"></i>
                    </button>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <h4 className="text-sm font-bold text-gray-700 mb-2 flex items-center">
                  <i className="ri-shopping-bag-line mr-2"></i>
                  Items del pedido:
                </h4>
                <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-pink-100 rounded-full flex items-center justify-center text-pink-600 font-bold text-xs">
                          {item.quantity}
                        </div>
                        <span className="text-sm font-medium text-gray-700">{item.name}</span>
                      </div>
                      <span className="text-sm font-bold text-gray-800">{item.price}</span>
                    </div>
                  ))}
                </div>
              </div>

              {order.special_requests && (
                <div className="mb-4 p-3 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl border-l-4 border-yellow-400">
                  <div className="flex items-start space-x-2">
                    <i className="ri-lightbulb-line text-yellow-600 mt-0.5"></i>
                    <div>
                      <p className="text-sm font-bold text-yellow-800">Solicitud Especial:</p>
                      <p className="text-sm text-yellow-700">{order.special_requests}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex space-x-2">
                {order.status === 'pending' && (
                  <button
                    onClick={() => onStatusUpdate(order.id, 'baking')}
                    className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 px-4 rounded-xl text-sm font-bold !rounded-button hover:from-orange-600 hover:to-red-600 transition-all transform hover:scale-105 shadow-lg"
                  >
                    <i className="ri-fire-line mr-2"></i>
                    Iniciar Horneado
                  </button>
                )}
                {order.status === 'baking' && (
                  <button
                    onClick={() => onStatusUpdate(order.id, 'decorating')}
                    className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-4 rounded-xl text-sm font-bold !rounded-button hover:from-purple-600 hover:to-pink-600 transition-all transform hover:scale-105 shadow-lg"
                  >
                    <i className="ri-brush-line mr-2"></i>
                    Iniciar Decoración
                  </button>
                )}
                {order.status === 'decorating' && (
                  <button
                    onClick={() => onStatusUpdate(order.id, 'ready')}
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 px-4 rounded-xl text-sm font-bold !rounded-button hover:from-green-600 hover:to-emerald-600 transition-all transform hover:scale-105 shadow-lg"
                  >
                    <i className="ri-check-line mr-2"></i>
                    Marcar Listo
                  </button>
                )}
                {order.status === 'ready' && (
                  <button
                    onClick={() => onStatusUpdate(order.id, 'completed')}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-3 px-4 rounded-xl text-sm font-bold !rounded-button hover:from-blue-600 hover:to-indigo-600 transition-all transform hover:scale-105 shadow-lg"
                  >
                    <i className="ri-check-double-line mr-2"></i>
                    Completar Pedido
                  </button>
                )}

                {order.status !== 'completed' && order.status !== 'cancelled' && (
                  <button
                    onClick={() => onStatusUpdate(order.id, 'cancelled')}
                    className="bg-gradient-to-r from-red-500 to-red-600 text-white py-3 px-4 rounded-xl text-sm font-bold !rounded-button hover:from-red-600 hover:to-red-700 transition-all transform hover:scale-105 shadow-lg"
                    title={currentUser?.role === 'employee' ? 'Solicitar cancelación al propietario' : 'Cancelar pedido'}
                  >
                    <i className="ri-close-line mr-2"></i>
                    {currentUser?.role === 'employee' ? 'Solicitar Cancelar' : 'Cancelar'}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
