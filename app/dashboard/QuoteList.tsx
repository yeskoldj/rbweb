'use client';

import { useState } from 'react';
import QuoteCard from './QuoteCard';
import { Quote, QuoteStatus } from './types';

interface Props {
  quotes: Quote[];
  showSuccessMessage?: string;
  onStatusUpdate: (id: string, status: QuoteStatus, estimatedPrice?: number, adminNotes?: string) => void;
  onFinalize: (quote: Quote) => void;
  onDelete: (id: string) => Promise<void> | void;
}

export default function QuoteList({ quotes, showSuccessMessage, onStatusUpdate, onFinalize, onDelete }: Props) {
  const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(null);
  const [deletingQuote, setDeletingQuote] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeletingQuote(id);
    await onDelete(id);
    setDeletingQuote(null);
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
              <h3 className="text-lg font-bold text-gray-800 mb-2">¿Eliminar Cotización?</h3>
              <p className="text-gray-600 text-sm mb-6">
                Esta acción no se puede deshacer. La cotización será eliminada permanentemente.
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
                  disabled={deletingQuote === deleteConfirmation}
                  className="flex-1 bg-red-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {deletingQuote === deleteConfirmation ? (
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

      {quotes.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center">
          <div className="w-16 h-16 flex items-center justify-center bg-gray-100 rounded-full mx-auto mb-4">
            <i className="ri-file-list-line text-gray-400 text-2xl"></i>
          </div>
          <h3 className="text-lg font-medium text-gray-800 mb-2">No hay cotizaciones</h3>
          <p className="text-gray-600">Las nuevas cotizaciones aparecerán aquí</p>
        </div>
      ) : (
        quotes.map((quote) => (
          <QuoteCard
            key={quote.id}
            quote={quote}
            onStatusUpdate={onStatusUpdate}
            onFinalize={onFinalize}
          />
        ))
      )}
    </div>
  );
}
