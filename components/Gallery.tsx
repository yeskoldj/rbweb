
'use client';

import { useState } from 'react';
import { useLanguage } from '../lib/languageContext';

export default function Gallery() {
  const { t } = useLanguage();
  const [showModal, setShowModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState('');

  /* 
  🖼️ CÓMO CAMBIAR IMÁGENES DE LA GALERÍA:
  
  PASO 1: Reemplaza las URLs en el array galleryImages
  PASO 2: Cambia los textos en "alt" por descripciones de tus pasteles
  PASO 3: Para mejores resultados, usa imágenes de 300x200px o similar proporción
  
  📸 CONSEJOS PARA MEJORES FOTOS:
  - Usa fotos reales de tus pasteles
  - Buena iluminación natural
  - Fondo limpio (blanco o neutro)
  - Ángulo frontal o ligeramente diagonal
  - Sin sombras fuertes
  
  FORMATOS SOPORTADOS: .jpg, .jpeg, .png, .webp
  RECOMENDACIÓN: Comprime las imágenes para carga rápida
  */
  const galleryImages = [
    {
      // 🔄 CAMBIAR: Pon aquí la URL de tu imagen de pastel de cumpleaños
      src: 'https://static.readdy.ai/image/9733c14590fa269b3349cd88bac6322e/58a3f870af7fe55c1b2733bc57137538.png',
      alt: 'Pastel de cumpleaños con fresas' // 📝 CAMBIAR: Descripción de tu pastel
    },
    {
      // 🔄 CAMBIAR: Pon aquí la URL de tu segunda imagen
      src: 'https://static.readdy.ai/image/9733c14590fa269b3349cd88bac6322e/def4b1d4d19f7bb63fe8ed7acc40b9e6.png',
      alt: 'Pastel de cumpleaños para Elaine' // 📝 CAMBIAR: Descripción de tu pastel
    },
    {
      // 🔄 CAMBIAR: Pon aquí la URL de tu tercera imagen
      src: 'https://static.readdy.ai/image/9733c14590fa269b3349cd88bac6322e/b55c6989623b0711cfe5124c88d92ed0.png',
      alt: 'Pastel de quinceañera' // 📝 CAMBIAR: Descripción de tu pastel
    },
    {
      // 🔄 CAMBIAR: Pon aquí la URL de tu cuarta imagen
      src: 'https://static.readdy.ai/image/9733c14590fa269b3349cd88bac6322e/04879db0557315e718d30f6f01a65327.png',
      alt: 'Pastel de cumpleaños decorado' // 📝 CAMBIAR: Descripción de tu pastel
    },
    {
      // 🔄 CAMBIAR: Pon aquí la URL de tu quinta imagen (pastel de boda)
      src: 'https://readdy.ai/api/search-image?query=Dominican%20wedding%20cake%20elegant%20design%2C%20white%20frosting%20with%20decorative%20flowers%2C%20multi-tier%20celebration%20cake%2C%20professional%20bakery%20photography%2C%20clean%20background&width=300&height=200&seq=gallerywedding1&orientation=landscape',
      alt: 'Pastel de boda elegante' // 📝 CAMBIAR: Descripción de tu pastel
    },
    {
      // 🔄 CAMBIAR: Pon aquí la URL de tu sexta imagen (pastel de graduación)
      src: 'https://readdy.ai/api/search-image?query=Dominican%20graduation%20cake%20with%20cap%20decoration%2C%20academic%20celebration%20theme%2C%20professional%20bakery%20design%2C%20colorful%20frosting%2C%20achievement%20celebration&width=300&height=200&seq=gallerygrad1&orientation=landscape',
      alt: 'Pastel de graduación' // 📝 CAMBIAR: Descripción de tu pastel
    }
  ];

  const openModal = (imageSrc: string) => {
    setSelectedImage(imageSrc);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedImage('');
  };

  return (
    <section className="px-4 py-8">
      {/* 
      📝 CAMBIAR TÍTULO: 
      Reemplaza "Galería de Nuestras Creaciones" por el título que prefieras
      O edita las traducciones en lib/languages.ts
      */}
      <h3 className="text-2xl font-bold text-amber-800 mb-6 text-center">
        Galería de Nuestras Creaciones
      </h3>

      <div className="grid grid-cols-2 gap-4 mb-6">
        {galleryImages.slice(0, 4).map((image, index) => (
          <div key={index} className="aspect-video rounded-lg overflow-hidden shadow-lg cursor-pointer">
            <img 
              src={image.src}
              alt={image.alt} 
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              onClick={() => openModal(image.src)}
            />
          </div>
        ))}
      </div>

      <div className="text-center">
        <button 
          onClick={() => openModal(galleryImages[0].src)}
          className="bg-white border-2 border-pink-300 text-pink-500 px-5 py-2 rounded-xl font-medium shadow-sm hover:bg-pink-50 transition-colors text-sm"
        >
          Ver Más Fotos
        </button>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="relative bg-white rounded-xl max-w-4xl max-h-full overflow-hidden">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors z-10"
            >
              <i className="ri-close-line text-xl"></i>
            </button>
            
            <div className="p-4">
              <h4 className="text-xl font-bold text-amber-800 mb-4 text-center">
                Nuestras Creaciones
              </h4>
              
              <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                {galleryImages.map((image, index) => (
                  <div key={index} className="aspect-video rounded-lg overflow-hidden">
                    <img 
                      src={image.src}
                      alt={image.alt}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
              
              <div className="mt-4 text-center">
                {/* 
                🔗 CÓMO CAMBIAR ENLACE DE INSTAGRAM:
                1. Reemplaza "https://www.instagram.com/rangersbakery/" con tu cuenta de Instagram
                2. Formato: https://www.instagram.com/TU_USUARIO/
                3. Asegúrate de que el enlace funcione antes de publicar
                */}
                <a 
                  href="https://www.instagram.com/rangersbakery/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center bg-gradient-to-r from-pink-400 to-teal-400 text-white px-5 py-2.5 rounded-xl font-medium hover:shadow-md transition-all text-sm"
                >
                  <i className="ri-instagram-line mr-2 text-base"></i>
                  Ver más en Instagram
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
