'use client';

import { useState } from 'react';

interface Quote {
  id: string;
  customer_name: string;
  customer_phone?: string | null;
  customer_email?: string | null;
}

interface Item {
  name: string;
  quantity: number;
  price: number;
}

export default function QuoteFinalizeModal({
  quote,
  onClose,
  onFinalize,
}: {
  quote: Quote;
  onClose: () => void;
  onFinalize: (
    items: Item[],
    subtotal: number,
    total: number,
    pickupTime: string,
    specialRequests: string
  ) => void;
}) {
  const [items, setItems] = useState<Item[]>([]);
  const [itemName, setItemName] = useState('');
  const [itemQuantity, setItemQuantity] = useState(1);
  const [itemPrice, setItemPrice] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');

  const addItem = () => {
    if (!itemName || !itemPrice) return;
    setItems([
      ...items,
      {
        name: itemName,
        quantity: itemQuantity,
        price: parseFloat(itemPrice),
      },
    ]);
    setItemName('');
    setItemQuantity(1);
    setItemPrice('');
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const total = subtotal;

  const handleFinalize = () => {
    onFinalize(items, subtotal, total, pickupTime, specialRequests);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-lg font-bold mb-4">
          Finalizar cotización de {quote.customer_name}
        </h2>

        <div className="space-y-4">
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="Artículo"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              className="flex-1 px-2 py-1 border rounded"
            />
            <input
              type="number"
              min={1}
              value={itemQuantity}
              onChange={(e) => setItemQuantity(parseInt(e.target.value) || 1)}
              className="w-16 px-2 py-1 border rounded"
            />
            <input
              type="number"
              min={0}
              step="0.01"
              placeholder="Precio"
              value={itemPrice}
              onChange={(e) => setItemPrice(e.target.value)}
              className="w-24 px-2 py-1 border rounded"
            />
            <button
              onClick={addItem}
              className="bg-green-500 text-white px-3 rounded"
            >
              Agregar
            </button>
          </div>

          {items.length > 0 && (
            <div className="space-y-2">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center bg-gray-50 p-2 rounded"
                >
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-600">
                      {item.quantity} x ${item.price.toFixed(2)}
                    </p>
                  </div>
                  <button
                    onClick={() => removeItem(index)}
                    className="text-red-500"
                  >
                    <i className="ri-close-line"></i>
                  </button>
                </div>
              ))}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hora de recogida
            </label>
            <input
              type="text"
              value={pickupTime}
              onChange={(e) => setPickupTime(e.target.value)}
              placeholder="10:00 AM"
              className="w-full px-3 py-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Solicitudes especiales
            </label>
            <textarea
              value={specialRequests}
              onChange={(e) => setSpecialRequests(e.target.value)}
              className="w-full px-3 py-2 border rounded"
            />
          </div>

          <div className="border-t pt-2 text-right">
            <p className="font-bold text-lg">
              Total: ${total.toFixed(2)}
            </p>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 rounded"
            >
              Cancelar
            </button>
            <button
              onClick={handleFinalize}
              className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded"
            >
              Finalizar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

