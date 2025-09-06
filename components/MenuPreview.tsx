
'use client';

import Link from 'next/link';
import { useLanguage } from '../lib/languageContext';

export default function MenuPreview() {
  const { t } = useLanguage();

  /* 
  🍰 CÓMO CAMBIAR PRODUCTOS DESTACADOS:
  
  PASO 1: Modifica los objetos en el array featuredItems
  PASO 2: Cambia name, price, description por tus productos
  PASO 3: Reemplaza las URLs de las imágenes con tus fotos
  PASO 4: Ajusta los precios en formato "$XX.XX"
  
  📸 PARA MEJORES IMÁGENES:
  - Usa fotos reales de tus productos
  - Resolución recomendada: 300x200px
  - Fondo limpio y bien iluminado
  - Formato: .jpg o .webp para mejor rendimiento
  
  RECOMENDACIÓN: Usa 3-6 productos más populares
  */
  const featuredItems = [
    {
      id: 1,
      // 📝 CAMBIAR: Nombre de tu producto destacado #1
      name: 'Tres Leches Clásico',
      // 💰 CAMBIAR: Precio de tu producto (formato: "$XX.XX")
      price: '$25.00',
      // 📝 CAMBIAR: Descripción de tu producto (máximo 80 caracteres)
      description: 'Bizcocho empapado en tres tipos de leche con canela',
      // 🖼️ CAMBIAR: URL de la imagen de tu producto
      image: 'https://readdy.ai/api/search-image?query=Traditional%20Dominican%20tres%20leches%20cake%20slice%2C%20soaked%20sponge%20cake%20with%20three%20milks%2C%20cinnamon%20dusting%2C%20creamy%20white%20dessert%2C%20professional%20bakery%20photography%2C%20clean%20background&width=300&height=200&seq=treslech1&orientation=landscape',
      category: 'specialty'
    },
    {
      id: 2,
      // 📝 CAMBIAR: Nombre de tu producto destacado #2
      name: 'Flan de Coco',
      // 💰 CAMBIAR: Precio de tu segundo producto
      price: '$18.00',
      // 📝 CAMBIAR: Descripción de tu segundo producto
      description: 'Flan cremoso con sabor a coco natural y caramelo',
      // 🖼️ CAMBIAR: URL de la imagen de tu segundo producto
      image: 'https://readdy.ai/api/search-image?query=Dominican%20coconut%20flan%20dessert%2C%20creamy%20caramel%20custard%20with%20coconut%20flavor%2C%20traditional%20Caribbean%20dessert%2C%20professional%20food%20photography%2C%20clean%20background&width=300&height=200&seq=flancoco1&orientation=landscape',
      category: 'desserts'
    },
    {
      id: 3,
      // 📝 CAMBIAR: Nombre de tu producto destacado #3
      name: 'Cake de Cumpleaños',
      // 💰 CAMBIAR: Precio de tu tercer producto
      price: '$35.00',
      // 📝 CAMBIAR: Descripción de tu tercer producto
      description: 'Cake personalizado con decoración especial',
      // 🖼️ CAMBIAR: URL de la imagen de tu tercer producto
      image: 'https://readdy.ai/api/search-image?query=Dominican%20birthday%20cake%20with%20colorful%20frosting%2C%20custom%20decorated%20celebration%20cake%2C%20vibrant%20design%20with%20candles%2C%20professional%20bakery%20photography%2C%20clean%20background&width=300&height=200&seq=birthdaycake1&orientation=landscape',
      category: 'cakes'
    }
  ];

  return (
    <section className="px-4 py-8">
      {/* 
      📝 CAMBIAR TÍTULO DE SECCIÓN:
      El título se toma automáticamente de las traducciones
      Para cambiarlo, edita lib/languages.ts línea "featuredProducts"
      */}
      <h3 className="text-2xl font-bold text-amber-800 mb-6 text-center">
        {t('featuredProducts')}
      </h3>
      
      <div className="space-y-4 mb-6">
        {featuredItems.map((item) => (
          <div key={item.id} className="bg-white rounded-xl shadow-sm p-4 flex space-x-4">
            <div className="w-20 h-20 flex-shrink-0">
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-full object-cover rounded-lg"
              />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-800 mb-1">{item.name}</h4>
              <p className="text-gray-600 text-sm mb-2 line-clamp-2">{item.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-pink-600">{item.price}</span>
                <button 
                  className="bg-gradient-to-r from-pink-400 to-teal-400 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:shadow-md transition-all"
                  onClick={() => {
                    // Añadir al carrito localmente
                    const cartItem = {
                      id: item.id,
                      name: item.name,
                      price: item.price,
                      quantity: 1,
                      image: item.image
                    };
                    
                    const existingCart = localStorage.getItem('bakery-cart');
                    let cart = existingCart ? JSON.parse(existingCart) : [];
                    
                    const existingItemIndex = cart.findIndex((cartItem: any) => cartItem.id === item.id);
                    
                    if (existingItemIndex > -1) {
                      cart[existingItemIndex].quantity += 1;
                    } else {
                      cart.push(cartItem);
                    }
                    
                    localStorage.setItem('bakery-cart', JSON.stringify(cart));
                    alert(`${item.name} agregado al carrito`);
                  }}
                >
                  {t('addToCart')}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="text-center">
        <Link 
          href="/menu"
          className="bg-gradient-to-r from-amber-600 to-amber-700 text-white px-5 py-2.5 rounded-xl font-medium hover:shadow-md transition-all inline-block text-sm"
        >
          {t('seeFullMenu')}
        </Link>
      </div>
    </section>
  );
}
