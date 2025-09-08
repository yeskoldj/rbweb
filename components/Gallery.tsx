
'use client';

import { useState } from 'react';
import { useLanguage } from '../lib/languageContext';

export default function Gallery() {
  const { t } = useLanguage();
  const [showModal, setShowModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState('');

  // Galería usando las imágenes reales de los pasteles
  const galleryImages = [
    {
      src: 'https://static.readdy.ai/image/9733c14590fa269b3349cd88bac6322e/58a3f870af7fe55c1b2733bc57137538.png',
      alt: 'Pastel de cumpleaños con fresas'
    },
    {
      src: 'https://static.readdy.ai/image/9733c14590fa269b3349cd88bac6322e/def4b1d4d19f7bb63fe8ed7acc40b9e6.png',
      alt: 'Pastel de cumpleaños para Elaine'
    },
    {
      src: 'https://static.readdy.ai/image/9733c14590fa269b3349cd88bac6322e/b55c6989623b0711cfe5124c88d92ed0.png',
      alt: 'Pastel de quinceañera'
    },
    {
      src: 'https://static.readdy.ai/image/9733c14590fa269b3349cd88bac6322e/04879db0557315e718d30f6f01a65327.png',
      alt: 'Pastel de cumpleaños decorado'
    },
    {
      src: 'https://static.readdy.ai/image/9733c14590fa269b3349cd88bac6322e/6e38ec235b30b7a74f673bc044a87814.jfif',
      alt: 'Tres Leches en Vaso'
    },
    {
      src: 'https://static.readdy.ai/image/9733c14590fa269b3349cd88bac6322e/ae1f7420251af709ef833638a428a131.jfif',
      alt: 'Cheesecake dominicano'
    },
    {
      src: 'https://static.readdy.ai/image/9733c14590fa269b3349cd88bac6322e/3426923c2c21bd56dac155cac89400e3.jfif',
      alt: 'Tres Leches de Oreo'
    },
    {
      src: 'https://static.readdy.ai/image/9733c14590fa269b3349cd88bac6322e/33b32b1e5581c150ed0666763a12e667.jfif',
      alt: 'Flan casero dominicano'
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
      <h3 className="text-2xl font-bold text-amber-800 mb-6 text-center">
        {t('galleryHeading')}
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
          {t('viewMorePhotos')}
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
                {t('galleryModalHeading')}
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
                <a 
                  href="https://www.instagram.com/rangersbakery/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center bg-gradient-to-r from-pink-400 to-teal-400 text-white px-5 py-2.5 rounded-xl font-medium hover:shadow-md transition-all text-sm"
                >
                  <i className="ri-instagram-line mr-2 text-base"></i>
                  {t('seeMoreOnInstagram')}
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
