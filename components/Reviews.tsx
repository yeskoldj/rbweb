
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../lib/languageContext';
import SafeImage from './SafeImage';

interface Review {
  id: string;
  author_name: string;
  rating: number;
  text: string;
  time?: number;
  profile_photo_url?: string;
  relative_time_description?: string;
}

const normalizeReviews = (rawReviews: unknown[]): Review[] => {
  return rawReviews
    .filter((review): review is Record<string, unknown> => typeof review === 'object' && review !== null)
    .map((review, index) => {
      const providedId = typeof review.id === 'string' ? review.id.trim() : '';
      const time = typeof review.time === 'number' ? review.time : undefined;
      const author = typeof review.author_name === 'string' && review.author_name.trim().length > 0
        ? review.author_name
        : 'Guest';
      const rating = typeof review.rating === 'number' ? review.rating : 0;
      const text = typeof review.text === 'string' ? review.text : '';
      const relativeTime = typeof review.relative_time_description === 'string'
        ? review.relative_time_description
        : undefined;
      const profilePhoto = typeof review.profile_photo_url === 'string'
        ? review.profile_photo_url
        : undefined;

      return {
        id:
          providedId ||
          (time !== undefined
            ? time.toString()
            : `${author.replace(/\s+/g, '-').toLowerCase()}-${index}`),
        author_name: author,
        rating,
        text,
        time,
        profile_photo_url: profilePhoto,
        relative_time_description: relativeTime,
      };
    });
};

export default function Reviews() {
  const { t } = useLanguage();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [setupRequired, setSetupRequired] = useState(false);
  const [corsError, setCorsError] = useState(false);
  const [currentOrigin, setCurrentOrigin] = useState('');
  const [apiError, setApiError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchGoogleReviews = useCallback(async () => {
    try {
      setLoading(true);
      setSetupRequired(false);
      setApiError(false);
      setCorsError(false);
      setErrorMessage('');

      // Simulando delay de API para mostrar loading
      await new Promise(resolve => setTimeout(resolve, 1000));
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl) {
        setSetupRequired(true);
        setReviews([]);
        setTotalReviews(0);
        setAverageRating(0);
        return;
      }

      if (!supabaseAnonKey) {
        setSetupRequired(true);
        setReviews([]);
        setTotalReviews(0);
        setAverageRating(0);
        return;
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/google-reviews`, {
        headers: {
          'Content-Type': 'application/json',
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
        },
      });

      const data = await response.json().catch(() => null);

      const forbiddenOrigin =
        response.status === 403 ||
        (typeof data?.error === 'string' && data.error.toLowerCase().includes('forbidden origin'));

      if (response.ok && data?.success) {
        const normalizedReviews = Array.isArray(data.reviews) ? normalizeReviews(data.reviews) : [];
        setReviews(normalizedReviews);
        setTotalReviews(typeof data.totalReviews === 'number' ? data.totalReviews : 0);
        setAverageRating(typeof data.averageRating === 'number' ? data.averageRating : 0);
        return;
      }

      if (forbiddenOrigin) {
        setCorsError(true);
        setSetupRequired(true);
      }

      if (typeof data?.message === 'string' && data.message.trim().length > 0) {
        setErrorMessage(data.message);
      }

      if (data?.setupRequired) {
        setSetupRequired(true);
      } else {
        setApiError(true);
      }

      setReviews([]);
      setTotalReviews(0);
      setAverageRating(0);

    } catch (error) {
      console.error('Error fetching reviews:', error);
      setApiError(true);
      if (error instanceof Error && error.message) {
        setErrorMessage(error.message);
      }
      setReviews([]);
      setTotalReviews(0);
      setAverageRating(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentOrigin(window.location.origin);
    }
    fetchGoogleReviews();
  }, [fetchGoogleReviews]);

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

      {setupRequired && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-amber-900">
          <p className="text-sm">{t('reviewsSetupUnavailable')}</p>
        </div>
      )}

      {corsError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-red-700">
          <h4 className="font-semibold mb-2">{t('reviewsSetupCorsErrorTitle')}</h4>
          <p className="text-sm">
            {currentOrigin
              ? t('reviewsSetupCorsErrorDescription').replace('{origin}', currentOrigin)
              : t('reviewsSetupCorsErrorDescriptionNoOrigin')}
          </p>
        </div>
      )}

      {apiError && !setupRequired && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-red-700 text-sm space-y-2">
          <p>{t('reviewsSetupError')}</p>
          {errorMessage && (
            <p className="text-xs">{t('reviewsSetupErrorDetails').replace('{message}', errorMessage)}</p>
          )}
        </div>
      )}

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
          <p className="mt-3 text-xs text-gray-500 max-w-md mx-auto">
            {t('reviewsGoogleOnlyDisclaimer')}
          </p>
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
            <p className="mt-3 text-xs text-gray-400 max-w-sm mx-auto">
              {t('reviewsGoogleOnlyDisclaimer')}
            </p>
          </div>
        )}
        
        {reviews.map((review) => (
          <div key={review.id} className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-start space-x-3">
              <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-gray-200">
                <SafeImage
                  src={review.profile_photo_url || undefined}
                  alt={review.author_name}
                  fill
                  className="object-cover"
                  sizes="40px"
                  fallbackSrc="/images/avatar-placeholder.svg"
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
