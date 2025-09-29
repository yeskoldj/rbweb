
'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '../../components/Header';
import TabBar from '../../components/TabBar';
import SafeImage from '@/components/SafeImage';

export default function CakesPage() {
  // Pasteles disponibles usando las imágenes reales - PRECIOS CORREGIDOS SEGÚN TABLA
  const cakes = [
    {
      id: 'birthday-classic',
      name: 'Pastel de Cumpleaños Clásico',
      basePrice: 20,
      description:
        'Pastel de cumpleaños personalizable con decoraciones coloridas y tradicionales',
      image:
        'https://static.readdy.ai/image/9733c14590fa269b3349cd88bac6322e/58a3f870af7fe55c1b2733bc57137538.png',
      category: 'birthday',
      popular: true
    },
    {
      id: 'birthday-deluxe',
      name: 'Pastel de Cumpleaños Deluxe',
      basePrice: 30,
      description:
        'Versión deluxe con decoraciones especiales y acabados profesionales',
      image:
        'https://static.readdy.ai/image/9733c14590fa269b3349cd88bac6322e/def4b1d4d19f7bb63fe8ed7acc40b9e6.png',
      category: 'birthday',
      popular: false
    },
    {
      id: 'wedding-elegant',
      name: 'Pastel de Cumpleaños Elegante',
      basePrice: 55,
      description:
        'Inspirado en bodas, con múltiples niveles y decoraciones elegantes',
      image:
        'https://static.readdy.ai/image/9733c14590fa269b3349cd88bac6322e/b55c6989623b0711cfe5124c88d92ed0.png',
      category: 'wedding',
      popular: true
    },
    {
      id: 'quince-princess',
      name: 'Pastel de Cumpleaños Princesa',
      basePrice: 35,
      description:
        'Ideal para quinceañeras con toques principescos y colores vibrantes',
      image:
        'https://static.readdy.ai/image/9733c14590fa269b3349cd88bac6322e/04879db0557315e718d30f6f01a65327.png',
      category: 'quince',
      popular: true
    },
    {
      id: 'photo-cake-basic',
      name: 'Pastel de Cumpleaños con Foto Básico',
      basePrice: 25,
      description:
        'Añade tu foto favorita a un delicioso pastel de cumpleaños',
      image: '',
      category: 'photo',
      popular: false
    },
    {
      id: 'photo-cake-premium',
      name: 'Pastel de Cumpleaños con Foto Premium',
      basePrice: 35,
      description:
        'Versión premium con marco decorativo alrededor de tu foto personalizada',
      image: '',
      category: 'photo',
      popular: false
    }
  ];

  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'Todos', icon: 'ri-cake-3-line' },
    { id: 'birthday', name: 'Cumpleaños', icon: 'ri-gift-line' },
    { id: 'wedding', name: 'Bodas', icon: 'ri-heart-line' },
    { id: 'quince', name: 'Quinceañera', icon: 'ri-star-line' },
    { id: 'photo', name: 'Pastel con Foto', icon: 'ri-camera-line' }
  ];

  const filteredCakes = selectedCategory === 'all' 
    ? cakes 
    : cakes.filter(cake => cake.category === selectedCategory);

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-purple-50">
      <Header />
      <div className="pt-16 pb-20">
        <div className="px-3 py-4">
          <Link href="/" className="inline-flex items-center text-pink-500 mb-4">
            <i className="ri-arrow-left-line mr-2"></i>
            Volver al Inicio
          </Link>

          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-amber-800 mb-2">
              Pasteles Personalizados
            </h1>
            <p className="text-gray-600 text-sm">
              Crea el pastel perfecto para tu ocasión especial
            </p>
          </div>

          {/* Categories */}
          <div className="mb-6 bg-white rounded-xl p-3 shadow-sm">
            <div className="flex overflow-x-auto space-x-2 pb-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex-shrink-0 flex items-center px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedCategory === category.id
                      ? 'bg-gradient-to-r from-pink-400 to-teal-400 text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <i className={`${category.icon} mr-2`}></i>
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          {/* Cakes Grid */}
          <div className="space-y-4">
            {filteredCakes.map((cake) => (
              <div key={cake.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="flex">
                  <div className="w-24 h-24 flex-shrink-0">
                    {cake.category === 'photo' ? (
                      <div className="flex items-center justify-center w-full h-full bg-pink-100 text-pink-500 text-xs text-center p-2">
                        Envíanos tu foto 
                      </div>
                    ) : (
                      <SafeImage
                        src={cake.image}
                        alt={cake.name}
                        width={96}
                        height={96}
                        className="w-full h-full object-cover"
                        sizes="96px"
                      />
                    )}
                  </div>
                  
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <h3 className="font-semibold text-gray-800 text-sm mb-1">
                            {cake.name}
                          </h3>
                          {cake.popular && (
                            <span className="ml-2 bg-pink-100 text-pink-600 text-xs px-2 py-0.5 rounded-full">
                              Popular
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 text-xs mb-2 line-clamp-2">
                          {cake.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-pink-600">
                            Desde ${cake.basePrice}
                          </span>
                          <Link href={`/cakes/${cake.id}`}>
                            <button className="bg-gradient-to-r from-pink-400 to-teal-400 text-white px-4 py-2 rounded-lg text-xs font-medium hover:shadow-md transition-all">
                              Personalizar
                            </button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Info Section */}
          <div className="mt-8 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-200">
            <h3 className="font-bold text-amber-800 mb-3 text-center">
              ¿Cómo funciona?
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start">
                <div className="w-6 h-6 bg-pink-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                  <span className="text-pink-600 font-bold text-xs">1</span>
                </div>
                <p className="text-gray-700">
                  <strong>Selecciona</strong> el tipo de pastel que más te guste
                </p>
              </div>
              <div className="flex items-start">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                  <span className="text-blue-600 font-bold text-xs">2</span>
                </div>
                <p className="text-gray-700">
                  <strong>Personaliza</strong> forma, masas, colores y decoraciones
                </p>
              </div>
              <div className="flex items-start">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                  <span className="text-green-600 font-bold text-xs">3</span>
                </div>
                <p className="text-gray-700">
                  <strong>Ordena</strong> y nosotros lo preparamos especialmente para ti
                </p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-6 bg-gradient-to-r from-pink-400 to-teal-400 rounded-xl p-5 text-white text-center">
            <h3 className="text-lg font-semibold mb-2">¿No encuentras lo que buscas?</h3>
            <p className="text-sm opacity-90 mb-4">
              Contáctanos para crear un diseño completamente personalizado
            </p>
            <Link href="/quote">
              <button className="bg-white/20 backdrop-blur-sm text-white px-8 py-3 rounded-full font-medium !rounded-button">
                Solicitar Cotización
              </button>
            </Link>
          </div>
        </div>
      </div>
      <TabBar />
    </div>
  );
}
