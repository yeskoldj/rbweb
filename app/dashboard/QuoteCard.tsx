'use client';

import { useState } from 'react';
import { Quote, QuoteStatus } from './types';

const quoteStatusColors: Record<QuoteStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  responded: 'bg-blue-100 text-blue-800',
  accepted: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

export default function QuoteCard({ quote, onStatusUpdate, onFinalize }: { quote: Quote; onStatusUpdate: (id: string, status: QuoteStatus, estimatedPrice?: number, adminNotes?: string) => void; onFinalize: (quote: Quote) => void }) {
  const [showDetails, setShowDetails] = useState(false);
  const [estimatedPrice, setEstimatedPrice] = useState<string>(
    quote.estimated_price ? String(quote.estimated_price) : ''
  );
  const [adminNotes, setAdminNotes] = useState(quote.admin_notes || '');

  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      pending: 'Pendiente',
      responded: 'Respondida',
      accepted: 'Aceptada',
      rejected: 'Rechazada',
    };
    return statusMap[status] || status;
  };

  const handleRespond = () => {
    if (!estimatedPrice) {
      alert('Por favor ingresa un precio estimado');
      return;
    }
    onStatusUpdate(quote.id, 'responded', parseFloat(estimatedPrice), adminNotes);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-400">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-gray-800 text-lg">{quote.customer_name}</h3>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center">
              <i className="ri-phone-line mr-1"></i>
              <span>{quote.customer_phone}</span>
            </div>
            {quote.customer_email && (
              <div className="flex items-center">
                <i className="ri-mail-line mr-1"></i>
                <span>{quote.customer_email}</span>
              </div>
            )}
          </div>
        </div>
        <div className="text-right">
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${quoteStatusColors[quote.status as QuoteStatus]} shadow-sm`}>
            {getStatusText(quote.status)}
          </span>
          <p className="text-xs text-gray-500 mt-1">{new Date(quote.created_at).toLocaleDateString('es-ES')}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        {quote.occasion && (
          <div>
            <span className="text-gray-600">Ocasión:</span>
            <span className="ml-2 font-medium capitalize">{quote.occasion}</span>
          </div>
        )}
        {quote.servings && (
          <div>
            <span className="text-gray-600">Porciones:</span>
            <span className="ml-2 font-medium">{quote.servings}</span>
          </div>
        )}
        {quote.budget && (
          <div>
            <span className="text-gray-600">Presupuesto:</span>
            <span className="ml-2 font-medium capitalize">{quote.budget}</span>
          </div>
        )}
        {quote.event_date && (
          <div>
            <span className="text-gray-600">Fecha del evento:</span>
            <span className="ml-2 font-medium">{new Date(quote.event_date).toLocaleDateString('es-ES')}</span>
          </div>
        )}
      </div>

      {quote.theme && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium text-gray-700 mb-1">Tema/Estilo:</p>
          <p className="text-sm text-gray-600">{quote.theme}</p>
        </div>
      )}

      {quote.has_reference_photo && quote.photo_description && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
          <p className="text-sm font-medium text-blue-800 mb-1">Foto de Referencia:</p>
          <p className="text-sm text-blue-700">{quote.photo_description}</p>
          {quote.reference_photo_url && (
            <div className="mt-2">
              <img src={quote.reference_photo_url} alt="Referencia" className="max-w-full h-32 object-cover rounded" />
            </div>
          )}
        </div>
      )}

      {quote.event_details && (
        <div className="mb-4 p-3 bg-amber-50 rounded-lg border-l-4 border-amber-400">
          <p className="text-sm font-medium text-amber-800 mb-1">Detalles del Evento:</p>
          <p className="text-sm text-amber-700">{quote.event_details}</p>
        </div>
      )}

      <button onClick={() => setShowDetails(!showDetails)} className="text-purple-600 text-sm font-medium hover:text-purple-700 mb-4">
        {showDetails ? 'Ocultar opciones' : 'Responder cotización'}
        <i className={`ri-arrow-${showDetails ? 'up' : 'down'}-s-line ml-1`}></i>
      </button>

      {showDetails && quote.status === 'pending' && (
        <div className="border-t pt-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Precio Estimado ($)</label>
              <input
                type="number"
                value={estimatedPrice}
                onChange={(e) => setEstimatedPrice(e.target.value)}
                placeholder="85.00"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notas Internas</label>
              <input
                type="text"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Notas adicionales..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
              />
            </div>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={handleRespond}
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white py-2 px-4 rounded-lg text-sm font-bold hover:from-green-600 hover:to-emerald-600 transition-all"
            >
              <i className="ri-check-line mr-2"></i>
              Enviar Respuesta
            </button>
            <button
              onClick={() => onStatusUpdate(quote.id, 'rejected')}
              className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white py-2 px-4 rounded-lg text-sm font-bold hover:from-red-600 hover:to-red-700 transition-all"
            >
              <i className="ri-close-line mr-2"></i>
              Rechazar
            </button>
            <button
              onClick={() => window.open(`tel:${quote.customer_phone}`, '_self')}
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2 px-4 rounded-lg text-sm font-bold hover:from-blue-600 hover:to-blue-700 transition-all"
            >
              <i className="ri-phone-line"></i>
            </button>
          </div>
        </div>
      )}

      {quote.estimated_price && (
        <div className="mt-4 p-3 bg-green-50 rounded-lg border-l-4 border-green-400">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-green-800">Precio Cotizado:</p>
              <p className="text-lg font-bold text-green-700">${quote.estimated_price}</p>
            </div>
            {quote.admin_notes && (
              <div className="text-right">
                <p className="text-xs text-green-600">Notas: {quote.admin_notes}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {quote.status === 'responded' && (
        <button
          onClick={() => onFinalize(quote)}
          className="mt-4 w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white py-2 px-4 rounded-lg text-sm font-bold hover:from-pink-600 hover:to-purple-600 transition-all"
        >
          Finalizar y Crear Orden
        </button>
      )}
    </div>
  );
}
