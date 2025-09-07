
'use client';

import { useLanguage } from '../lib/languageContext';

export default function PriceList() {
  const { language, t } = useLanguage();

  // PRECIOS ACTUALIZADOS SEGÚN TABLA OFICIAL
  const singleTierPrices = [
    { size: '6"', price: '$20', people: '4-6 personas' },
    { size: '8"', price: '$30', people: '8-10 personas' },
    { size: '10"', price: '$35', people: '10-15 personas' },
    { size: '12" (1 lb)', price: '$55', people: '20-25 personas' },
    { size: '14"', price: '$80', people: '35-40 personas' }
  ];

  const doubleTierPrices = [
    { size: 'Doble 6"', price: '$70', people: '10-12 personas' },
    { size: 'Doble 8"', price: '$80', people: '25-30 personas' },
    { size: 'Doble 10"', price: '$115', people: '30-40 personas' },
    { size: 'Doble 12"', price: '$135', people: '50-60 personas' }
  ];

  const tripleTierPrices = [
    { size: 'Triple 6"', price: '$90', people: '' },
    { size: 'Triple 8"', price: '$115', people: '' },
    { size: 'Triple 10"', price: '$140', people: '' }
  ];

  // PASTELES MULTINIVEL SEGÚN TABLA OFICIAL
  const eventPrices = [
    { people: '50+ personas', description: '6" + 10"', price: '$190+' },
    { people: '65+ personas', description: '8" + 12"', price: '$250+' },
    { people: '80+ personas', description: '10" + 12"', price: '$350+' },
    { people: '100+ personas', description: '10" + 14"', price: '$450+' },
    { people: '125+ personas', description: '6" + 8" + 12"', price: '$500' },
    { people: '150+ personas', description: '6" + 10" + 14"', price: '$650' }
  ];

  // DECORACIONES ACTUALIZADAS SEGÚN TABLA OFICIAL
  const decorations = [
    { name: 'Flores naturales', price: '$30' },
    { name: 'Cascada de flores', price: '$60' },
    { name: 'Derretidos', price: '$20' },
    { name: 'Flores de azúcar', price: '$20+' },
    { name: 'Perlas', price: '$10+' },
    { name: 'Bolas', price: '$15+' },
    { name: 'Cut Out', price: '$15+' },
    { name: 'Mariposas', price: '$10' },
    { name: 'Lazos', price: '$7' },
    { name: 'Flores de mentira', price: '$20' }
  ];

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-amber-800 mb-2">
          Precios de Pasteles - Ranger's Bakery
        </h1>
        <p className="text-gray-600">Lista oficial de precios actualizada</p>
      </div>

      {/* Tamaños Individuales */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-pink-600 mb-4 flex items-center">
          <i className="ri-cake-line mr-3"></i>
          TAMAÑOS SENCILLOS (1 piso)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {singleTierPrices.map((item, index) => (
            <div key={index} className="bg-pink-50 rounded-lg p-4 border border-pink-200">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-bold text-amber-800">{item.size}</div>
                  <div className="text-sm text-gray-600">{item.people}</div>
                </div>
                <div className="text-xl font-bold text-pink-600">{item.price}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Doble Piso */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-pink-600 mb-4 flex items-center">
          <i className="ri-stack-line mr-3"></i>
          DOBLE (2 pisos del mismo tamaño)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {doubleTierPrices.map((item, index) => (
            <div key={index} className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-bold text-amber-800">{item.size}</div>
                  <div className="text-sm text-gray-600">{item.people}</div>
                </div>
                <div className="text-xl font-bold text-purple-600">{item.price}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Triple Piso */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-pink-600 mb-4 flex items-center">
          <i className="ri-building-3-line mr-3"></i>
          TRIPLE (3 pisos del mismo tamaño)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {tripleTierPrices.map((item, index) => (
            <div key={index} className="bg-teal-50 rounded-lg p-4 border border-teal-200">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-bold text-amber-800">{item.size}</div>
                </div>
                <div className="text-xl font-bold text-teal-600">{item.price}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pasteles Grandes para Eventos */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-pink-600 mb-4 flex items-center">
          <i className="ri-celebration-line mr-3"></i>
          MULTINIVEL (combinados por cantidad de personas)
        </h2>
        <div className="bg-amber-50 rounded-xl p-4 mb-4 border border-amber-200">
          <p className="text-sm text-amber-800 font-medium">
            📋 <strong>Nota "Camuflaje":</strong> En la lámina 2 aparece un precio alternativo si el pastel es Camuflaje: 
            1. $150+ | 2) $195+ | 3) $250+ | 4) $350+ | 5) $450
          </p>
        </div>
        <div className="space-y-3">
          {eventPrices.map((item, index) => (
            <div key={index} className="bg-amber-50 rounded-lg p-4 border border-amber-200">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div className="mb-2 md:mb-0">
                  <div className="font-bold text-amber-800">{item.people}</div>
                  <div className="text-sm text-gray-600">
                    {item.description}
                    <span className="text-xs text-gray-500 block">
                      Cada tamaño se indica como un piso de "2 layers".
                    </span>
                  </div>
                </div>
                <div className="text-xl font-bold text-amber-600">{item.price}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Decoraciones y Extras */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-pink-600 mb-4 flex items-center">
          <i className="ri-palette-line mr-3"></i>
          EXTRAS / DECORACIONES
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {decorations.map((item, index) => (
            <div key={index} className="bg-green-50 rounded-lg p-3 border border-green-200">
              <div className="text-center">
                <div className="font-medium text-amber-800 text-sm mb-1">{item.name}</div>
                <div className="text-lg font-bold text-green-600">{item.price}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <i className="ri-information-line text-blue-600 mr-2 mt-0.5"></i>
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">Nota "Camuflaje":</p>
              <p>
                En la lámina 2 aparece un precio alternativo si el pastel es Camuflaje. 
                El "+" depende de la cantidad solicitada. 
                <strong>(El "+" depende de la cantidad)</strong>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-gradient-to-r from-pink-100 to-purple-100 rounded-xl p-6 text-center">
        <h3 className="text-xl font-bold text-amber-800 mb-4">
          ¿Necesitas un presupuesto personalizado?
        </h3>
        <div className="flex flex-col md:flex-row gap-4 justify-center">
          <a 
            href="https://wa.me/12014968731?text=Hola%2C%20me%20interesa%20cotizar%20un%20pastel"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-green-500 text-white px-6 py-3 rounded-full font-medium flex items-center justify-center hover:bg-green-600 transition-all"
          >
            <i className="ri-whatsapp-line mr-2"></i>
            WhatsApp: +1 (201) 496-8731
          </a>
          <a 
            href="tel:+18622337204"
            className="bg-pink-500 text-white px-6 py-3 rounded-full font-medium flex items-center justify-center hover:bg-pink-600 transition-all"
          >
            <i className="ri-phone-line mr-2"></i>
            Llamar: (862) 233-7204
          </a>
        </div>
      </div>
    </div>
  );
}
