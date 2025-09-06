
'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '../lib/languageContext';

interface Review {
  id: string;
  author_name: string;
  rating: number;
  text: string;
  time: number;
  profile_photo_url?: string;
  relative_time_description: string;
}

export default function Reviews() {
  const { t } = useLanguage();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);

  useEffect(() => {
    fetchGoogleReviews();
  }, []);

  const fetchGoogleReviews = async () => {
    try {
      setLoading(true);
      
      // Simulando delay de API para mostrar loading
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Estado vacío ya que no tenemos reseñas reales aún
      setReviews([]);
      setTotalReviews(0);
      setAverageRating(0);
      
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number, size: string = 'text-sm') => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <i
          key={i}
          className={`${i <= rating ? 'ri-star-fill' : 'ri-star-line'} ${size} ${
            i <= rating ? 'text-yellow-400' : 'text-gray-300'
          }`}
        />
      );
    }
    return stars;
  };

  const writeReview = () => {
    /* 
    🔗 CÓMO CONFIGURAR EL ENLACE DE GOOGLE REVIEWS:
    
    PASO 1: Reemplaza la URL con tu enlace específico de Google My Business
    PASO 2: Formato: https://www.google.com/search?q=TU_NEGOCIO+reviews
    PASO 3: O usa el enlace directo de tu perfil de Google My Business
    
    EJEMPLO: Si tu negocio se llama "Mi Panadería" en "Calle 123":
    https://www.google.com/search?q=Mi+Panadería+Calle+123+reviews
    */
    window.open('https://www.google.com/search?q=Rangers+Bakery+3657+John+F.+Kennedy+Blvd+Jersey+City+NJ+07307+reviews', '_blank');
  };

  if (loading) {
    return (
      <section className="px-4 py-8">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-pink-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">{t('loadingReviews')}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="px-4 py-8">
      <h3 className="text-2xl font-bold text-amber-800 mb-6 text-center">
        {t('clientReviews')}
      </h3>

      {/* Resumen de Calificaciones */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="text-center">
          <div className="text-4xl font-bold text-amber-800 mb-2">{averageRating || '—'}</div>
          <div className="flex justify-center mb-2">
            {averageRating > 0 ? renderStars(Math.round(averageRating), 'text-lg') : (
              <span className="text-gray-400 text-sm">{t('waitingReviews')}</span>
            )}
          </div>
          <div className="text-gray-600 text-sm">
            {t('basedOnReviews').replace('{count}', totalReviews.toString())}
          </div>
        </div>
        
        <div className="mt-6 text-center">
          <button
            onClick={writeReview}
            className="bg-gradient-to-r from-pink-400 to-teal-400 text-white px-5 py-2.5 rounded-xl font-medium hover:shadow-md transition-all text-sm"
          >
            <i className="ri-edit-line mr-2 text-base"></i>
            {t('writeReview')}
          </button>
        </div>
      </div>

      {/* Lista de Reseñas */}
      <div className="space-y-4">
        {reviews.length === 0 && (
          <div className="text-center py-8">
            <div className="w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <i className="ri-star-line text-gray-300 text-4xl"></i>
            </div>
            <p className="text-gray-500 mb-4">{t('beFirstReview')}</p>
            <button
              onClick={writeReview}
              className="text-pink-500 hover:text-pink-600 font-medium text-sm"
            >
              {t('shareExperience')}
              <i className="ri-arrow-right-line ml-1"></i>
            </button>
          </div>
        )}
        
        {reviews.map((review) => (
          <div key={review.id} className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-gray-200">
                <img
                  src={review.profile_photo_url || ''}
                  alt={review.author_name}
                  className="w-full h-full object-cover"
                />
              </div>
              
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-800">{review.author_name}</h4>
                  <span className="text-xs text-gray-500">{review.relative_time_description}</span>
                </div>
                
                <div className="flex items-center mb-2">
                  {renderStars(review.rating)}
                </div>
                
                <p className="text-gray-600 text-sm leading-relaxed">{review.text}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Enlace a Google Reviews */}
      <div className="mt-6 text-center">
        {/* 
        🔗 CÓMO CAMBIAR ENLACE DE GOOGLE MAPS:
        Reemplaza con la dirección exacta de tu negocio
        Formato: https://www.google.com/maps/place/TU_DIRECCION_COMPLETA
        */}
        <button
          onClick={() => window.open('https://www.google.com/maps/place/3657+John+F.+Kennedy+Blvd,+Jersey+City,+NJ+07307', '_blank')}
          className="text-pink-500 hover:text-pink-600 text-sm font-medium"
        >
          {t('viewOnGoogleMaps')}
          <i className="ri-external-link-line ml-1"></i>
        </button>
      </div>
    </section>
  );
}
